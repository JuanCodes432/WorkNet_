# HU-E5-04

import almacenamiento


def fn_consultar_resenas_especialista(p_especialista):
    if not isinstance(p_especialista, str) or p_especialista.strip() == "":
        raise ValueError("El especialista no puede estar vacío")
    return [
        v_resena
        for v_resena in almacenamiento.resenas
        if v_resena.especialista == p_especialista
    ]
