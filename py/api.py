from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory

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
app = Flask(__name__)


def _leer_datos_json():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return None
    return datos


def _error_datos_invalidos():
    return jsonify({"error": "El cuerpo debe ser un objeto JSON válido"}), 400


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
            datos.get("cliente"),
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

    try:
        resena = fn_modificar_resena(
            resena_id,
            datos.get("cliente"),
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
    datos = _leer_datos_json()
    if datos is None:
        return _error_datos_invalidos()

    try:
        fn_eliminar_resena(resena_id, datos.get("cliente"))
        return jsonify({"mensaje": "Reseña eliminada"})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except LookupError as error:
        return jsonify({"error": str(error)}), 404


def cargar_contrato_de_prueba():
    for contrato in fn_historial_contratos():
        if (
            contrato.estado == "activo"
            and contrato.cliente == "Ana"
            and contrato.especialista == "Carlos Gómez"
            and contrato.servicio == "Plomería"
        ):
            return contrato

    return fn_crear_contrato(
        "Ana",
        "Carlos Gómez",
        "Plomería",
        50000,
        "Reparación de una fuga de agua",
    )


if __name__ == "__main__":
    contrato_demo = cargar_contrato_de_prueba()
    print(
        "Contrato de prueba listo: "
        f"ID {contrato_demo.id}, cliente Ana, especialista Carlos Gómez"
    )
    app.run(debug=True, use_reloader=False)
