import math

import almacenamiento
from .contrato_consulta import fn_consultar_contrato
from .contrato_historial import fn_historial_contratos
from .contrato_modelo import Contrato


def _fn_validar_nombre(p_nombre, p_campo):
    if not isinstance(p_nombre, str) or not p_nombre.strip():
        raise ValueError(f"{p_campo} no puede estar vacío")


def _fn_validar_precio(p_precio):
    if isinstance(p_precio, bool) or not isinstance(p_precio, (int, float)):
        raise ValueError("El precio debe ser un número mayor que cero")
    if isinstance(p_precio, float) and not math.isfinite(p_precio):
        raise ValueError("El precio debe ser un número mayor que cero")
    if p_precio <= 0:
        raise ValueError("El precio debe ser un número mayor que cero")


def _fn_guardar_contratos(contratos):
    almacenamiento.guardar(
        "contratos",
        [contrato.a_diccionario() for contrato in contratos],
    )


def fn_crear_contrato(
    p_cliente,
    p_especialista,
    p_servicio,
    p_precio,
    p_descripcion="",
):
    _fn_validar_nombre(p_cliente, "El cliente")
    _fn_validar_nombre(p_especialista, "El especialista")
    _fn_validar_nombre(p_servicio, "El servicio")
    _fn_validar_precio(p_precio)
    if not isinstance(p_descripcion, str):
        raise ValueError("La descripción debe ser texto")

    contrato = Contrato(
        almacenamiento.siguiente_id("contrato"),
        p_cliente,
        p_especialista,
        p_servicio,
        p_precio,
        p_descripcion,
    )
    contratos = fn_historial_contratos()
    contratos.append(contrato)
    _fn_guardar_contratos(contratos)
    return contrato


def fn_modificar_contrato(
    p_contrato_id,
    p_cliente=None,
    p_especialista=None,
    p_servicio=None,
    p_precio=None,
    p_descripcion=None,
):
    contrato = fn_consultar_contrato(p_contrato_id)
    if contrato.estado == "eliminado":
        raise LookupError("No se puede modificar un contrato eliminado")
    if all(
        valor is None
        for valor in (
            p_cliente,
            p_especialista,
            p_servicio,
            p_precio,
            p_descripcion,
        )
    ):
        raise ValueError("Debe indicar al menos un dato para modificar")

    if p_cliente is not None:
        _fn_validar_nombre(p_cliente, "El campo cliente")
        contrato.cliente = p_cliente
    if p_especialista is not None:
        _fn_validar_nombre(p_especialista, "El campo especialista")
        contrato.especialista = p_especialista
    if p_servicio is not None:
        _fn_validar_nombre(p_servicio, "El campo servicio")
        contrato.servicio = p_servicio
    if p_precio is not None:
        _fn_validar_precio(p_precio)
        contrato.precio = p_precio
    if p_descripcion is not None:
        if not isinstance(p_descripcion, str):
            raise ValueError("La descripción debe ser texto")
        contrato.descripcion = p_descripcion

    contratos = fn_historial_contratos()
    _fn_guardar_contratos(
        [contrato if item.id == contrato.id else item for item in contratos]
    )
    return contrato


def fn_eliminar_contrato(p_contrato_id):
    contrato = fn_consultar_contrato(p_contrato_id)
    if contrato.estado == "eliminado":
        raise LookupError("El contrato ya está eliminado")
    contrato.estado = "eliminado"
    contratos = fn_historial_contratos()
    _fn_guardar_contratos(
        [contrato if item.id == contrato.id else item for item in contratos]
    )
    return contrato
