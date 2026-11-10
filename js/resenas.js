
const RUTA_IMG = "../../img";
const ESPECIALISTA = "Carlos Gómez";
const CLIENTE_ACTUAL = document.getElementById("usuario-actual").textContent.trim();

let resenas = [];
let filtro = "todas";
let orden = "destacadas";
let expandido = false;
const marcadasUtiles = new Set();

const lista = document.getElementById("lista-resenas");
const contador = document.getElementById("contador");
const botonMas = document.getElementById("btn-mas");
const selectOrden = document.getElementById("orden");
const contenedorFiltros = document.getElementById("filtros");
const aviso = document.getElementById("aviso");
const botonMenu = document.getElementById("btn-menu");
const barraLateral = document.getElementById("sidebar");
const fondoMenu = document.getElementById("fondo-menu");
const formularioResena = document.getElementById("form-resena");
const mensajeFormulario = document.getElementById("mensaje-form-resena");
const selectorContrato = formularioResena.elements.contrato_id;
const promedioResenas = document.getElementById("promedio-resenas");
const promedioDetalle = document.getElementById("promedio-detalle");
const estrellasResumen = document.getElementById("estrellas-resumen");
const totalResenas = document.getElementById("total-resenas");
const promedioPerfil = document.getElementById("promedio-perfil");
const estrellasPerfil = document.getElementById("estrellas-perfil");
const totalPerfil = document.getElementById("total-perfil");

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}

function dibujarEstrellas(valoracion) {
  const cantidad = Math.max(0, Math.min(5, Math.round(valoracion)));
  let html = "";
  for (let i = 0; i < cantidad; i++) html += "<span>★</span>";
  for (let i = cantidad; i < 5; i++) {
    html += '<span class="star-empty">★</span>';
  }
  return `<span class="stars" aria-label="${cantidad} de 5 estrellas">${html}</span>`;
}

function textoResenas(cantidad) {
  return `${cantidad} ${cantidad === 1 ? "reseña" : "reseñas"}`;
}

function dibujarAvatar(foto) {
  if (foto) {
    return `<img class="avatar-photo" src="${escaparHtml(foto)}" alt="">`;
  }
  return `<span class="avatar-fallback"><img class="icon" src="${RUTA_IMG}/iconos/usuario-oscuro.svg" alt=""></span>`;
}

function dibujarResena(resena) {
  const nombre = escaparHtml(resena.cliente);
  const comentario = escaparHtml(resena.comentario);
  const id = escaparHtml(resena.id);
  const esUtil = marcadasUtiles.has(resena.id);
  const accionesPropias = resena.cliente === CLIENTE_ACTUAL
    ? `
      <div class="review-actions">
        <button class="review-action" type="button" data-editar="${id}"
                aria-expanded="false">Editar</button>
        <button class="review-action delete" type="button" data-eliminar="${id}">
          Eliminar
        </button>
      </div>
      <form class="review-edit-form" data-form-edicion="${id}" hidden>
        <label>
          Calificación
          <select name="calificacion" required>
            <option value="5" ${resena.calificacion === 5 ? "selected" : ""}>5 estrellas</option>
            <option value="4" ${resena.calificacion === 4 ? "selected" : ""}>4 estrellas</option>
            <option value="3" ${resena.calificacion === 3 ? "selected" : ""}>3 estrellas</option>
            <option value="2" ${resena.calificacion === 2 ? "selected" : ""}>2 estrellas</option>
            <option value="1" ${resena.calificacion === 1 ? "selected" : ""}>1 estrella</option>
          </select>
        </label>
        <label>
          Comentario
          <textarea name="comentario" rows="3" maxlength="1000" required>${comentario}</textarea>
        </label>
        <div class="review-actions">
          <button class="review-action save" type="submit">Guardar cambios</button>
          <button class="review-action" type="button" data-cancelar="${id}">Cancelar</button>
        </div>
        <p class="review-form-message" role="status" aria-live="polite" hidden></p>
      </form>`
    : "";

  return `
    <article class="review-card">
      <div class="review-head">
        <div class="reviewer">
          ${dibujarAvatar(null)}
          <div>
            <strong>${nombre}</strong>
            <span>Cliente de ${escaparHtml(ESPECIALISTA)}</span>
          </div>
        </div>
        <div class="rating-row">
          ${dibujarEstrellas(resena.calificacion)}
          <strong>${escaparHtml(resena.calificacion)}/5</strong>
        </div>
      </div>
      <p class="review-quote">${comentario}</p>
      <button class="helpful-button ${esUtil ? "selected" : ""}" type="button"
              aria-pressed="${esUtil}" data-util="${id}">
        <img class="icon" src="${RUTA_IMG}/iconos/me-resulta-util.svg" alt="">
        ${esUtil ? "Te resulta útil" : "Me resulta útil"}
      </button>
      ${accionesPropias}
    </article>`;
}

