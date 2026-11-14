import almacenamiento
from .cuenta_modelo import Cuenta


def fn_consultar_cuenta(p_cuenta_id):
    for datos in almacenamiento.cargar("cuentas"):
        if datos.get("id") == p_cuenta_id:
            return Cuenta.desde_diccionario(datos)
    raise LookupError("La cuenta no existe.")


def fn_consultar_cuenta_por_email(p_email):
    for datos in almacenamiento.cargar("cuentas"):
        if datos.get("email") == p_email:
            return Cuenta.desde_diccionario(datos)
    return None


def fn_listar_cuentas():
    return [
        Cuenta.desde_diccionario(datos)
        for datos in almacenamiento.cargar("cuentas")
    ]
