# HU-E4-02

import almacenamiento


def fn_consultar_contrato(p_contrato_id):
    for v_contrato in almacenamiento.contratos:
        if v_contrato.id == p_contrato_id:
            return v_contrato
    raise LookupError(f"No existe el contrato con id {p_contrato_id}")
