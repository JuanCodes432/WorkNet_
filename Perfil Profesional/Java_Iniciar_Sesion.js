(function configurarInicioDeSesion() {
  "use strict";

  const form = document.querySelector("#login-form");
  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  const message = document.querySelector("#login-message");
  const submitButton = document.querySelector("#login-submit");
  let enviando = false;

  function mostrarMensaje(texto) {
    message.textContent = texto;
    message.hidden = false;
  }

  function limpiarMensaje() {
    message.textContent = "";
    message.hidden = true;
  }

  async function comprobarSesion() {
    try {
      const response = await fetch("/api/me/profile", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function iniciarSesion(event) {
    event.preventDefault();
    if (enviando) return;
    limpiarMensaje();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    enviando = true;
    submitButton.disabled = true;
    submitButton.textContent = "Iniciando sesión…";

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      let resultado;
      try {
        resultado = await response.json();
      } catch {
        resultado = null;
      }

      if (response.ok) {
        window.location.assign("/Perfil%20Profesional/Perfil_Profesional.html");
        return;
      }

      mostrarMensaje(
        resultado && typeof resultado.error === "string"
          ? resultado.error
          : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      );
    } catch {
      mostrarMensaje("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      enviando = false;
      submitButton.disabled = false;
      submitButton.textContent = "Iniciar sesión";
    }
  }

  form.addEventListener("submit", iniciarSesion);
  form.addEventListener("input", limpiarMensaje);

  comprobarSesion().then((sesionActiva) => {
    if (sesionActiva) {
      window.location.assign("/Perfil%20Profesional/Perfil_Profesional.html");
    }
  });
})();
