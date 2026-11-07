# main.py
from contratos import (
    fn_crear_contrato,
    fn_modificar_contrato,
    fn_eliminar_contrato,
    fn_consultar_contrato,
    fn_historial_contratos,
)
from resenas import (
    fn_crear_resena,
    fn_modificar_resena,
    fn_eliminar_resena,
    fn_consultar_resenas_especialista,
)
import almacenamiento

# Datos de prueba
v_contrato1 = fn_crear_contrato(
    "Ana", "Carlos", "Plomería", 50000, "Reparación de una fuga"
)
v_contrato2 = fn_crear_contrato(
    "Luis", "Carlos", "Reparación de tubería", 80000
)

# HU-E4-01: modificar
fn_modificar_contrato(v_contrato1.id, p_descripcion="Reparación de una fuga de agua")

# HU-E4-02: consultar
v_contrato_consultado = fn_consultar_contrato(v_contrato1.id)
assert v_contrato_consultado.descripcion == "Reparación de una fuga de agua"
print("Contrato consultado:", v_contrato_consultado.a_diccionario())

# HU-E4-03: historial
v_historial = fn_historial_contratos()
assert len(v_historial) == 2
print("Contratos en el historial:", len(v_historial))

# HU-E5-01: crear
v_resena1 = fn_crear_resena(v_contrato1.id, "Ana", 5, "Excelente trabajo")
v_resena2 = fn_crear_resena(v_contrato2.id, "Luis", 3, "Cumplió, pero tardó")
print("Creada:", v_resena1.a_diccionario())

# HU-E5-02: modificar (solo la calificación)
fn_modificar_resena(v_resena2.id, "Luis", p_calificacion=4)
print("Modificada:", v_resena2.a_diccionario())

# HU-E5-04: consultar reseñas y calificaciones de un especialista
v_resenas_especialista = fn_consultar_resenas_especialista("Carlos")
assert len(v_resenas_especialista) == 2
print(
    "Reseñas de Carlos:",
    [v_resena.a_diccionario() for v_resena in v_resenas_especialista],
)

# HU-E5-03: eliminar
fn_eliminar_resena(v_resena1.id, "Ana")
print("Reseñas guardadas:", len(almacenamiento.resenas))

# Pruebas de error: cada una DEBE fallar
v_pruebas = [
    ("calificación 9",       lambda: fn_crear_resena(v_contrato1.id, "Ana", 9, "ok")),
    ("precio cero",          lambda: fn_crear_contrato("Ana", "Carlos", "Pintura", 0)),
    ("contrato inexistente", lambda: fn_crear_resena(99, "Ana", 5, "ok")),
    ("reseña duplicada",     lambda: fn_crear_resena(v_contrato2.id, "Luis", 5, "otra")),
    ("cliente equivocado",   lambda: fn_crear_resena(v_contrato1.id, "Pedro", 5, "ok")),
    ("modificar ajena",      lambda: fn_modificar_resena(v_resena2.id, "Pedro", p_comentario="x")),
    ("eliminar inexistente", lambda: fn_eliminar_resena(99, "Ana")),
]
for v_nombre, v_prueba in v_pruebas:
    try:
        v_prueba()
        raise AssertionError(f"Debió fallar: {v_nombre}")
    except (ValueError, LookupError) as v_error:
        print(f"OK ({v_nombre}):", v_error)

# HU-E4-01: eliminar lógicamente y conservar en el historial
fn_eliminar_contrato(v_contrato1.id)
assert v_contrato1.estado == "eliminado"
assert len(fn_historial_contratos()) == 2
print("Contrato eliminado lógicamente y conservado en el historial")

try:
    fn_crear_resena(v_contrato1.id, "Ana", 5, "No debe publicarse")
    raise AssertionError("No se debe reseñar un contrato eliminado")
except LookupError as v_error:
    print("OK (reseñar contrato eliminado):", v_error)

try:
    fn_modificar_contrato(v_contrato1.id, p_precio=1)
    raise AssertionError("No se debe modificar un contrato eliminado")
except LookupError as v_error:
    print("OK (modificar contrato eliminado):", v_error)