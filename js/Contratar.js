const API_ESPECIALISTAS = "/api/especialistas";
const API_PERFIL = "/api/me/profile";
const API_MIS_CONTRATOS = "/api/me/contratos";

let especialistaSeleccionado = null;
let perfilCliente = null;

document.addEventListener("DOMContentLoaded", iniciarFormulario);

async function leerRespuestaJson(respuesta) {
    const texto = await respuesta.text();
    try {
        return JSON.parse(texto);
    } catch {
        if (respuesta.status === 403) {
            throw new Error(
                "La API respondió HTTP 403 (Forbidden). Inicia WorkNet con Flask " +
                "usando `python py/api.py` y abre http://127.0.0.1:5000/ para contratar."
            );
        }
        throw new Error(
            `La API devolvió una respuesta no válida (HTTP ${respuesta.status}).`
        );
    }
}

async function iniciarFormulario() {
    const formulario = document.getElementById("form-contratacion");
    formulario.addEventListener("submit", crearContrato);

    try {
        const [respuestaPerfil, respuestaEspecialistas] = await Promise.all([
            fetch(API_PERFIL),
            fetch(API_ESPECIALISTAS)
        ]);
        const [perfil, especialistas] = await Promise.all([
            leerRespuestaJson(respuestaPerfil),
            leerRespuestaJson(respuestaEspecialistas)
        ]);

        if (respuestaPerfil.status === 401) {
            mostrarError("Inicia sesión para contratar un servicio.");
            return;
        }
        if (!respuestaPerfil.ok) {
            throw new Error(perfil.error || "No se pudo consultar tu perfil.");
        }
        if (!respuestaEspecialistas.ok) {
            throw new Error(especialistas.error || "No se pudieron cargar los especialistas.");
        }

        perfilCliente = perfil;
        document.getElementById("cliente-actual").textContent =
            `Contratando como: ${perfil.name}`;

        const especialistaId = new URLSearchParams(window.location.search)
            .get("especialista_id");
        especialistaSeleccionado = especialistas.find(
            elemento => String(elemento.id) === especialistaId
        );
        if (!especialistaSeleccionado) {
            mostrarError("El especialista seleccionado no está disponible.");
            return;
        }

        document.getElementById("especialista-seleccionado").textContent =
            `${especialistaSeleccionado.nombre} · ${especialistaSeleccionado.profesion} · ${especialistaSeleccionado.ciudad}`;
        document.getElementById("enviar-contratacion").disabled = false;
    } catch (error) {
        console.error(error);
        mostrarError(error.message);
    }
}

async function crearContrato(evento) {
    evento.preventDefault();
    if (!perfilCliente || !especialistaSeleccionado) return;

    const formulario = document.getElementById("form-contratacion");
    const boton = document.getElementById("enviar-contratacion");
    const mensaje = document.getElementById("mensaje-contratacion");
    boton.disabled = true;
    mensaje.hidden = true;

    const datos = {
        especialista_id: especialistaSeleccionado.id,
        servicio: formulario.elements.servicio.value.trim(),
        descripcion: formulario.elements.descripcion.value.trim(),
        precio: Number(formulario.elements.precio.value),
        fecha_acordada: formulario.elements.fecha_acordada.value || null
    };

    try {
        const respuesta = await fetch(API_MIS_CONTRATOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        const resultado = await leerRespuestaJson(respuesta);
        if (!respuesta.ok) {
            throw new Error(resultado.error || "No se pudo crear el contrato.");
        }
        window.location.href = "/historial-servicios";
    } catch (error) {
        console.error(error);
        mostrarError(error.message);
        boton.disabled = false;
    }
}

function mostrarError(mensaje) {
    const elemento = document.getElementById("mensaje-contratacion");
    elemento.textContent = mensaje;
    elemento.hidden = false;
}
