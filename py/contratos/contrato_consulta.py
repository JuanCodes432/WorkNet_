import almacenamiento
from .contrato_modelo import Contrato


def fn_consultar_contrato(p_contrato_id):
    for datos in almacenamiento.cargar("contratos"):
        if datos.get("id") == p_contrato_id:
            return Contrato.desde_diccionario(datos)
    raise LookupError(f"No existe el contrato con id {p_contrato_id}")
