from .contrato_consulta import fn_consultar_contrato
from .contrato_gestion import (
    fn_crear_contrato,
    fn_eliminar_contrato,
    fn_modificar_contrato,
)
from .contrato_historial import fn_historial_contratos

__all__ = [
    "fn_consultar_contrato",
    "fn_crear_contrato",
    "fn_eliminar_contrato",
    "fn_historial_contratos",
    "fn_modificar_contrato",
]
