const API_ESPECIALISTAS = "/api/especialistas";

document.addEventListener("DOMContentLoaded", cargarEspecialistas);

async function cargarEspecialistas() {
    const mensaje = document.getElementById("mensaje");
    const lista = document.getElementById("lista-especialistas");

    try {
        const respuesta = await fetch(API_ESPECIALISTAS);
        const especialistas = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(especialistas.error || "No se pudieron cargar los especialistas.");
        }

        lista.replaceChildren();
        if (especialistas.length === 0) {
            mensaje.textContent = "No hay especialistas disponibles.";
            return;
        }

        especialistas.forEach(especialista => {
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
