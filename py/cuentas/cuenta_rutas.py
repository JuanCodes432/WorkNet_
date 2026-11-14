from flask import Blueprint, jsonify, request, session
from werkzeug.exceptions import BadRequest

from .cuenta_gestion import (
    fn_autenticar_cuenta,
    fn_crear_cuenta,
    fn_editar_perfil,
    fn_eliminar_cuenta,
    fn_obtener_perfil,
)


cuenta_bp = Blueprint("cuentas", __name__)
MAX_REQUEST_BYTES = 64 * 1024
CITIES = [
    {"id": "popayan", "name": "Popayán, Cauca"},
    {"id": "cali", "name": "Cali, Valle del Cauca"},
    {"id": "bogota", "name": "Bogotá, D.C."},
    {"id": "medellin", "name": "Medellín, Antioquia"},
]


@cuenta_bp.after_request
def no_guardar_respuestas_de_cuenta(respuesta):
    respuesta.headers["Cache-Control"] = "no-store"
    return respuesta


def _leer_json():
    if request.mimetype != "application/json":
        raise ValueError("Envía el contenido con Content-Type application/json.")
    if (
        request.content_length is None
        or request.content_length <= 0
        or request.content_length > MAX_REQUEST_BYTES
    ):
        raise ValueError("El cuerpo debe tener entre 1 byte y 64 KB.")
    try:
        datos = request.get_json()
    except BadRequest as error:
        raise ValueError(
            "El cuerpo de la solicitud no contiene JSON válido."
        ) from error
    if not isinstance(datos, dict):
        raise ValueError("El cuerpo debe ser un objeto JSON.")
    return datos


def _cuenta_id_actual():
    cuenta_id = session.get("cuenta_id")
    if not isinstance(cuenta_id, int):
        raise LookupError("Inicia sesión para continuar.")
    return cuenta_id


def _error(error, estado):
    return jsonify({"error": str(error)}), estado


@cuenta_bp.get("/api/cities")
def consultar_ciudades():
    return jsonify(CITIES)


@cuenta_bp.post("/api/accounts")
def crear_cuenta():
    try:
        datos = _leer_json()
        cuenta = fn_crear_cuenta(
            datos.get("email"),
            datos.get("password"),
            datos.get("profile"),
        )
    except ValueError as error:
        estado = 409 if str(error).startswith("Ya existe una cuenta") else 400
        return _error(error, estado)

    session.clear()
    session["cuenta_id"] = cuenta.id
    session.permanent = True
    return jsonify(cuenta.perfil), 201


@cuenta_bp.post("/api/sessions")
def iniciar_sesion():
    try:
        datos = _leer_json()
        cuenta = fn_autenticar_cuenta(datos.get("email"), datos.get("password"))
    except ValueError as error:
        return _error(error, 400)
    if cuenta is None:
        return jsonify({"error": "Correo electrónico o contraseña incorrectos."}), 401

    session.clear()
    session["cuenta_id"] = cuenta.id
    session.permanent = True
    return jsonify(cuenta.perfil)


@cuenta_bp.get("/api/me/profile")
def consultar_perfil():
    try:
        return jsonify(fn_obtener_perfil(_cuenta_id_actual()))
    except LookupError as error:
        estado = 401 if str(error).startswith("Inicia sesión") else 404
        return _error(error, estado)


@cuenta_bp.patch("/api/me/profile")
def modificar_perfil():
    try:
        perfil = fn_editar_perfil(_cuenta_id_actual(), _leer_json())
        return jsonify(perfil)
    except ValueError as error:
        return _error(error, 400)
    except LookupError as error:
        estado = 401 if str(error).startswith("Inicia sesión") else 404
        return _error(error, estado)


@cuenta_bp.delete("/api/me/session")
def cerrar_sesion():
    if not isinstance(session.get("cuenta_id"), int):
        return jsonify({"error": "Inicia sesión para continuar."}), 401
    session.clear()
    return "", 204


@cuenta_bp.delete("/api/me/account")
def eliminar_mi_cuenta():
    try:
        fn_eliminar_cuenta(_cuenta_id_actual())
    except LookupError as error:
        estado = 401 if str(error).startswith("Inicia sesión") else 404
        return _error(error, estado)
    session.clear()
    return "", 204
