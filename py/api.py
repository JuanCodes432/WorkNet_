import os
from datetime import timedelta
from pathlib import Path

from flask import Flask, redirect, send_from_directory

from contratos.contrato_rutas import contrato_bp
from cuentas.cuenta_rutas import cuenta_bp
from resenas.resena_rutas import resena_bp


RAIZ_PROYECTO = Path(__file__).resolve().parent.parent
HOST = os.environ.get("WORKNET_HOST", "127.0.0.1")


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
    flask_app.register_blueprint(resena_bp)
    flask_app.register_blueprint(cuenta_bp)

    @flask_app.get("/")
    def inicio():
        return send_from_directory(RAIZ_PROYECTO, "index.html")

    @flask_app.get("/resenas")
    def pagina_resenas():
        return send_from_directory(
            RAIZ_PROYECTO / "html" / "resenas",
            "resenas.html",
        )

    @flask_app.get("/contrato")
    def pagina_contrato():
        return send_from_directory(RAIZ_PROYECTO, "Contrato.html")

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

    return flask_app


application = create_app()


if __name__ == "__main__":
    from datos_prueba import cargar_datos_de_prueba

    cargar_datos_de_prueba()
    application.run(host=HOST, port=5000, debug=True, use_reloader=False)
