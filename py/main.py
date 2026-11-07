# app.py
from contratos import fn_crear_contrato
from resenas import fn_crear_resena, fn_modificar_resena, fn_eliminar_resena
import almacenamiento

# Datos de prueba
v_contrato1 = fn_crear_contrato("Ana", "Carlos", "Plomería", 50000)
v_contrato2 = fn_crear_contrato("Luis", "Carlos", "Reparación de tubería", 80000)

# HU-E5-01: crear
v_resena1 = fn_crear_resena(v_contrato1.id, "Ana", 5, "Excelente trabajo")
v_resena2 = fn_crear_resena(v_contrato2.id, "Luis", 3, "Cumplió, pero tardó")
print("Creada:", v_resena1.a_diccionario())

# HU-E5-02: modificar (solo la calificación)
fn_modificar_resena(v_resena2.id, "Luis", p_calificacion=4)
print("Modificada:", v_resena2.a_diccionario())

# HU-E5-03: eliminar
fn_eliminar_resena(v_resena1.id, "Ana")
print("Reseñas guardadas:", len(almacenamiento.resenas))

# Pruebas de error: cada una DEBE fallar
v_pruebas = [
    ("calificación 9",       lambda: fn_crear_resena(v_contrato1.id, "Ana", 9, "ok")),
    ("contrato inexistente", lambda: fn_crear_resena(99, "Ana", 5, "ok")),
    ("reseña duplicada",     lambda: fn_crear_resena(v_contrato2.id, "Luis", 5, "otra")),
    ("cliente equivocado",   lambda: fn_crear_resena(v_contrato1.id, "Pedro", 5, "ok")),
    ("modificar ajena",      lambda: fn_modificar_resena(v_resena2.id, "Pedro", p_comentario="x")),
    ("eliminar inexistente", lambda: fn_eliminar_resena(99, "Ana")),
]
for v_nombre, v_prueba in v_pruebas:
    try:
        v_prueba()
        print("ERROR: debió fallar ->", v_nombre)
    except (ValueError, LookupError) as v_error:
        print(f"OK ({v_nombre}):", v_error)