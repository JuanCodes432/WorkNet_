(function configurarHistorialServicios() {
  "use strict";

  const lista = document.getElementById("services-list");
  const contador = document.getElementById("services-count");
  const filtroEstado = document.getElementById("filter-status");
  const etiquetasEstado = {
    pendiente: "Pendiente",
    activo: "Activo",
    completado: "Completado",
    cancelado: "Cancelado",
    rechazado: "Rechazado",
    eliminado: "Eliminado",
  };
  let servicios = [];

  function formatearFecha(fecha) {
    if (!fecha) return "Fecha no disponible";
    const [dia] = fecha.split(" ");
    const partes = dia.split("-");
    return partes.length === 3
      ? `${partes[2]}/${partes[1]}/${partes[0]}`
      : fecha;
  }

  function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(precio);
  }

  function mostrarMensaje(texto, enlace) {
    lista.replaceChildren();
    const mensaje = document.createElement("p");
    mensaje.className = "message";
    mensaje.textContent = texto;
    if (enlace) {
      mensaje.append(" ");
      const link = document.createElement("a");
      link.href = enlace.href;
      link.textContent = enlace.texto;
      mensaje.append(link);
    }
    lista.append(mensaje);
  }

  function crearTarjeta(servicio) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "service-card";

    const contenido = document.createElement("div");
    const titulo = document.createElement("h3");
    titulo.textContent = servicio.servicio;
    const meta = document.createElement("p");
    meta.className = "service-meta";
    meta.textContent = `Especialista: ${servicio.especialista} · ${formatearPrecio(servicio.precio)}`;
    contenido.append(titulo, meta);

    const estado = document.createElement("span");
    estado.className = `status status--${servicio.estado}`;
    estado.textContent = etiquetasEstado[servicio.estado] || servicio.estado;

    const fecha = document.createElement("p");
    fecha.className = "service-date";
    fecha.textContent = `Solicitado: ${formatearFecha(servicio.fecha_creacion)}`;

    tarjeta.append(contenido, estado, fecha);
    if (servicio.descripcion) {
      const descripcion = document.createElement("p");
      descripcion.className = "service-description";
      descripcion.textContent = servicio.descripcion;
      tarjeta.append(descripcion);
    }
    return tarjeta;
  }

  function mostrarServicios() {
    const estadoSeleccionado = filtroEstado.value;
    const visibles = servicios.filter(
      (servicio) => !estadoSeleccionado || servicio.estado === estadoSeleccionado,
    );
    contador.textContent = `${visibles.length} de ${servicios.length} servicios`;
    lista.replaceChildren();

    if (visibles.length === 0) {
      mostrarMensaje(
        servicios.length === 0
          ? "Todavía no tienes servicios en tu historial."
          : "No hay servicios con ese estado.",
        servicios.length === 0
          ? { href: "/especialistas", texto: "Explorar especialistas" }
          : null,
      );
      return;
    }

    visibles.forEach((servicio) => lista.append(crearTarjeta(servicio)));
  }

  async function cargarServicios() {
    try {
      const respuesta = await fetch("/api/me/contratos", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const resultado = await respuesta.json();

      if (respuesta.status === 401) {
        mostrarMensaje("Inicia sesión para consultar tu historial.", {
          href: "/Perfil%20Profesional/Iniciar_Sesion.html",
          texto: "Iniciar sesión",
        });
        contador.textContent = "Inicia sesión para continuar";
        return;
      }
      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo cargar el historial.");
      }

      servicios = resultado.sort((a, b) =>
        (b.fecha_creacion || "").localeCompare(a.fecha_creacion || ""),
      );
      mostrarServicios();
    } catch (error) {
      console.error(error);
      contador.textContent = "No se pudo cargar el historial";
      mostrarMensaje(
        error instanceof Error ? error.message : "Error al cargar los servicios.",
      );
    }
  }

  filtroEstado.addEventListener("change", mostrarServicios);
  cargarServicios();
})();