function actualizarResumen() {
  const total = resenas.length;
  const promedio = total
    ? resenas.reduce((suma, resena) => suma + resena.calificacion, 0) / total
    : 0;
  const promedioTexto = promedio.toFixed(1);

  promedioResenas.textContent = promedioTexto;
  promedioDetalle.textContent = `${promedioTexto}/5`;
  estrellasResumen.innerHTML = dibujarEstrellas(promedio);
  estrellasResumen.setAttribute(
    "aria-label",
    `${promedioTexto} de 5 estrellas`
  );
  totalResenas.textContent = `Basado en ${textoResenas(total)}`;
  promedioPerfil.textContent = `${promedioTexto}/5`;
  estrellasPerfil.innerHTML = dibujarEstrellas(promedio);
  estrellasPerfil.setAttribute(
    "aria-label",
    `${promedioTexto} de 5 estrellas`
  );
  totalPerfil.textContent = `${textoResenas(total)} de clientes`;
}

function dibujarLista() {
  let resultado = filtro === "todas"
    ? [...resenas]
    : resenas.filter((resena) => resena.calificacion === Number(filtro));

  if (orden === "mayor") {
    resultado.sort((a, b) => b.calificacion - a.calificacion);
  }
  if (orden === "menor") {
    resultado.sort((a, b) => a.calificacion - b.calificacion);
  }

  const visibles = expandido ? resultado : resultado.slice(0, 3);
  lista.innerHTML = visibles.map(dibujarResena).join("");
  contador.textContent = (
    `Mostrando ${textoResenas(visibles.length)} de ${textoResenas(resultado.length)}`
  );
  botonMas.hidden = visibles.length >= resultado.length;
  actualizarResumen();

  if (resultado.length === 0) {
    lista.textContent = "Todavía no hay reseñas para este filtro.";
  }
}

async function cargarResenas() {
  lista.textContent = "Cargando reseñas...";
  try {
    const parametros = new URLSearchParams({ especialista: ESPECIALISTA });
    const respuesta = await fetch(`/api/resenas?${parametros}`);
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron cargar las reseñas.");
    }

    resenas = datos;
    dibujarLista();
  } catch (error) {
    console.error("No se pudieron cargar las reseñas:", error);
    lista.textContent = "No se pudieron cargar las reseñas. Intenta actualizar la página.";
    contador.textContent = "";
  }
}

async function cargarContratosDisponibles() {
  try {
    const parametros = new URLSearchParams({ especialista: ESPECIALISTA });
    const [respuestaContratos, respuestaResenas] = await Promise.all([
      fetch("/api/contratos"),
      fetch(`/api/resenas?${parametros}`)
    ]);
    const [contratos, resenasExistentes] = await Promise.all([
      respuestaContratos.json(),
      respuestaResenas.json()
    ]);
    if (!respuestaContratos.ok) {
      throw new Error(contratos.error || "No se pudieron cargar los contratos.");
    }
    if (!respuestaResenas.ok) {
      throw new Error(resenasExistentes.error || "No se pudieron consultar las reseñas.");
    }

    const contratosResenados = new Set(
      resenasExistentes.map((resena) => resena.contrato_id)
    );
    const disponibles = contratos.filter((contrato) => (
      contrato.estado === "activo"
      && contrato.especialista === ESPECIALISTA
      && contrato.cliente === CLIENTE_ACTUAL
      && !contratosResenados.has(contrato.id)
    ));

    selectorContrato.replaceChildren(
      new Option("Selecciona un contrato", ""),
      ...disponibles.map((contrato) => {
        const opcion = new Option(
          `#${contrato.id} · ${contrato.cliente} — ${contrato.servicio}`,
          contrato.id
        );
        return opcion;
      })
    );
    if (disponibles.length === 0) {
      mensajeFormulario.textContent = "No hay contratos disponibles para reseñar.";
      mensajeFormulario.classList.add("error");
      mensajeFormulario.hidden = false;
    }
  } catch (error) {
    console.error("No se pudieron cargar los contratos disponibles:", error);
    mensajeFormulario.textContent = error.message;
    mensajeFormulario.classList.add("error");
    mensajeFormulario.hidden = false;
  }
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add("visible");
  cerrarMenu();
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 2600);
}

function abrirMenu() {
  barraLateral.classList.add("open");
  fondoMenu.classList.add("visible");
  botonMenu.setAttribute("aria-expanded", "true");
}

function cerrarMenu() {
  barraLateral.classList.remove("open");
  fondoMenu.classList.remove("visible");
  botonMenu.setAttribute("aria-expanded", "false");
}

let temporizadorAviso;

botonMenu.addEventListener("click", () => {
  if (barraLateral.classList.contains("open")) cerrarMenu();
  else abrirMenu();
});
fondoMenu.addEventListener("click", cerrarMenu);

