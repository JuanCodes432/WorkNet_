from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory

import almacenamiento
from contratos import (
    fn_consultar_contrato,
    fn_crear_contrato,
    fn_eliminar_contrato,
    fn_historial_contratos,
    fn_modificar_contrato,
)
from resenas import (
    fn_consultar_resenas_especialista,
    fn_crear_resena,
    fn_eliminar_resena,
    fn_modificar_resena,
)

RAIZ_PROYECTO = Path(__file__).resolve().parent.parent
CLIENTE_ACTUAL = "Pepito perez"
DATOS_DEMO = (
    (
        "Pepito perez",
        "Revisión de grifería",
        50000,
        "Revisión y ajuste del grifo de la cocina",
        4,
        "Buen servicio, explicó el problema y lo solucionó rápido.",
    ),
    (
        "Pepito perez",
        "Instalación de lavaplatos",
        90000,
        "Instalación de un lavaplatos nuevo",
        None,
        None,
    ),
    ("Ana", "Plomería", 50000, "Reparación de una fuga de agua", None, None),
    (
        "María Fernanda",
        "Instalación de lavamanos",
        95000,
        "Instalación y revisión de las conexiones",
        5,
        "Excelente servicio, llegó puntual y dejó todo funcionando.",
    ),
    (
        "Julián",
        "Reparación de tubería",
        80000,
        "Cambio de un tramo de tubería",
        4,
        "Solucionó el problema y explicó claramente el trabajo.",
    ),
    (
        "Valentina",
        "Mantenimiento de grifo",
        45000,
        "Mantenimiento de grifo de cocina",
        5,
        "Muy amable y cuidadoso. El grifo quedó como nuevo.",
    ),
    (
        "Andrés",
        "Destape de desagüe",
        60000,
        "Limpieza del desagüe del baño",
        3,
        "El trabajo quedó bien, aunque tomó un poco más de lo esperado.",
    ),
    (
        "Camila",
        "Instalación de ducha",
        70000,
        "Instalación de ducha nueva",
        4,
        "Buen trabajo y comunicación durante todo el servicio.",
    ),
    ("Santiago", "Revisión de tuberías", 55000, "Revisión general", None, None),
)
app = Flask(__name__)


def _leer_datos_json():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return None
    return datos


def _error_datos_invalidos():
    return jsonify({"error": "El cuerpo debe ser un objeto JSON válido"}), 400


def _error_si_resena_no_es_del_cliente_actual(resena_id):
    resena = next(
        (elemento for elemento in almacenamiento.resenas if elemento.id == resena_id),
        None,
    )
    if resena is not None and resena.cliente != CLIENTE_ACTUAL:
        return jsonify({"error": "Solo puedes modificar o eliminar tu propia reseña"}), 403
    return None


@app.get("/")
def inicio():
    return redirect("/resenas")


@app.get("/resenas")
def pagina_resenas():
    return send_from_directory(
        RAIZ_PROYECTO / "html" / "resenas",
        "resenas.html",
    )


@app.get("/css/<path:archivo>")
def servir_css(archivo):
    return send_from_directory(RAIZ_PROYECTO / "css", archivo)


@app.get("/js/<path:archivo>")
def servir_javascript(archivo):
    return send_from_directory(RAIZ_PROYECTO / "js", archivo)


@app.get("/img/<path:archivo>")
def servir_imagen(archivo):
    return send_from_directory(RAIZ_PROYECTO / "img", archivo)


@app.get("/api/contratos")
def consultar_historial_contratos():
    contratos = fn_historial_contratos()
    return jsonify([contrato.a_diccionario() for contrato in contratos])


@app.post("/api/contratos")
def crear_contrato():
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        contrato = fn_crear_contrato(
            datos.get("cliente"),
            datos.get("especialista"),
            datos.get("servicio"),
            datos.get("precio"),
            datos.get("descripcion", ""),
        )
        return jsonify(contrato.a_diccionario()), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@app.get("/api/contratos/<int:contrato_id>")
