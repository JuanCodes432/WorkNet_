
const API_CONTRATOS = "/api/contratos";

document.addEventListener("DOMContentLoaded", () => {
    const campos = [
        "R0", "R1", "R2", "R3", "R4",
        "R5", "R6", "R7", "R9"
    ];

    campos.forEach(id => {
        document.getElementById(id).addEventListener(
            "input", actualizarVistaPrevia
        );
    });

    document.getElementById("R4").addEventListener(
        "change", actualizarVistaPrevia
    );

    actualizarVistaPrevia();
});

function obtenerValor(id) {
    return document.getElementById(id).value.trim();
}

function actualizarVistaPrevia() {
    const valores = {
        Pcliente: obtenerValor("R0"),
        Pprofesional: obtenerValor("R1"),
        Pservicio: obtenerValor("R2"),
        Palcance: obtenerValor("R3"),
        PfechaServicio: obtenerValor("R4"),
        Phora: obtenerValor("R5"),
        Plugar: obtenerValor("R6"),
        Pimporte: obtenerValor("R7"),
        Pcondiciones: obtenerValor("R9")
    };

    Object.entries(valores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);

        if (id === "Pimporte") {
            elemento.textContent = valor
                ? new Intl.NumberFormat("es-CO").format(Number(valor))
                : "0";
        } else {
            elemento.textContent = valor || "—";
        }
    });

    document.getElementById("Pfecha").textContent =
        new Date().toLocaleDateString("es-CO");
}

function obtenerDatosRecibo() {
    return {
        cliente: obtenerValor("R0"),
        especialista: obtenerValor("R1"),
        servicio: obtenerValor("R2"),
        alcance: obtenerValor("R3"),
        fecha: obtenerValor("R4"),
        hora: obtenerValor("R5"),
        direccion: obtenerValor("R6"),
        precio: Number(obtenerValor("R7")),
        condiciones: obtenerValor("R9")
    };
}

function validarDatosRecibo(datos) {
    const { cliente, especialista, servicio, precio } = datos;
    if (!cliente || !especialista || !servicio) {
        alert("Completa los datos del cliente, profesional y servicio.");
        return false;
    }

    if (!Number.isFinite(precio) || precio <= 0) {
        alert("Ingresa un importe mayor que cero.");
        return false;
    }

    return true;
}

async function solicitarDescargaPdf(ruta, nombreArchivo, datos) {
    const respuesta = await fetch(ruta, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });

    const tipoRespuesta = respuesta.headers.get("Content-Type") || "";
    if (!respuesta.ok || !tipoRespuesta.includes("application/pdf")) {
        const cuerpo = await respuesta.text();
        let mensaje = cuerpo;

        if (tipoRespuesta.includes("application/json")) {
            try {
                mensaje = JSON.parse(cuerpo).error || cuerpo;
            } catch (error) {
                console.error("La API devolvió JSON inválido:", error);
            }
        }

        throw new Error(
            mensaje || `El servidor no pudo generar el PDF (HTTP ${respuesta.status}).`
        );
    }

    const archivo = await respuesta.blob();
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return respuesta.headers.get("X-Contrato-Id");
}

async function generarRecibo() {
    const datos = obtenerDatosRecibo();
    if (!validarDatosRecibo(datos)) return;

    try {
        const numero = await solicitarDescargaPdf(
            `${API_CONTRATOS}/recibo`,
            "recibo-acuerdo.pdf",
            datos
        );
        alert(`Recibo REC-${numero} guardado en el historial y descargado.`);
        window.location.href = "/historial-contratos";

    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Error al generar el recibo.");
    }
}

async function descargarRecibo() {
    const datos = obtenerDatosRecibo();
    if (!validarDatosRecibo(datos)) return;

    try {
        await solicitarDescargaPdf(
            `${API_CONTRATOS}/recibo/pdf`,
            "recibo-acuerdo.pdf",
            datos
        );
    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Error al exportar el PDF.");
    }
}

function cancelarRecibo() {
    if (confirm("¿Deseas cancelar la creación del recibo?")) {
        window.location.href = "/historial-contratos";
    }
}
