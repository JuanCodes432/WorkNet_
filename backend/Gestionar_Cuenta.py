"""API de cuentas Worknet con SQLite y componentes de la biblioteca estándar."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from http import HTTPStatus
from http.cookies import CookieError, SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE = Path(__file__).resolve().parent / "worknet.sqlite3"
DATABASE_PATH = Path(os.environ.get("WORKNET_DB_PATH", DEFAULT_DATABASE))
HOST = os.environ.get("WORKNET_HOST", "127.0.0.1")
PORT = int(os.environ.get("WORKNET_PORT", "8000"))
SESSION_COOKIE = "worknet_session"
SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60
PASSWORD_ITERATIONS = 600_000
MAX_REQUEST_BYTES = 64 * 1024

PROFILE_DEFAULTS: dict[str, Any] = {
    "name": "",
    "profession": "",
    "city": "",
    "university": "",
    "photoUrl": "",
    "coverEyebrow": "",
    "coverTitle": "",
    "about": [],
    "interests": [],
    "education": [],
    "experience": [],
    "activity": [],
    "punctuality": {"onTime": 0, "total": 0},
    "hasUnreadMessages": False,
    "shareUrl": "",
}
REQUIRED_PROFILE_FIELDS = ("name", "profession", "city", "university")
PROFILE_TEXT_LIMITS = {
    "name": 120,
    "profession": 160,
    "city": 160,
    "university": 200,
    "photoUrl": 2048,
    "coverEyebrow": 100,
    "coverTitle": 240,
    "shareUrl": 2048,
}
CITIES = [
    {"id": "popayan", "name": "Popayán, Cauca"},
    {"id": "cali", "name": "Cali, Valle del Cauca"},
    {"id": "bogota", "name": "Bogotá, D.C."},
    {"id": "medellin", "name": "Medellín, Antioquia"},
]


class AccountError(Exception):
    """Error de validación o estado de una cuenta, con estado HTTP asociado."""

    def __init__(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.status = status


class GestorCuentas:
    """Gestiona cuentas, perfiles y sesiones persistidos en una base SQLite."""

    def __init__(self, database_path: Path | str = DATABASE_PATH):
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _initialize_database(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL UNIQUE,
                    password_salt BLOB NOT NULL,
                    password_hash BLOB NOT NULL,
                    profile_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS sessions_account_id_idx
                    ON sessions(account_id);
                """
            )

    @staticmethod
    def _normalize_email(email: Any) -> str:
        if not isinstance(email, str):
            raise AccountError("El correo electrónico es obligatorio.")
        normalized = email.strip().lower()
        if len(normalized) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise AccountError("El correo electrónico no es válido.")
        return normalized

    @staticmethod
    def _password_bytes(password: Any) -> bytes:
        if not isinstance(password, str) or len(password) < 12:
            raise AccountError("La contraseña debe tener al menos 12 caracteres.")
        if len(password) > 1024:
            raise AccountError("La contraseña es demasiado larga.")
        return password.encode("utf-8")

    @staticmethod
    def _normalize_profile(
        profile: Any, existing: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        if not isinstance(profile, dict):
            raise AccountError("El perfil debe ser un objeto JSON.")

        normalized = {**PROFILE_DEFAULTS, **(existing or {})}
        for field in PROFILE_DEFAULTS:
            if field in profile:
                normalized[field] = profile[field]

        for field, max_length in PROFILE_TEXT_LIMITS.items():
            value = normalized[field]
            if not isinstance(value, str):
                raise AccountError(f"El campo {field} debe ser texto.")
            value = value.strip()
            if len(value) > max_length:
                raise AccountError(f"El campo {field} supera el máximo de {max_length} caracteres.")
            normalized[field] = value

        for field in REQUIRED_PROFILE_FIELDS:
            if not normalized[field]:
                raise AccountError(f"El campo {field} es obligatorio.")

        for field in ("about", "interests"):
            values = normalized[field]
            if not isinstance(values, list) or len(values) > 50:
                raise AccountError(f"El campo {field} debe ser una lista de hasta 50 elementos.")
            if any(not isinstance(value, str) or len(value) > 4000 for value in values):
                raise AccountError(f"El campo {field} contiene un elemento no válido.")
            normalized[field] = [value.strip() for value in values if value.strip()]

        for field in ("education", "experience", "activity"):
            items = normalized[field]
            if not isinstance(items, list) or len(items) > 50:
                raise AccountError(f"El campo {field} debe ser una lista de hasta 50 elementos.")
            if any(not isinstance(item, dict) for item in items):
                raise AccountError(f"El campo {field} contiene un elemento no válido.")
            try:
                json.dumps(items, ensure_ascii=False)
            except (TypeError, ValueError) as error:
                raise AccountError(f"El campo {field} contiene datos no válidos.") from error

        for field in ("punctuality",):
            try:
                json.dumps(normalized[field], ensure_ascii=False)
            except (TypeError, ValueError) as error:
                raise AccountError(f"El campo {field} contiene datos no válidos.") from error
        if not isinstance(normalized["hasUnreadMessages"], bool):
            raise AccountError("El campo hasUnreadMessages debe ser booleano.")

        return normalized

    @staticmethod
    def _hash_password(password: bytes, salt: bytes) -> bytes:
        return hashlib.pbkdf2_hmac("sha256", password, salt, PASSWORD_ITERATIONS)

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def crear_cuenta(self, email: str, password: str, profile: dict[str, Any]) -> int:
        """Crea una cuenta y devuelve su identificador interno."""
        normalized_email = self._normalize_email(email)
        password_bytes = self._password_bytes(password)
        normalized_profile = self._normalize_profile(profile)
        salt = secrets.token_bytes(16)
        password_hash = self._hash_password(password_bytes, salt)

        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    INSERT INTO accounts (email, password_salt, password_hash, profile_json)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        normalized_email,
                        salt,
                        password_hash,
                        json.dumps(normalized_profile, ensure_ascii=False),
                    ),
                )
                return int(cursor.lastrowid)
        except sqlite3.IntegrityError as error:
            raise AccountError(
                "Ya existe una cuenta con ese correo electrónico.",
                HTTPStatus.CONFLICT,
            ) from error

    def autenticar_cuenta(self, email: str, password: str) -> int | None:
        """Verifica credenciales y devuelve el identificador o None."""
        normalized_email = self._normalize_email(email)
        if not isinstance(password, str):
            return None

        with self._connect() as connection:
            account = connection.execute(
                "SELECT id, password_salt, password_hash FROM accounts WHERE email = ?",
                (normalized_email,),
            ).fetchone()
        if account is None:
            return None

        candidate = self._hash_password(password.encode("utf-8"), account["password_salt"])
        if not hmac.compare_digest(candidate, account["password_hash"]):
            return None
        return int(account["id"])

    def obtener_perfil(self, account_id: int) -> dict[str, Any]:
        with self._connect() as connection:
            account = connection.execute(
                "SELECT profile_json FROM accounts WHERE id = ?", (account_id,)
            ).fetchone()
        if account is None:
            raise AccountError("La cuenta no existe.", HTTPStatus.NOT_FOUND)
        return json.loads(account["profile_json"])

    def editar_cuenta(self, account_id: int, profile: dict[str, Any]) -> dict[str, Any]:
        """Actualiza los campos proporcionados y devuelve el perfil completo."""
        current_profile = self.obtener_perfil(account_id)
        normalized_profile = self._normalize_profile(profile, current_profile)
        with self._connect() as connection:
            cursor = connection.execute(
                "UPDATE accounts SET profile_json = ? WHERE id = ?",
                (json.dumps(normalized_profile, ensure_ascii=False), account_id),
            )
        if cursor.rowcount == 0:
            raise AccountError("La cuenta no existe.", HTTPStatus.NOT_FOUND)
        return normalized_profile

    def eliminar_cuenta(self, account_id: int) -> None:
        """Elimina una cuenta; SQLite elimina en cascada sus sesiones."""
        with self._connect() as connection:
            cursor = connection.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
        if cursor.rowcount == 0:
            raise AccountError("La cuenta no existe.", HTTPStatus.NOT_FOUND)

    def crear_sesion(self, account_id: int) -> str:
        token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(token)
        expires_at = int(time.time()) + SESSION_DURATION_SECONDS
        with self._connect() as connection:
            connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (int(time.time()),))
            try:
                connection.execute(
                    "INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)",
                    (token_hash, account_id, expires_at),
                )
            except sqlite3.IntegrityError as error:
                raise AccountError("La cuenta no existe.", HTTPStatus.NOT_FOUND) from error
        return token

    def obtener_id_por_sesion(self, token: str) -> int | None:
        if not token:
            return None
        with self._connect() as connection:
            session = connection.execute(
                "SELECT account_id FROM sessions WHERE token_hash = ? AND expires_at > ?",
                (self._hash_token(token), int(time.time())),
            ).fetchone()
        return int(session["account_id"]) if session else None

    def eliminar_sesion(self, token: str) -> None:
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM sessions WHERE token_hash = ?", (self._hash_token(token),)
            )


