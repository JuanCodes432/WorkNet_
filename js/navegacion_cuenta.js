(function configurarNavegacionDeCuenta() {
  "use strict";

  const nav = document.querySelector(".worknet-nav");
  const logoutLink = document.querySelector("[data-worknet-logout]");
  let cerrandoSesion = false;

  function mostrarSesionActiva(activa) {
    nav.dataset.sessionState = activa ? "authenticated" : "guest";
    document.documentElement.dataset.sessionState = activa
      ? "authenticated"
      : "guest";
    document.querySelectorAll("[data-worknet-guest]").forEach((elemento) => {
      elemento.hidden = activa;
    });
    document
      .querySelectorAll("[data-worknet-session], [data-worknet-logout]")
      .forEach((elemento) => {
        elemento.hidden = !activa;
      });
  }

  async function consultarSesion() {
    try {
      const response = await fetch("/api/me/profile", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (response.ok) {
        mostrarSesionActiva(true);
      } else {
        mostrarSesionActiva(false);
      }
    } catch {
      mostrarSesionActiva(false);
    }
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();
      if (cerrandoSesion) return;

      cerrandoSesion = true;
      logoutLink.setAttribute("aria-disabled", "true");
      try {
        const response = await fetch("/api/me/session", {
          method: "DELETE",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        });
        if (response.status !== 204) {
          let resultado;
          try {
            resultado = await response.json();
          } catch {
            resultado = null;
          }
          throw new Error(
            resultado && typeof resultado.error === "string"
              ? resultado.error
              : "No se pudo cerrar la sesión. Inténtalo de nuevo.",
          );
        }

        window.location.assign("/Perfil%20Profesional/Iniciar_Sesion.html");
      } catch (error) {
        window.alert(error.message);
      } finally {
        cerrandoSesion = false;
        logoutLink.removeAttribute("aria-disabled");
      }
    });
  }

  consultarSesion();
})();
