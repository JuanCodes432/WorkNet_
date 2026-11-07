# almacenamiento.py
# Datos en memoria (listas normales de Python)

contratos = []
resenas = []

# Un contador por cada tipo de dato, para generar ids únicos
_contadores = {
    "contrato": 0,
    "resena": 0,
}

def siguiente_id(nombre):
    """Devuelve el siguiente id disponible. Ej: siguiente_id("resena") -> 1, 2, 3..."""
    if nombre not in _contadores:
        raise LookupError(f"No existe un contador llamado '{nombre}'")
    _contadores[nombre] += 1
    return _contadores[nombre]