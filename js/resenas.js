// =========================================================
// Worknet · Reseñas de clientes  (js/resenas.js)
// Aquí vive lo que se mueve en la página: filtros, orden,
// "Mostrar más", "Me resulta útil", menú de celular y avisos.
// =========================================================

// ---------- 0. Ruta a las imágenes ----------
// OJO: las rutas de imágenes se calculan desde donde está el HTML
// (html/resenas/resenas.html), NO desde donde está este archivo JS.
// Por eso hay que subir dos carpetas.
const RUTA_IMG = "../../img";

// ---------- 1. Datos de ejemplo ----------
// Más adelante estos datos pueden venir de data/especialistas.json
// o de una función en Python.
const resenas = [
  { nombre: "Maria Jose",      texto: "“Exelente trabajo”",           valoracion: 5, foto: null },
  { nombre: "Sandra Calambas", texto: "“Muy bueno”",                  valoracion: 4, foto: RUTA_IMG + "/fotos/cliente-a.jpg" },
  { nombre: "Juan Ardila",     texto: "“Perfecto trabajador”",        valoracion: 5, foto: RUTA_IMG + "/fotos/cliente-b.jpg" },
  { nombre: "Luisa Fernanda",  texto: "“Muy puntual y profesional”",  valoracion: 5, foto: RUTA_IMG + "/fotos/cliente-a.jpg" },
  { nombre: "Andrés Muñoz",    texto: "“Buen servicio”",              valoracion: 4, foto: RUTA_IMG + "/fotos/cliente-b.jpg" },
  { nombre: "Paola Rojas",     texto: "“Lo recomiendo totalmente”",   valoracion: 5, foto: null }
];

// Totales que muestra el diseño en "Mostrando X de Y reseñas"
const totalesDelDiseno = { todas: 10, "5": 7, "4": 3 };

// ---------- 2. Estado de la página ----------
let filtro = "todas";       // "todas", "5" o "4"
let orden = "destacadas";   // "destacadas", "mayor" o "menor"
let expandido = false;      // false = muestra 3, true = muestra todas
const marcadasUtiles = new Set();

// ---------- 3. Elementos del HTML que vamos a usar ----------
const lista = document.getElementById("lista-resenas");
const contador = document.getElementById("contador");
const botonMas = document.getElementById("btn-mas");
const selectOrden = document.getElementById("orden");
const contenedorFiltros = document.getElementById("filtros");
const aviso = document.getElementById("aviso");
const botonMenu = document.getElementById("btn-menu");
const barraLateral = document.getElementById("sidebar");
const fondoMenu = document.getElementById("fondo-menu");

// ---------- 4. Funciones que dibujan piezas ----------
function dibujarEstrellas(valoracion) {
  let html = "";
  for (let i = 0; i < valoracion; i++) {
    html += "<span>★</span>";
  }
  for (let i = valoracion; i < 5; i++) {
    html += '<span class="star-empty">★</span>';
  }
  return `<span class="stars" aria-label="${valoracion} de 5 estrellas">${html}</span>`;
}

function dibujarAvatar(foto) {
  if (foto) {
    return `<img class="avatar-photo" src="${foto}" alt="">`;
  }
  return `<span class="avatar-fallback"><img class="icon" src="${RUTA_IMG}/iconos/usuario-oscuro.svg" alt=""></span>`;
}

function dibujarResena(r) {
  const esUtil = marcadasUtiles.has(r.nombre);
  return `
    <article class="review-card">
      <div class="review-head">
        <div class="reviewer">
          ${dibujarAvatar(r.foto)}
          <div>
            <strong>${r.nombre}</strong>
            <span>Cliente de Carlos Gómez</span>
          </div>
        </div>
        <div class="rating-row">
          ${dibujarEstrellas(r.valoracion)}
          <strong>${r.valoracion}/5</strong>
        </div>
      </div>
      <p class="review-quote">${r.texto}</p>
      <button class="helpful-button ${esUtil ? "selected" : ""}" type="button"
              aria-pressed="${esUtil}" data-util="${r.nombre}">
        <img class="icon" src="${RUTA_IMG}/iconos/me-resulta-util.svg" alt="">
        ${esUtil ? "Te resulta útil" : "Me resulta útil"}
      </button>
    </article>`;
}

// ---------- 5. Dibujar la lista según filtro, orden y "mostrar más" ----------
function dibujarLista() {
  // Filtrar
  let resultado = resenas;
  if (filtro !== "todas") {
    resultado = resenas.filter((r) => r.valoracion === Number(filtro));
  }

  // Ordenar (copiamos la lista para no cambiar la original)
  resultado = [...resultado];
  if (orden === "mayor") resultado.sort((a, b) => b.valoracion - a.valoracion);
  if (orden === "menor") resultado.sort((a, b) => a.valoracion - b.valoracion);

  // Mostrar solo 3 si no se ha pulsado "Mostrar más"
  const disponibles = resultado.length;
  const visibles = expandido ? resultado : resultado.slice(0, 3);

  lista.innerHTML = visibles.map(dibujarResena).join("");
  contador.textContent = `Mostrando ${visibles.length} de ${totalesDelDiseno[filtro]} reseñas`;
  botonMas.hidden = visibles.length >= disponibles;
}

// ---------- 6. Aviso flotante ----------
let temporizadorAviso;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add("visible");
  cerrarMenu();
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 2600);
}

// ---------- 7. Menú de celular ----------
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

botonMenu.addEventListener("click", () => {
  if (barraLateral.classList.contains("open")) cerrarMenu();
  else abrirMenu();
});
fondoMenu.addEventListener("click", cerrarMenu);

// ---------- 8. Eventos ----------

// Filtros: Todas / 5 estrellas / 4 estrellas
contenedorFiltros.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-filtro]");
  if (!boton) return;
  filtro = boton.dataset.filtro;
  contenedorFiltros.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  boton.classList.add("active");
  dibujarLista();
});

// Orden
selectOrden.addEventListener("change", () => {
  orden = selectOrden.value;
  dibujarLista();
});

// Mostrar más
botonMas.addEventListener("click", () => {
  expandido = true;
  dibujarLista();
});

// "Me resulta útil" (como las tarjetas se redibujan, escuchamos en la lista)
lista.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-util]");
  if (!boton) return;
  const nombre = boton.dataset.util;
  if (marcadasUtiles.has(nombre)) marcadasUtiles.delete(nombre);
  else marcadasUtiles.add(nombre);
  dibujarLista();
});

// Botones que solo muestran un aviso (todavía no llevan a otra pantalla)
document.querySelectorAll("[data-aviso]").forEach((boton) => {
  boton.addEventListener("click", () => mostrarAviso(boton.dataset.aviso));
});

// Enlaces de ejemplo que no deben recargar la página
document.querySelectorAll("[data-prevenir]").forEach((enlace) => {
  enlace.addEventListener("click", (evento) => evento.preventDefault());
});

// ---------- 9. Arranque ----------
dibujarLista();
