# contratos/__init__.py -- TEMPORAL, se reemplaza al hacer E4
import almacenamiento


class Contrato:
    def __init__(self, p_id, p_cliente, p_especialista, p_servicio, p_precio):
        self.id = p_id
        self.cliente = p_cliente
        self.especialista = p_especialista
        self.servicio = p_servicio
        self.precio = p_precio
        self.estado = "activo"


def fn_crear_contrato(p_cliente, p_especialista, p_servicio, p_precio):
    v_contrato = Contrato(almacenamiento.siguiente_id("contrato"),
                          p_cliente, p_especialista, p_servicio, p_precio)
    almacenamiento.contratos.append(v_contrato)
    return v_contrato


def fn_consultar_contrato(p_contrato_id):
    for v_contrato in almacenamiento.contratos:
        if v_contrato.id == p_contrato_id:
            return v_contrato
    raise LookupError(f"No existe el contrato con id {p_contrato_id}")