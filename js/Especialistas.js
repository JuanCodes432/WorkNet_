const API_ESPECIALISTAS = "/api/especialistas";
const CATEGORIAS = {
    plomeria: ["plomer", "fontan", "tuber", "fuga"],
    electricidad: ["electric", "cable", "instalacion"],
    tecnologia: ["tecnolog", "software", "sistema", "informat", "comput"],
    hogar: ["plomer", "fontan", "tuber", "fuga", "electric", "hogar", "repar"],
};

document.addEventListener("DOMContentLoaded", cargarEspecialistas);

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

async function cargarEspecialistas() {
    const mensaje = document.getElementById("mensaje");
    const lista = document.getElementById("lista-especialistas");

    try {
        const respuesta = await fetch(API_ESPECIALISTAS);
        const especialistas = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(especialistas.error || "No se pudieron cargar los especialistas.");
        }

        const parametros = new URLSearchParams(window.location.search);
        const consulta = normalizar(parametros.get("q"));
        const ciudad = normalizar(parametros.get("city"));
        const categoria = parametros.get("category");
        const palabrasCategoria = CATEGORIAS[categoria] || [];
        const filtrados = especialistas.filter(especialista => {
            const texto = normalizar([
                especialista.nombre,
                especialista.profesion,
                especialista.descripcion
            ].join(" "));
            return (!consulta || texto.includes(consulta)) &&
                (!ciudad || normalizar(especialista.ciudad).includes(ciudad)) &&
                (!palabrasCategoria.length ||
                    palabrasCategoria.some(palabra => texto.includes(palabra)));
        });

        lista.replaceChildren();
        if (filtrados.length === 0) {
            mensaje.textContent = especialistas.length === 0
                ? "No hay especialistas disponibles."
                : "No encontramos especialistas que coincidan con tu búsqueda.";
            return;
        }

        filtrados.forEach(especialista => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "tarjeta-especialista";

            const nombre = document.createElement("h2");
            nombre.textContent = especialista.nombre;

            const profesion = document.createElement("p");
            profesion.textContent = especialista.profesion;

            const ciudad = document.createElement("p");
            ciudad.textContent = especialista.ciudad;

            const descripcion = document.createElement("p");
            descripcion.textContent = especialista.descripcion;

            const contratar = document.createElement("a");
            contratar.className = "boton-contratar";
            contratar.href = `/contratar?especialista_id=${encodeURIComponent(especialista.id)}`;
            contratar.textContent = "Contratar";

            tarjeta.append(nombre, profesion, ciudad, descripcion, contratar);
            lista.appendChild(tarjeta);
        });

        mensaje.textContent = "";
    } catch (error) {
        console.error(error);
        mensaje.textContent = error.message;
    }
}
