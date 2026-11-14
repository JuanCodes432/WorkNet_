import almacenamiento
from .resena_modelo import Resena


def fn_consultar_resenas_especialista(p_especialista):
    if not isinstance(p_especialista, str) or not p_especialista.strip():
        raise ValueError("El especialista no puede estar vacío")
    return [
        Resena.desde_diccionario(datos)
        for datos in almacenamiento.cargar("resenas")
        if datos.get("especialista") == p_especialista
    ]
