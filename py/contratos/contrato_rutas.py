from flask import Blueprint, jsonify, request, session

import almacenamiento
from cuentas.cuenta_gestion import fn_obtener_perfil
from .contrato_consulta import fn_consultar_contrato
from .contrato_gestion import (
    fn_cambiar_estado_contrato,
    fn_crear_contrato,
    fn_eliminar_contrato,
    fn_modificar_contrato,
)
from .contrato_historial import fn_historial_contratos


contrato_bp = Blueprint("contratos", __name__, url_prefix="/api/contratos")
mis_contratos_bp = Blueprint(
    "mis_contratos", __name__, url_prefix="/api/me/contratos"
)
demo_contratos_bp = Blueprint(
    "demo_contratos", __name__, url_prefix="/api/demo/contratos"
)
especialistas_bp = Blueprint(
    "especialistas", __name__, url_prefix="/api/especialistas"
)


def _cuenta_id_actual():
    cuenta_id = session.get("cuenta_id")
    return cuenta_id if type(cuenta_id) is int else None


def _error_sin_sesion():
    return jsonify({"error": "Inicia sesión para continuar."}), 401


def _contrato_de_cuenta(contrato_id, cuenta_id):
    contrato = fn_consultar_contrato(contrato_id)
    if contrato.cliente_id != cuenta_id:
        raise PermissionError("No puedes consultar ni modificar este contrato")
    return contrato


def _crear_contrato_de_sesion(datos):
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return None, _error_sin_sesion()
    perfil = fn_obtener_perfil(cuenta_id)
    especialista_id = datos.get("especialista_id")

    def es_especialista_seleccionado(elemento):
        if especialista_id is not None:
            return elemento.get("id") == especialista_id
        return elemento.get("nombre") == datos.get("especialista")

    especialista = next(
        (
            elemento
            for elemento in almacenamiento.cargar("especialistas")
            if es_especialista_seleccionado(elemento)
        ),
        None,
    )
    if especialista is None:
        raise ValueError("Selecciona un especialista disponible")
    descripcion = datos.get("descripcion")
    if not isinstance(descripcion, str) or not descripcion.strip():
        raise ValueError("La descripción del servicio no puede estar vacía")
    contrato = fn_crear_contrato(
        perfil["name"],
        especialista.get("nombre"),
        datos.get("servicio"),
        datos.get("precio"),
        descripcion,
        p_cliente_id=cuenta_id,
        p_fecha_acordada=datos.get("fecha_acordada"),
        p_estado="pendiente",
        p_especialista_id=especialista.get("id"),
    )
    return contrato, None


def _cambiar_estado_demo(contrato_id, estado):
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return None, _error_sin_sesion()
    _contrato_de_cuenta(contrato_id, cuenta_id)
    return fn_cambiar_estado_contrato(contrato_id, estado), None


@especialistas_bp.get("")
def consultar_especialistas():
    return jsonify(almacenamiento.cargar("especialistas"))


def _leer_datos_json():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return None
    return datos


def _error_datos_invalidos():
    return jsonify({"error": "El cuerpo debe ser un objeto JSON válido"}), 400


@contrato_bp.get("")
def consultar_historial_contratos():
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    contratos = fn_historial_contratos()
    return jsonify(
        [
            contrato.a_diccionario()
            for contrato in contratos
            if contrato.cliente_id == cuenta_id
        ]
    )


@contrato_bp.post("")
def crear_contrato():
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        contrato, error_sesion = _crear_contrato_de_sesion(datos)
        if error_sesion is not None:
            return error_sesion
        return jsonify(contrato.a_diccionario()), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@contrato_bp.get("/<int:contrato_id>")
def consultar_contrato(contrato_id):
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    try:
        contrato = _contrato_de_cuenta(contrato_id, cuenta_id)
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@contrato_bp.patch("/<int:contrato_id>")
def modificar_contrato(contrato_id):
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    try:
        _contrato_de_cuenta(contrato_id, cuenta_id)
        contrato = fn_modificar_contrato(
            contrato_id,
            p_especialista=datos.get("especialista"),
            p_servicio=datos.get("servicio"),
            p_precio=datos.get("precio"),
            p_descripcion=datos.get("descripcion"),
        )
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@contrato_bp.delete("/<int:contrato_id>")
def eliminar_contrato(contrato_id):
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    try:
        _contrato_de_cuenta(contrato_id, cuenta_id)
        contrato = fn_eliminar_contrato(contrato_id)
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@mis_contratos_bp.get("")
def consultar_mis_contratos():
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    contratos = fn_historial_contratos()
    return jsonify(
        [
            contrato.a_diccionario()
            for contrato in contratos
            if contrato.cliente_id == cuenta_id
        ]
    )


@mis_contratos_bp.post("")
def crear_mi_contrato():
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()
    try:
        contrato, error_sesion = _crear_contrato_de_sesion(datos)
        if error_sesion is not None:
            return error_sesion
        return jsonify(contrato.a_diccionario()), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@mis_contratos_bp.get("/<int:contrato_id>")
def consultar_mi_contrato(contrato_id):
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    try:
        contrato = _contrato_de_cuenta(contrato_id, cuenta_id)
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@mis_contratos_bp.patch("/<int:contrato_id>")
def actualizar_mi_contrato(contrato_id):
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()
    cuenta_id = _cuenta_id_actual()
    if cuenta_id is None:
        return _error_sin_sesion()
    try:
        _contrato_de_cuenta(contrato_id, cuenta_id)
        contrato = fn_cambiar_estado_contrato(
            contrato_id,
            datos.get("estado"),
        )
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@demo_contratos_bp.post("/<int:contrato_id>/aceptar")
def aceptar_contrato_en_demo(contrato_id):
    try:
        contrato, error_sesion = _cambiar_estado_demo(contrato_id, "activo")
        if error_sesion is not None:
            return error_sesion
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@demo_contratos_bp.post("/<int:contrato_id>/rechazar")
def rechazar_contrato_en_demo(contrato_id):
    try:
        contrato, error_sesion = _cambiar_estado_demo(contrato_id, "rechazado")
        if error_sesion is not None:
            return error_sesion
        return jsonify(contrato.a_diccionario())
    except PermissionError as error:
        return jsonify({"error": str(error)}), 403
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404
