import almacenamiento
from contratos.contrato_consulta import fn_consultar_contrato
from .resena_modelo import Resena


CALIFICACION_MINIMA = 1
CALIFICACION_MAXIMA = 5


def _fn_validar_calificacion(p_calificacion):
    if isinstance(p_calificacion, bool) or not isinstance(p_calificacion, int):
        raise ValueError("La calificación debe ser un número entero")
    if not CALIFICACION_MINIMA <= p_calificacion <= CALIFICACION_MAXIMA:
        raise ValueError(
            f"La calificación debe estar entre {CALIFICACION_MINIMA} "
            f"y {CALIFICACION_MAXIMA}"
        )


def _fn_validar_comentario(p_comentario):
    if not isinstance(p_comentario, str) or not p_comentario.strip():
        raise ValueError("El comentario no puede estar vacío")


def _fn_buscar_resena(p_resena_id):
    for datos in almacenamiento.cargar("resenas"):
        if datos.get("id") == p_resena_id:
            return Resena.desde_diccionario(datos)
    raise LookupError(f"No existe la reseña con id {p_resena_id}")


def _fn_guardar_resenas(resenas):
    almacenamiento.guardar(
        "resenas",
        [resena.a_diccionario() for resena in resenas],
    )


def fn_crear_resena(
    p_contrato_id,
    p_cliente,
    p_calificacion,
    p_comentario,
):
    _fn_validar_calificacion(p_calificacion)
    _fn_validar_comentario(p_comentario)
    contrato = fn_consultar_contrato(p_contrato_id)
    if contrato.estado == "eliminado":
        raise LookupError("No se puede reseñar un contrato eliminado")
    if contrato.cliente != p_cliente:
        raise ValueError("Solo el cliente del contrato puede crear la reseña")

    datos_actuales = almacenamiento.cargar("resenas")
    if any(datos.get("contrato_id") == p_contrato_id for datos in datos_actuales):
        raise ValueError("Este contrato ya tiene una reseña")

    resena = Resena(
        almacenamiento.siguiente_id("resena"),
        p_contrato_id,
        p_cliente,
        contrato.especialista,
        p_calificacion,
        p_comentario,
    )
    resenas = [Resena.desde_diccionario(datos) for datos in datos_actuales]
    resenas.append(resena)
    _fn_guardar_resenas(resenas)
    return resena


def fn_modificar_resena(
    p_resena_id,
    p_cliente,
    p_calificacion=None,
    p_comentario=None,
):
    resena = _fn_buscar_resena(p_resena_id)
    if resena.cliente != p_cliente:
        raise ValueError("Solo el autor puede modificar la reseña")
    if p_calificacion is not None:
        _fn_validar_calificacion(p_calificacion)
        resena.calificacion = p_calificacion
    if p_comentario is not None:
        _fn_validar_comentario(p_comentario)
        resena.comentario = p_comentario

    resenas = [
        resena_actual
        for resena_actual in (
            Resena.desde_diccionario(datos)
            for datos in almacenamiento.cargar("resenas")
        )
    ]
    _fn_guardar_resenas(
        [resena if item.id == resena.id else item for item in resenas]
    )
    return resena


def fn_eliminar_resena(p_resena_id, p_cliente):
    resena = _fn_buscar_resena(p_resena_id)
    if resena.cliente != p_cliente:
        raise ValueError("Solo el autor puede eliminar la reseña")
    resenas = [
        Resena.desde_diccionario(datos)
        for datos in almacenamiento.cargar("resenas")
    ]
    _fn_guardar_resenas(
        [item for item in resenas if item.id != p_resena_id]
    )
