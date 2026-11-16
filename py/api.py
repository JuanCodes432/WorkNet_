import math
import os
from datetime import timedelta
from io import BytesIO
from pathlib import Path

from flask import (
    Flask,
    jsonify,
    make_response,
    redirect,
    request,
    send_file,
    send_from_directory,
)

from contratos import (
    fn_consultar_contrato,
    fn_crear_contrato,
    fn_eliminar_contrato,
    fn_historial_contratos,
    fn_modificar_contrato,
)
from contratos.contrato_pdf import generar_pdf_recibo
from contratos.contrato_rutas import (
    contrato_bp,
    demo_contratos_bp,
    especialistas_bp,
    mis_contratos_bp,
)
from cuentas.cuenta_rutas import cuenta_bp
from resenas import (
    fn_consultar_resenas_especialista,
    fn_crear_resena,
    fn_eliminar_resena,
    fn_modificar_resena,
)
from resenas.resena_rutas import resena_bp

RAIZ_PROYECTO = Path(__file__).resolve().parent.parent
HOST = os.environ.get("WORKNET_HOST", "127.0.0.1")


def _leer_datos_json():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return None
    return datos


def _error_datos_invalidos():
    return jsonify({"error": "El cuerpo debe ser un objeto JSON válido"}), 400


def _validar_datos_recibo(datos):
    for campo in ("cliente", "especialista", "servicio"):
        if not isinstance(datos.get(campo), str) or not datos[campo].strip():
            raise ValueError(f"{campo.capitalize()} no puede estar vacío")

    campos_texto = (
        "cliente",
        "especialista",
        "servicio",
        "alcance",
        "fecha",
        "hora",
        "direccion",
        "condiciones",
    )
    if any(not isinstance(datos.get(campo, ""), str) for campo in campos_texto):
        raise ValueError("Los campos del recibo deben ser texto")

    precio = datos.get("precio")
    if isinstance(precio, bool) or not isinstance(precio, (int, float)):
        raise ValueError("El precio debe ser un número mayor que cero")
    try:
        precio_valido = math.isfinite(precio) and precio > 0
    except OverflowError:
        precio_valido = False
    if not precio_valido:
        raise ValueError("El precio debe ser un número mayor que cero")


def _respuesta_pdf_recibo(datos, numero, nombre_archivo):
    contenido_pdf = generar_pdf_recibo(datos, numero)
    respuesta = make_response(
        send_file(
            BytesIO(contenido_pdf),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=nombre_archivo,
        )
    )
    if numero != "BORRADOR":
        respuesta.headers["X-Contrato-Id"] = str(numero)
        respuesta.headers["Access-Control-Expose-Headers"] = "X-Contrato-Id"
    return respuesta


def create_app():
    flask_app = Flask(__name__)
    flask_app.config.update(
        SECRET_KEY=os.environ.get("WORKNET_SECRET_KEY")
        or "worknet-development-secret-change-before-deploying",
        PERMANENT_SESSION_LIFETIME=timedelta(days=7),
        SESSION_COOKIE_NAME="worknet_session",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=os.environ.get("WORKNET_COOKIE_SECURE") == "1",
        SESSION_COOKIE_SAMESITE="Lax",
    )

    flask_app.register_blueprint(contrato_bp)
    flask_app.register_blueprint(mis_contratos_bp)
    flask_app.register_blueprint(demo_contratos_bp)
    flask_app.register_blueprint(especialistas_bp)
    flask_app.register_blueprint(resena_bp)
    flask_app.register_blueprint(cuenta_bp)

    @flask_app.get("/")
    def inicio():
        return redirect("/resenas")

    @flask_app.get("/resenas")
    def pagina_resenas():
        return send_from_directory(
            RAIZ_PROYECTO / "html" / "resenas",
            "resenas.html",
        )

    @flask_app.get("/contrato")
    def pagina_contrato():
        return send_from_directory(RAIZ_PROYECTO, "Contrato.html")

    @flask_app.get("/especialistas")
    def pagina_especialistas():
        return send_from_directory(RAIZ_PROYECTO, "especialistas.html")

    @flask_app.get("/contratar")
    def pagina_contratar():
        return send_from_directory(RAIZ_PROYECTO, "contratar.html")

    @flask_app.get("/historial-contratos")
    def pagina_historial_contratos():
        return send_from_directory(RAIZ_PROYECTO, "historial_contratos.html")

    @flask_app.get("/Perfil Profesional/")
    def perfil_profesional():
        return redirect("/Perfil%20Profesional/Perfil_Profesional.html")

    @flask_app.get("/Perfil Profesional/<path:archivo>")
    def servir_perfil_profesional(archivo):
        return send_from_directory(RAIZ_PROYECTO / "Perfil Profesional", archivo)

    @flask_app.get("/Cuenta Eliminada/<path:archivo>")
    def servir_cuenta_eliminada(archivo):
        return send_from_directory(RAIZ_PROYECTO / "Cuenta Eliminada", archivo)

    @flask_app.get("/css/<path:archivo>")
    def servir_css(archivo):
        return send_from_directory(RAIZ_PROYECTO / "css", archivo)

    @flask_app.get("/js/<path:archivo>")
    def servir_javascript(archivo):
        return send_from_directory(RAIZ_PROYECTO / "js", archivo)

    @flask_app.get("/img/<path:archivo>")
    def servir_imagen(archivo):
        return send_from_directory(RAIZ_PROYECTO / "img", archivo)

    @flask_app.get("/favicon.ico")
    def favicon():
        return "", 204

    @flask_app.post("/api/contratos/recibo")
    def crear_recibo_pdf():
        datos = _leer_datos_json()
        if datos is None:
            return _error_datos_invalidos()

        try:
            _validar_datos_recibo(datos)
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

        descripcion = "\n".join([
            f"Alcance: {datos.get('alcance', '')}",
            f"Fecha del servicio: {datos.get('fecha', '')}",
            f"Hora: {datos.get('hora', '')}",
            f"Dirección: {datos.get('direccion', '')}",
            f"Condiciones: {datos.get('condiciones', '')}",
        ])

        try:
            contrato = fn_crear_contrato(
                datos.get("cliente"),
                datos.get("especialista"),
                datos.get("servicio"),
                datos.get("precio"),
                descripcion,
            )
            return _respuesta_pdf_recibo(
                datos,
                contrato.id,
                f"recibo-acuerdo-REC-{contrato.id}.pdf",
            )
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

    @flask_app.post("/api/contratos/recibo/pdf")
    def exportar_recibo_pdf():
        datos = _leer_datos_json()
        if datos is None:
            return _error_datos_invalidos()

        try:
            _validar_datos_recibo(datos)
            return _respuesta_pdf_recibo(
                datos,
                "BORRADOR",
                "recibo-acuerdo.pdf",
            )
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

    return flask_app


application = create_app()


if __name__ == "__main__":
    from datos_prueba import cargar_datos_de_prueba

    cargar_datos_de_prueba()
    application.run(host=HOST, port=5000, debug=True, use_reloader=False)