contenedorFiltros.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-filtro]");
  if (!boton) return;
  filtro = boton.dataset.filtro;
  contenedorFiltros.querySelectorAll("button").forEach((elemento) => {
    elemento.classList.remove("active");
  });
  boton.classList.add("active");
  dibujarLista();
});

selectOrden.addEventListener("change", () => {
  orden = selectOrden.value;
  dibujarLista();
});

botonMas.addEventListener("click", () => {
  expandido = true;
  dibujarLista();
});

lista.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-util]");
  if (boton) {
    const id = Number(boton.dataset.util);
    if (marcadasUtiles.has(id)) marcadasUtiles.delete(id);
    else marcadasUtiles.add(id);
    dibujarLista();
    return;
  }

  const botonEditar = evento.target.closest("button[data-editar]");
  if (botonEditar) {
    const formulario = lista.querySelector(
      `form[data-form-edicion="${botonEditar.dataset.editar}"]`
    );
    formulario.hidden = !formulario.hidden;
    botonEditar.setAttribute("aria-expanded", String(!formulario.hidden));
    return;
  }

  const botonCancelar = evento.target.closest("button[data-cancelar]");
  if (botonCancelar) {
    const formulario = lista.querySelector(
      `form[data-form-edicion="${botonCancelar.dataset.cancelar}"]`
    );
    formulario.reset();
    formulario.hidden = true;
    lista.querySelector(
      `button[data-editar="${botonCancelar.dataset.cancelar}"]`
    ).setAttribute("aria-expanded", "false");
    return;
  }

  const botonEliminar = evento.target.closest("button[data-eliminar]");
  if (botonEliminar) {
    eliminarResena(Number(botonEliminar.dataset.eliminar), botonEliminar);
  }
});

lista.addEventListener("submit", (evento) => {
  const formulario = evento.target.closest("form[data-form-edicion]");
  if (!formulario) return;
  evento.preventDefault();
  modificarResena(formulario);
});

async function modificarResena(formulario) {
  const id = formulario.dataset.formEdicion;
  const datos = {
    calificacion: Number(formulario.elements.calificacion.value),
    comentario: formulario.elements.comentario.value.trim()
  };
  const mensaje = formulario.querySelector(".review-form-message");

  try {
    const respuesta = await fetch(`/api/resenas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo modificar la reseña.");
    }

    await cargarResenas();
    mostrarAviso("Reseña modificada.");
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error");
    mensaje.hidden = false;
  }
}

async function eliminarResena(id, boton) {
  const resena = resenas.find((elemento) => elemento.id === id);
  if (!resena || !window.confirm("¿Quieres eliminar esta reseña?")) return;

  try {
    const respuesta = await fetch(`/api/resenas/${id}`, {
      method: "DELETE",
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar la reseña.");
    }

    await cargarResenas();
    await cargarContratosDisponibles();
    mostrarAviso("Reseña eliminada.");
  } catch (error) {
    const tarjeta = boton.closest(".review-card");
    let mensaje = tarjeta.querySelector(".review-delete-message");
    if (!mensaje) {
      mensaje = document.createElement("p");
      mensaje.className = "review-form-message error review-delete-message";
      mensaje.setAttribute("role", "status");
      tarjeta.append(mensaje);
    }
    mensaje.textContent = error.message;
  }
}

formularioResena.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensajeFormulario.hidden = true;

  const formulario = new FormData(formularioResena);
  const opcionContrato = selectorContrato.selectedOptions[0];
  if (!opcionContrato || !opcionContrato.value) {
    mensajeFormulario.textContent = "Selecciona un contrato para publicar la reseña.";
    mensajeFormulario.classList.add("error");
    mensajeFormulario.hidden = false;
    return;
  }
  const datos = {
    contrato_id: Number(formulario.get("contrato_id")),
    calificacion: Number(formulario.get("calificacion")),
    comentario: formulario.get("comentario").trim()
  };

  try {
    const respuesta = await fetch("/api/resenas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo publicar la reseña.");
    }

    formularioResena.reset();
    mensajeFormulario.textContent = "Reseña publicada.";
    mensajeFormulario.classList.remove("error");
    mensajeFormulario.hidden = false;
    await cargarResenas();
    await cargarContratosDisponibles();
  } catch (error) {
    mensajeFormulario.textContent = error.message;
    mensajeFormulario.classList.add("error");
    mensajeFormulario.hidden = false;
  }
});

document.querySelectorAll("[data-aviso]").forEach((boton) => {
  boton.addEventListener("click", () => mostrarAviso(boton.dataset.aviso));
});

document.querySelectorAll("[data-prevenir]").forEach((enlace) => {
  enlace.addEventListener("click", (evento) => evento.preventDefault());
});

cargarResenas();
cargarContratosDisponibles();
