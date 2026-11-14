import almacenamiento
from .contrato_modelo import Contrato


def fn_historial_contratos():
    return [
        Contrato.desde_diccionario(datos)
        for datos in almacenamiento.cargar("contratos")
    ]