GESTOR = GestorCuentas()


class WorkNetRequestHandler(SimpleHTTPRequestHandler):
    """Sirve la web estática y expone la API JSON de cuentas."""

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def log_message(self, format_string: str, *args: Any) -> None:
        print(f"[Worknet] {self.address_string()} - {format_string % args}")

    def _send_json(self, status: HTTPStatus, body: Any) -> None:
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _send_empty(self, status: HTTPStatus, clear_session: bool = False) -> None:
        self.send_response(status)
        self.send_header("Cache-Control", "no-store")
        if clear_session:
            self.send_header(
                "Set-Cookie",
                f"{SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
            )
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _send_session(self, token: str) -> None:
        cookie = (
            f"{SESSION_COOKIE}={token}; Path=/; HttpOnly; SameSite=Lax; "
            f"Max-Age={SESSION_DURATION_SECONDS}"
        )
        if os.environ.get("WORKNET_COOKIE_SECURE") == "1":
            cookie += "; Secure"
        self.send_header("Set-Cookie", cookie)

    def _read_json(self) -> dict[str, Any]:
        content_type = self.headers.get_content_type()
        if content_type != "application/json":
            raise AccountError("Envía el contenido con Content-Type application/json.")
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise AccountError("El tamaño de la solicitud no es válido.") from error
        if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
            raise AccountError("El cuerpo debe tener entre 1 byte y 64 KB.")
        try:
            body = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise AccountError("El cuerpo de la solicitud no contiene JSON válido.") from error
        if not isinstance(body, dict):
            raise AccountError("El cuerpo debe ser un objeto JSON.")
        return body

    def _session_token(self) -> str:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except CookieError as error:
            raise AccountError("La sesión no es válida.", HTTPStatus.UNAUTHORIZED) from error
        morsel = cookie.get(SESSION_COOKIE)
        token = morsel.value if morsel else ""
        if not token:
            raise AccountError("Inicia sesión para continuar.", HTTPStatus.UNAUTHORIZED)
        return token

    def _account_id(self) -> int:
        account_id = GESTOR.obtener_id_por_sesion(self._session_token())
        if account_id is None:
            raise AccountError("Inicia sesión para continuar.", HTTPStatus.UNAUTHORIZED)
        return account_id

    def _handle_api(self) -> None:
        path = urlparse(self.path).path
        try:
            if self.command == "GET" and path == "/api/cities":
                self._send_json(HTTPStatus.OK, CITIES)
                return

            if self.command == "POST" and path == "/api/accounts":
                body = self._read_json()
                account_id = GESTOR.crear_cuenta(
                    body.get("email"), body.get("password"), body.get("profile")
                )
                profile = GESTOR.obtener_perfil(account_id)
                token = GESTOR.crear_sesion(account_id)
                self.send_response(HTTPStatus.CREATED)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self._send_session(token)
                payload = json.dumps(profile, ensure_ascii=False).encode("utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

            if self.command == "POST" and path == "/api/sessions":
                body = self._read_json()
                account_id = GESTOR.autenticar_cuenta(body.get("email"), body.get("password"))
                if account_id is None:
                    raise AccountError(
                        "Correo electrónico o contraseña incorrectos.",
                        HTTPStatus.UNAUTHORIZED,
                    )
                profile = GESTOR.obtener_perfil(account_id)
                token = GESTOR.crear_sesion(account_id)
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self._send_session(token)
                payload = json.dumps(profile, ensure_ascii=False).encode("utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return

            if self.command == "GET" and path == "/api/me/profile":
                profile = GESTOR.obtener_perfil(self._account_id())
                self._send_json(HTTPStatus.OK, profile)
                return

            if self.command == "DELETE" and path == "/api/me/session":
                token = self._session_token()
                if GESTOR.obtener_id_por_sesion(token) is None:
                    raise AccountError("La sesión expiró.", HTTPStatus.UNAUTHORIZED)
                GESTOR.eliminar_sesion(token)
                self._send_empty(HTTPStatus.NO_CONTENT, clear_session=True)
                return

            if self.command == "PATCH" and path == "/api/me/profile":
                profile = GESTOR.editar_cuenta(self._account_id(), self._read_json())
                self._send_json(HTTPStatus.OK, profile)
                return

            if self.command == "DELETE" and path == "/api/me/account":
                GESTOR.eliminar_cuenta(self._account_id())
                self._send_empty(HTTPStatus.NO_CONTENT, clear_session=True)
                return

            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada."})
        except AccountError as error:
            self._send_json(error.status, {"error": str(error)})
        except (sqlite3.Error, OSError):
            self.log_error("Error interno al procesar %s", path)
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"error": "No se pudo completar la operación."},
            )

    def do_GET(self) -> None:
        if self.path.startswith("/api/"):
            self._handle_api()
        else:
            super().do_GET()

    def do_POST(self) -> None:
        self._handle_api()

    def do_PATCH(self) -> None:
        self._handle_api()

    def do_DELETE(self) -> None:
        self._handle_api()

    def do_OPTIONS(self) -> None:
        self._send_empty(HTTPStatus.NO_CONTENT)


def iniciar_servidor() -> None:
    """Inicia el servidor local de desarrollo en WORKNET_HOST:WORKNET_PORT."""
    server = ThreadingHTTPServer((HOST, PORT), WorkNetRequestHandler)
    print(f"Worknet disponible en http://{HOST}:{PORT}/Perfil%20Profesional/Perfil_Profesional.html")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    iniciar_servidor()