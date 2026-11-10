
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

async function generarRecibo() {
    const cliente = obtenerValor("R0");
    const especialista = obtenerValor("R1");
    const servicio = obtenerValor("R2");
    const alcance = obtenerValor("R3");
    const fecha = obtenerValor("R4");
    const hora = obtenerValor("R5");
    const direccion = obtenerValor("R6");
    const precio = Number(obtenerValor("R7"));
    const condiciones = obtenerValor("R9");

    if (!cliente || !especialista || !servicio) {
        alert("Completa los datos del cliente, profesional y servicio.");
        return;
    }

    if (!Number.isFinite(precio) || precio <= 0) {
        alert("Ingresa un importe mayor que cero.");
        return;
    }

    // Se reúnen los campos adicionales en la descripción,
    // porque el modelo actual no tiene atributos independientes para ellos.
    const descripcion = [
        `Alcance: ${alcance}`,
        `Fecha del servicio: ${fecha}`,
        `Hora: ${hora}`,
        `Dirección: ${direccion}`,
        `Condiciones: ${condiciones}`
    ].join("\n");

    const datos = {
        cliente,
        especialista,
        servicio,
        precio,
        descripcion
    };

    try {
        const respuesta = await fetch(API_CONTRATOS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || "Error al generar el recibo.");
        }

        alert(`Recibo generado correctamente. Número: REC-${resultado.id}`);

        window.location.href = "/historial-contratos";

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function cancelarRecibo() {
    if (confirm("¿Deseas cancelar la creación del recibo?")) {
        window.location.href = "/historial-contratos";
    }
}
