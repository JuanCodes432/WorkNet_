from flask import Blueprint, jsonify, request

from .contrato_consulta import fn_consultar_contrato
from .contrato_gestion import (
    fn_crear_contrato,
    fn_eliminar_contrato,
    fn_modificar_contrato,
)
from .contrato_historial import fn_historial_contratos


contrato_bp = Blueprint("contratos", __name__, url_prefix="/api/contratos")


def _leer_datos_json():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return None
    return datos


def _error_datos_invalidos():
    return jsonify({"error": "El cuerpo debe ser un objeto JSON válido"}), 400


@contrato_bp.get("")
def consultar_historial_contratos():
    contratos = fn_historial_contratos()
    return jsonify([contrato.a_diccionario() for contrato in contratos])


@contrato_bp.post("")
def crear_contrato():
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        contrato = fn_crear_contrato(
            datos.get("cliente"),
            datos.get("especialista"),
            datos.get("servicio"),
            datos.get("precio"),
            datos.get("descripcion", ""),
        )
        return jsonify(contrato.a_diccionario()), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@contrato_bp.get("/<int:contrato_id>")
def consultar_contrato(contrato_id):
    try:
        contrato = fn_consultar_contrato(contrato_id)
        return jsonify(contrato.a_diccionario())
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@contrato_bp.patch("/<int:contrato_id>")
def modificar_contrato(contrato_id):
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        contrato = fn_modificar_contrato(
            contrato_id,
            p_cliente=datos.get("cliente"),
            p_especialista=datos.get("especialista"),
            p_servicio=datos.get("servicio"),
            p_precio=datos.get("precio"),
            p_descripcion=datos.get("descripcion"),
        )
        return jsonify(contrato.a_diccionario())
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@contrato_bp.delete("/<int:contrato_id>")
def eliminar_contrato(contrato_id):
    try:
        contrato = fn_eliminar_contrato(contrato_id)
        return jsonify(contrato.a_diccionario())
    except LookupError as error:
        return jsonify({"error": str(error)}), 404
