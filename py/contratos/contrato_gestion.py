# HU-E4-01

import math

import almacenamiento
from contratos.contrato_modelo import Contrato


def _fn_validar_nombre(p_nombre, p_campo):
    if not isinstance(p_nombre, str) or p_nombre.strip() == "":
        raise ValueError(f"{p_campo} no puede estar vacío")


def _fn_validar_precio(p_precio):
    if (isinstance(p_precio, bool)
            or not isinstance(p_precio, (int, float))):
        raise ValueError("El precio debe ser un número mayor que cero")
    if isinstance(p_precio, float) and not math.isfinite(p_precio):
        raise ValueError("El precio debe ser un número mayor que cero")
    if p_precio <= 0:
        raise ValueError("El precio debe ser un número mayor que cero")


def _fn_buscar_contrato(p_contrato_id):
    for v_contrato in almacenamiento.contratos:
        if v_contrato.id == p_contrato_id:
            return v_contrato
    raise LookupError(f"No existe el contrato con id {p_contrato_id}")


def fn_crear_contrato(p_cliente, p_especialista, p_servicio, p_precio,
                      p_descripcion=""):
    _fn_validar_nombre(p_cliente, "El cliente")
    _fn_validar_nombre(p_especialista, "El especialista")
    _fn_validar_nombre(p_servicio, "El servicio")
    _fn_validar_precio(p_precio)
    if not isinstance(p_descripcion, str):
        raise ValueError("La descripción debe ser texto")

    v_contrato = Contrato(
        p_id=almacenamiento.siguiente_id("contrato"),
        p_cliente=p_cliente,
        p_especialista=p_especialista,
        p_servicio=p_servicio,
        p_precio=p_precio,
        p_descripcion=p_descripcion,
    )
    almacenamiento.contratos.append(v_contrato)
    return v_contrato


def fn_modificar_contrato(p_contrato_id, p_cliente=None,
                          p_especialista=None, p_servicio=None,
                          p_precio=None, p_descripcion=None):
    v_contrato = _fn_buscar_contrato(p_contrato_id)
    if v_contrato.estado == "eliminado":
        raise LookupError("No se puede modificar un contrato eliminado")

    if (p_cliente is None and p_especialista is None and p_servicio is None
            and p_precio is None and p_descripcion is None):
        raise ValueError("Debe indicar al menos un dato para modificar")

    if p_cliente is not None:
        _fn_validar_nombre(p_cliente, "El campo cliente")
    if p_especialista is not None:
        _fn_validar_nombre(p_especialista, "El campo especialista")
    if p_servicio is not None:
        _fn_validar_nombre(p_servicio, "El campo servicio")
    if p_precio is not None:
        _fn_validar_precio(p_precio)
    if p_descripcion is not None and not isinstance(p_descripcion, str):
        raise ValueError("La descripción debe ser texto")

    if p_cliente is not None:
        v_contrato.cliente = p_cliente
    if p_especialista is not None:
        v_contrato.especialista = p_especialista
    if p_servicio is not None:
        v_contrato.servicio = p_servicio
    if p_precio is not None:
        v_contrato.precio = p_precio
    if p_descripcion is not None:
        v_contrato.descripcion = p_descripcion
    return v_contrato


def fn_eliminar_contrato(p_contrato_id):
    v_contrato = _fn_buscar_contrato(p_contrato_id)
    if v_contrato.estado == "eliminado":
        raise LookupError("El contrato ya está eliminado")
    v_contrato.estado = "eliminado"
    return v_contrato
