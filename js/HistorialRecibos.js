
const API_CONTRATOS = "/api/contratos";

let recibos = [];

document.addEventListener("DOMContentLoaded", cargarRecibos);

async function cargarRecibos() {
    const tabla = document.getElementById("listaRecibos");

    tabla.textContent = "Cargando recibos...";

    try {
        const respuesta = await fetch(API_CONTRATOS);

        if (!respuesta.ok) {
            throw new Error("No se pudieron consultar los contratos");
        }

        recibos = await respuesta.json();

        actualizarEstadisticas();
        mostrarRecibos(recibos);

    } catch (error) {
        console.error(error);
        tabla.textContent = "Error al cargar los recibos.";
    }
}

function actualizarEstadisticas() {
    const activos = recibos.filter(r => r.estado === "activo");
    const eliminados = recibos.filter(r => r.estado === "eliminado");

    document.getElementById("totalRecibos").textContent =
        recibos.length;

    document.getElementById("recibosConfirmados").textContent =
        activos.length;

    document.getElementById("recibosPendientes").textContent =
        eliminados.length;
}

function mostrarRecibos(lista) {
    const tabla = document.getElementById("listaRecibos");

    tabla.replaceChildren();

    if (lista.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 7;
        celda.textContent = "No hay recibos registrados.";

        fila.appendChild(celda);
        tabla.appendChild(fila);
        return;
    }

    lista.forEach(recibo => {
        const fila = document.createElement("tr");

        const valores = [
            `REC-${recibo.id}`,
            recibo.cliente,
            recibo.servicio,
            formatearFecha(recibo.fecha_creacion),
            formatearPrecio(recibo.precio)
        ];

        valores.forEach(valor => {
            const celda = document.createElement("td");
            celda.textContent = valor ?? "";
            fila.appendChild(celda);
        });

        // Estado
        const celdaEstado = document.createElement("td");
        celdaEstado.textContent =
            recibo.estado === "activo" ? "Activo" : "Eliminado";

        fila.appendChild(celdaEstado);

        // Acciones
        const celdaAcciones = document.createElement("td");

        const botonVer = document.createElement("button");
        botonVer.textContent = "Ver";
        botonVer.addEventListener("click", () => {
            consultarRecibo(recibo.id);
        });

        celdaAcciones.appendChild(botonVer);

        if (recibo.estado !== "eliminado") {
            const botonEliminar = document.createElement("button");
            botonEliminar.textContent = "Eliminar";

            botonEliminar.addEventListener("click", () => {
                eliminarRecibo(recibo.id);
            });

            celdaAcciones.appendChild(botonEliminar);
        }

        fila.appendChild(celdaAcciones);
        tabla.appendChild(fila);
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "";

    const fechaParte = fecha.split(" ")[0];
    const partes = fechaParte.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(precio);
}

// BUSCADOR Y FILTROS

function filtrarRecibos() {
    const busqueda = document
        .getElementById("buscarRecibo")
        .value.toLowerCase();

    const estado = document
        .getElementById("filtroEstado")
        .value;

    const fecha = document
        .getElementById("filtroFecha")
        .value;

    const resultado = recibos.filter(recibo => {
        const coincideBusqueda =
            (recibo.cliente || "").toLowerCase().includes(busqueda) ||
            (recibo.servicio || "").toLowerCase().includes(busqueda);

        const coincideEstado =
            estado === "" || recibo.estado === estado;

        const coincideFecha =
            fecha === "" ||
            (recibo.fecha_creacion || "").startsWith(fecha);

        return coincideBusqueda && coincideEstado && coincideFecha;
    });

    mostrarRecibos(resultado);
}

// CONSULTAR UN CONTRATO

async function consultarRecibo(id) {
    try {
        const respuesta = await fetch(`${API_CONTRATOS}/${id}`);

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "No se pudo consultar");
        }

        alert(
            `RECIBO: ${datos.id}\n` +
            `Cliente: ${datos.cliente}\n` +
            `Profesional: ${datos.especialista}\n` +
            `Servicio: ${datos.servicio}\n` +
            `Precio: ${formatearPrecio(datos.precio)}\n` +
            `Descripción: ${datos.descripcion}`
        );

    } catch (error) {
        alert(error.message);
    }
}

// ELIMINAR UN CONTRATO

async function eliminarRecibo(id) {
    if (!confirm("¿Deseas eliminar este recibo?")) return;

    try {
        const respuesta = await fetch(`${API_CONTRATOS}/${id}`, {
            method: "DELETE"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "No se pudo eliminar");
        }

        alert("Recibo eliminado correctamente.");

        await cargarRecibos();

    } catch (error) {
        alert(error.message);
    }
}

// EVENTOS DE LOS FILTROS

document.getElementById("buscarRecibo")
    .addEventListener("input", filtrarRecibos);

document.getElementById("filtroEstado")
    .addEventListener("change", filtrarRecibos);

document.getElementById("filtroFecha")
    .addEventListener("change", filtrarRecibos);
