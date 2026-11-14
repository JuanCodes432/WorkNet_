import json
import re
from threading import RLock

import almacenamiento
from werkzeug.security import check_password_hash, generate_password_hash

from .cuenta_consulta import (
    fn_consultar_cuenta,
    fn_consultar_cuenta_por_email,
    fn_listar_cuentas,
)
from .cuenta_modelo import Cuenta


PROFILE_DEFAULTS = {
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
_LOCK = RLock()


def _normalizar_email(email):
    if not isinstance(email, str):
        raise ValueError("El correo electrónico es obligatorio.")
    normalizado = email.strip().lower()
    if len(normalizado) > 254 or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+",
        normalizado,
    ):
        raise ValueError("El correo electrónico no es válido.")
    return normalizado


def _validar_contrasena(password):
    if not isinstance(password, str) or len(password) < 12:
        raise ValueError("La contraseña debe tener al menos 12 caracteres.")
    if len(password) > 1024:
        raise ValueError("La contraseña es demasiado larga.")


def _normalizar_perfil(perfil, existente=None):
    if not isinstance(perfil, dict):
        raise ValueError("El perfil debe ser un objeto JSON.")

    normalizado = {**PROFILE_DEFAULTS, **(existente or {})}
    for campo in PROFILE_DEFAULTS:
        if campo in perfil:
            normalizado[campo] = perfil[campo]

    for campo, limite in PROFILE_TEXT_LIMITS.items():
        valor = normalizado[campo]
        if not isinstance(valor, str):
            raise ValueError(f"El campo {campo} debe ser texto.")
        valor = valor.strip()
        if len(valor) > limite:
            raise ValueError(
                f"El campo {campo} supera el máximo de {limite} caracteres."
            )
        normalizado[campo] = valor

    for campo in REQUIRED_PROFILE_FIELDS:
        if not normalizado[campo]:
            raise ValueError(f"El campo {campo} es obligatorio.")

    for campo in ("about", "interests"):
        valores = normalizado[campo]
        if not isinstance(valores, list) or len(valores) > 50:
            raise ValueError(
                f"El campo {campo} debe ser una lista de hasta 50 elementos."
            )
        if any(not isinstance(valor, str) or len(valor) > 4000 for valor in valores):
            raise ValueError(f"El campo {campo} contiene un elemento no válido.")
        normalizado[campo] = [
            valor.strip() for valor in valores if valor.strip()
        ]

    for campo in ("education", "experience", "activity"):
        elementos = normalizado[campo]
        if not isinstance(elementos, list) or len(elementos) > 50:
            raise ValueError(
                f"El campo {campo} debe ser una lista de hasta 50 elementos."
            )
        if any(not isinstance(elemento, dict) for elemento in elementos):
            raise ValueError(f"El campo {campo} contiene un elemento no válido.")
        try:
            json.dumps(elementos, ensure_ascii=False)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"El campo {campo} contiene datos no válidos."
            ) from error

    try:
        json.dumps(normalizado["punctuality"], ensure_ascii=False)
    except (TypeError, ValueError) as error:
        raise ValueError("El campo punctuality contiene datos no válidos.") from error
    if not isinstance(normalizado["hasUnreadMessages"], bool):
        raise ValueError("El campo hasUnreadMessages debe ser booleano.")
    return normalizado


def _guardar_cuentas(cuentas):
    almacenamiento.guardar(
        "cuentas",
        [cuenta.a_diccionario() for cuenta in cuentas],
    )


def fn_crear_cuenta(email, password, perfil):
    email_normalizado = _normalizar_email(email)
    _validar_contrasena(password)
    perfil_normalizado = _normalizar_perfil(perfil)
    with _LOCK:
        if fn_consultar_cuenta_por_email(email_normalizado) is not None:
            raise ValueError("Ya existe una cuenta con ese correo electrónico.")

        cuenta = Cuenta(
            almacenamiento.siguiente_id("cuenta"),
            email_normalizado,
            generate_password_hash(password),
            perfil_normalizado,
        )
        cuentas = fn_listar_cuentas()
        cuentas.append(cuenta)
        _guardar_cuentas(cuentas)
        return cuenta


def fn_autenticar_cuenta(email, password):
    email_normalizado = _normalizar_email(email)
    if not isinstance(password, str) or len(password) > 1024:
        return None
    cuenta = fn_consultar_cuenta_por_email(email_normalizado)
    if cuenta is None or not check_password_hash(cuenta.password_hash, password):
        return None
    return cuenta


def fn_obtener_perfil(cuenta_id):
    return fn_consultar_cuenta(cuenta_id).perfil


def fn_editar_perfil(cuenta_id, perfil):
    cuenta = fn_consultar_cuenta(cuenta_id)
    cuenta.perfil = _normalizar_perfil(perfil, cuenta.perfil)
    cuentas = fn_listar_cuentas()
    _guardar_cuentas(
        [cuenta if actual.id == cuenta.id else actual for actual in cuentas]
    )
    return cuenta.perfil


def fn_eliminar_cuenta(cuenta_id):
    fn_consultar_cuenta(cuenta_id)
    cuentas = fn_listar_cuentas()
    _guardar_cuentas([cuenta for cuenta in cuentas if cuenta.id != cuenta_id])
