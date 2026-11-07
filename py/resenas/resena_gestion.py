# resenas/resena_gestion.py
# HU-E5-01 (crear), HU-E5-02 (modificar), HU-E5-03 (eliminar)

import almacenamiento
from contratos import fn_consultar_contrato
from resenas.resena_modelo import Resena

# Constantes: valores fijos que no cambian
CALIFICACION_MINIMA = 1
CALIFICACION_MAXIMA = 5


# ---------- Funciones auxiliares (privadas, empiezan con _) ----------

def _fn_validar_calificacion(p_calificacion):
    """Valida que la calificación sea un entero entre 1 y 5. Lanza ValueError si no."""
    # isinstance(True, int) es True en Python, por eso excluimos los booleanos
    if isinstance(p_calificacion, bool) or not isinstance(p_calificacion, int):
        raise ValueError("La calificación debe ser un número entero")
    if p_calificacion < CALIFICACION_MINIMA or p_calificacion > CALIFICACION_MAXIMA:
        raise ValueError(
            f"La calificación debe estar entre {CALIFICACION_MINIMA} y {CALIFICACION_MAXIMA}"
        )


def _fn_validar_comentario(p_comentario):
    """Valida que el comentario sea texto y no esté vacío. Lanza ValueError si no."""
    if not isinstance(p_comentario, str) or p_comentario.strip() == "":
        raise ValueError("El comentario no puede estar vacío")


def _fn_buscar_resena(p_resena_id):
    """Busca una reseña por id. Lanza LookupError si no existe."""
    for v_resena in almacenamiento.resenas:
        if v_resena.id == p_resena_id:
            return v_resena
    raise LookupError(f"No existe la reseña con id {p_resena_id}")


# ---------- HU-E5-01: crear ----------

def fn_crear_resena(p_contrato_id, p_cliente, p_calificacion, p_comentario):
    """Crea una reseña sobre un contrato y la devuelve.

    Lanza ValueError si los datos son inválidos, el cliente no es el del
    contrato o el contrato ya tiene reseña.
    Lanza LookupError si el contrato no existe o está eliminado.
    """
    # 1. Validar los datos que llegan
    _fn_validar_calificacion(p_calificacion)
    _fn_validar_comentario(p_comentario)

    # 2. Validar el contrato (si no existe, fn_consultar_contrato lanza LookupError)
    v_contrato = fn_consultar_contrato(p_contrato_id)
    if v_contrato.estado == "eliminado":
        raise LookupError("No se puede reseñar un contrato eliminado")
    if v_contrato.cliente != p_cliente:
        raise ValueError("Solo el cliente del contrato puede crear la reseña")

    # 3. Solo una reseña por contrato
    for v_resena in almacenamiento.resenas:
        if v_resena.contrato_id == p_contrato_id:
            raise ValueError("Este contrato ya tiene una reseña")

    # 4. Crear y guardar (el especialista sale del contrato, no del usuario)
    v_nueva = Resena(
        p_id=almacenamiento.siguiente_id("resena"),
        p_contrato_id=p_contrato_id,
        p_cliente=p_cliente,
        p_especialista=v_contrato.especialista,
        p_calificacion=p_calificacion,
        p_comentario=p_comentario,
    )
    almacenamiento.resenas.append(v_nueva)
    return v_nueva


# ---------- HU-E5-02: modificar ----------

def fn_modificar_resena(p_resena_id, p_cliente, p_calificacion=None, p_comentario=None):
    """Modifica la calificación y/o el comentario de una reseña.

    Lo que llegue como None no se cambia.
    Lanza LookupError si la reseña no existe.
    Lanza ValueError si el cliente no es el autor o los datos son inválidos.
    """
    v_resena = _fn_buscar_resena(p_resena_id)

    if v_resena.cliente != p_cliente:
        raise ValueError("Solo el autor puede modificar la reseña")

    # Validamos TODO antes de cambiar algo, para no dejar la reseña a medias
    if p_calificacion is not None:
        _fn_validar_calificacion(p_calificacion)
    if p_comentario is not None:
        _fn_validar_comentario(p_comentario)

    if p_calificacion is not None:
        v_resena.calificacion = p_calificacion
    if p_comentario is not None:
        v_resena.comentario = p_comentario

    return v_resena


# ---------- HU-E5-03: eliminar ----------

def fn_eliminar_resena(p_resena_id, p_cliente):
    """Elimina una reseña (se borra de la lista).

    Lanza LookupError si no existe. Lanza ValueError si el cliente no es el autor.
    """
    v_resena = _fn_buscar_resena(p_resena_id)

    if v_resena.cliente != p_cliente:
        raise ValueError("Solo el autor puede eliminar la reseña")

    almacenamiento.resenas.remove(v_resena)