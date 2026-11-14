from flask import Blueprint, jsonify, request

import almacenamiento
from .resena_gestion import (
    fn_crear_resena,
    fn_eliminar_resena,
    fn_modificar_resena,
)
from .resena_modelo import Resena
from .resena_consulta import fn_consultar_resenas_especialista


resena_bp = Blueprint("resenas", __name__, url_prefix="/api/resenas")
CLIENTE_ACTUAL = "Pepito perez"


def _leer_datos_json():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return None
    return datos


def _error_datos_invalidos():
    return jsonify({"error": "El cuerpo debe ser un objeto JSON válido"}), 400


def _error_si_resena_no_es_del_cliente_actual(resena_id):
    resena = next(
        (
            Resena.desde_diccionario(elemento)
            for elemento in almacenamiento.cargar("resenas")
            if elemento.get("id") == resena_id
        ),
        None,
    )
    if resena is not None and resena.cliente != CLIENTE_ACTUAL:
        return jsonify(
            {"error": "Solo puedes modificar o eliminar tu propia reseña"}
        ), 403
    return None


@resena_bp.get("")
def consultar_resenas():
    especialista = request.args.get("especialista", "").strip()
    if not especialista:
        return jsonify(
            {"error": "Indica el especialista que quieres consultar"}
        ), 400

    try:
        resenas = fn_consultar_resenas_especialista(especialista)
        return jsonify([resena.a_diccionario() for resena in resenas])
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@resena_bp.post("")
def crear_resena():
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        resena = fn_crear_resena(
            datos.get("contrato_id"),
            CLIENTE_ACTUAL,
            datos.get("calificacion"),
            datos.get("comentario"),
        )
        return jsonify(resena.a_diccionario()), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@resena_bp.patch("/<int:resena_id>")
def modificar_resena(resena_id):
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    error_autoria = _error_si_resena_no_es_del_cliente_actual(resena_id)
    if error_autoria is not None:
        return error_autoria

    try:
        resena = fn_modificar_resena(
            resena_id,
            CLIENTE_ACTUAL,
            p_calificacion=datos.get("calificacion"),
            p_comentario=datos.get("comentario"),
        )
        return jsonify(resena.a_diccionario())
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@resena_bp.delete("/<int:resena_id>")
def eliminar_resena(resena_id):
    error_autoria = _error_si_resena_no_es_del_cliente_actual(resena_id)
    if error_autoria is not None:
        return error_autoria

    try:
        fn_eliminar_resena(resena_id, CLIENTE_ACTUAL)
        return jsonify({"mensaje": "Reseña eliminada"})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404
