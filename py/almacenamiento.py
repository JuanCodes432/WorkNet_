"""Lectura y escritura de los archivos JSON de la aplicación."""

import json
import os
import tempfile
from pathlib import Path
from threading import RLock


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_ARCHIVOS = {
    "contratos": "contratos.json",
    "resenas": "resenas.json",
    "cuentas": "cuentas.json",
    "contadores": "contadores.json",
}
_NOMBRES_ID = {
    "contrato": "contratos",
    "resena": "resenas",
    "cuenta": "cuentas",
}
_LOCK = RLock()


def _nombre_archivo(nombre):
    base = nombre[:-5] if nombre.endswith(".json") else nombre
    if base not in _ARCHIVOS:
        raise LookupError(f"No existe un archivo de datos llamado '{nombre}'")
    return base


def _datos_vacios(nombre):
    return {} if nombre == "contadores" else []


def cargar(nombre):
    """Carga una lista de datos, o el diccionario de contadores."""
    base = _nombre_archivo(nombre)
    ruta = DATA_DIR / _ARCHIVOS[base]
    with _LOCK:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not ruta.exists() or ruta.stat().st_size == 0:
            datos = _datos_vacios(base)
            guardar(base, datos)
            return datos

        with ruta.open("r", encoding="utf-8") as archivo:
            datos = json.load(archivo)

        tipo_esperado = dict if base == "contadores" else list
        if not isinstance(datos, tipo_esperado):
            raise ValueError(f"El archivo {ruta.name} tiene un formato no válido")
        return datos


def guardar(nombre, datos):
    """Guarda los datos con reemplazo atómico para evitar archivos incompletos."""
    base = _nombre_archivo(nombre)
    tipo_esperado = dict if base == "contadores" else list
    if not isinstance(datos, tipo_esperado):
        raise ValueError(f"Los datos para {base} deben ser de tipo {tipo_esperado.__name__}")

    ruta = DATA_DIR / _ARCHIVOS[base]
    temporal = None
    with _LOCK:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=DATA_DIR,
                prefix=f".{ruta.name}.",
                suffix=".tmp",
                delete=False,
            ) as archivo:
                temporal = Path(archivo.name)
                json.dump(datos, archivo, ensure_ascii=False, indent=2)
                archivo.write("\n")
            os.replace(temporal, ruta)
        finally:
            if temporal is not None and temporal.exists():
                temporal.unlink()


def siguiente_id(nombre):
    """Devuelve y guarda el próximo id para contratos, reseñas o cuentas."""
    if nombre not in _NOMBRES_ID:
        raise LookupError(f"No existe un contador llamado '{nombre}'")

    with _LOCK:
        contadores = cargar("contadores")
        registros = cargar(_NOMBRES_ID[nombre])
        ultimo_registro = max(
            (registro.get("id", 0) for registro in registros),
            default=0,
        )
        nuevo_id = max(contadores.get(nombre, 0), ultimo_registro) + 1
        contadores[nombre] = nuevo_id
        guardar("contadores", contadores)
        return nuevo_id