def consultar_contrato(contrato_id):
    try:
        contrato = fn_consultar_contrato(contrato_id)
        return jsonify(contrato.a_diccionario())
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@app.patch("/api/contratos/<int:contrato_id>")
def modificar_contrato(contrato_id):
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        contrato = fn_modificar_contrato(
            contrato_id,
            p_cliente=datos.get("cliente"),
            p_especialista=datos.get("especialista"),
            p_servicio=datos.get("servicio"),
            p_precio=datos.get("precio"),
            p_descripcion=datos.get("descripcion"),
        )
        return jsonify(contrato.a_diccionario())
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@app.delete("/api/contratos/<int:contrato_id>")
def eliminar_contrato(contrato_id):
    try:
        contrato = fn_eliminar_contrato(contrato_id)
        return jsonify(contrato.a_diccionario())
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@app.get("/api/resenas")
def consultar_resenas():
    especialista = request.args.get("especialista", "").strip()
    if not especialista:
        return jsonify({"error": "Indica el especialista que quieres consultar"}), 400

    try:
        resenas = fn_consultar_resenas_especialista(especialista)
        return jsonify([resena.a_diccionario() for resena in resenas])
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

@app.get("/contrato")
def pagina_contrato():
    return send_from_directory(
        RAIZ_PROYECTO,
        "Contrato.html",
    )


@app.get("/historial-contratos")
def pagina_historial_contratos():
    return send_from_directory(
        RAIZ_PROYECTO,
        "historial_contratos.html",
    )

@app.post("/api/resenas")
def crear_resena():
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        resena = fn_crear_resena(
            datos.get("contrato_id"),
            CLIENTE_ACTUAL,
            datos.get("calificacion"),
            datos.get("comentario"),
        )
        return jsonify(resena.a_diccionario()), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@app.patch("/api/resenas/<int:resena_id>")
def modificar_resena(resena_id):
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    error_autoria = _error_si_resena_no_es_del_cliente_actual(resena_id)
    if error_autoria is not None:
        return error_autoria

    try:
        resena = fn_modificar_resena(
            resena_id,
            CLIENTE_ACTUAL,
            p_calificacion=datos.get("calificacion"),
            p_comentario=datos.get("comentario"),
        )
        return jsonify(resena.a_diccionario())
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


@app.delete("/api/resenas/<int:resena_id>")
def eliminar_resena(resena_id):
    error_autoria = _error_si_resena_no_es_del_cliente_actual(resena_id)
    if error_autoria is not None:
        return error_autoria

    try:
        fn_eliminar_resena(resena_id, CLIENTE_ACTUAL)
        return jsonify({"mensaje": "Reseña eliminada"})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


def cargar_datos_de_prueba():
    contratos = []
    resenas = []
    for (
        cliente,
        servicio,
        precio,
        descripcion,
        calificacion,
        comentario,
    ) in DATOS_DEMO:
        contrato = next(
            (
                elemento
                for elemento in fn_historial_contratos()
                if elemento.estado == "activo"
                and elemento.cliente == cliente
                and elemento.especialista == "Carlos Gómez"
                and elemento.servicio == servicio
            ),
            None,
        )
        if contrato is None:
            contrato = fn_crear_contrato(
                cliente,
                "Carlos Gómez",
                servicio,
                precio,
                descripcion,
            )
        contratos.append(contrato)

        if calificacion is not None and not any(
            resena.contrato_id == contrato.id
            for resena in almacenamiento.resenas
        ):
            resenas.append(
                fn_crear_resena(
                    contrato.id,
                    cliente,
                    calificacion,
                    comentario,
                )
            )

    return contratos, resenas


if __name__ == "__main__":
    contratos_demo, _ = cargar_datos_de_prueba()
    contratos_con_resena = {
        resena.contrato_id for resena in almacenamiento.resenas
    }
    contratos_disponibles = sum(
        contrato.estado == "activo" and contrato.id not in contratos_con_resena
        for contrato in contratos_demo
    )
    print(
        f"{len(contratos_demo)} contratos de prueba y "
        f"{len(almacenamiento.resenas)} reseñas de ejemplo listos "
        f"({contratos_disponibles} contratos disponibles para reseñar)."
    )
    app.run(debug=True, use_reloader=False)
