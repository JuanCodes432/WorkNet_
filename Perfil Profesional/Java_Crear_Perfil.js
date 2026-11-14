(function configurarCreacionDePerfil() {
  "use strict";

  const form = document.querySelector("#create-profile-form");
  const submitButton = document.querySelector("#create-submit");
  const formMessage = document.querySelector("#form-message");
  const citySelect = document.querySelector("#profile-city");
  let enviando = false;
  let errorCargaCiudades = false;

  const campos = {
    name: {
      input: document.querySelector("#profile-name"),
      error: document.querySelector("#name-error"),
      label: "El nombre",
      isText: true,
    },
    profession: {
      input: document.querySelector("#profile-profession"),
      error: document.querySelector("#profession-error"),
      label: "La profesión",
      isText: true,
    },
    city: {
      input: citySelect,
      error: document.querySelector("#city-error"),
      label: "La ciudad",
    },
    university: {
      input: document.querySelector("#profile-university"),
      error: document.querySelector("#university-error"),
      label: "La universidad",
      isText: true,
    },
    email: {
      input: document.querySelector("#account-email"),
      error: document.querySelector("#email-error"),
      label: "El correo electrónico",
    },
    password: {
      input: document.querySelector("#account-password"),
      error: document.querySelector("#password-error"),
      label: "La contraseña",
    },
    confirmation: {
      input: document.querySelector("#confirm-password"),
      error: document.querySelector("#confirm-password-error"),
      label: "La confirmación de contraseña",
    },
  };

  function mostrarMensaje(texto) {
    formMessage.textContent = texto;
    formMessage.hidden = false;
  }

  function limpiarMensaje() {
    if (errorCargaCiudades) return;
    formMessage.textContent = "";
    formMessage.hidden = true;
  }

  function establecerError(campo, texto) {
    campo.input.setCustomValidity(texto);
    campo.input.setAttribute("aria-invalid", "true");
    campo.error.textContent = texto;
  }

  function limpiarErroresDeCampos() {
    Object.values(campos).forEach((campo) => {
      campo.input.setCustomValidity("");
      campo.input.removeAttribute("aria-invalid");
      campo.error.textContent = "";
    });
  }

  function validarContrasenas() {
    const passwordCampo = campos.password;
    const confirmacionCampo = campos.confirmation;
    const password = passwordCampo.input.value;
    const confirmation = confirmacionCampo.input.value;

    [passwordCampo, confirmacionCampo].forEach((campo) => {
      campo.input.setCustomValidity("");
      campo.input.removeAttribute("aria-invalid");
      campo.error.textContent = "";
    });

    if (password && password.length < 12) {
      establecerError(
        passwordCampo,
        "La contraseña debe tener al menos 12 caracteres.",
      );
    } else if (confirmation && password !== confirmation) {
      establecerError(confirmacionCampo, "Las contraseñas no coinciden.");
    }
  }

  function validarFormulario() {
    limpiarErroresDeCampos();
    let valido = true;

    Object.entries(campos).forEach(([nombre, campo]) => {
      const valor = campo.input.value;
      if (campo.isText && !valor.trim()) {
        establecerError(campo, `${campo.label} es obligatorio.`);
        valido = false;
      } else if (nombre === "city" && !valor) {
        establecerError(campo, "Selecciona una ciudad.");
        valido = false;
      } else if (nombre === "email" && !valor.trim()) {
        establecerError(campo, "El correo electrónico es obligatorio.");
        valido = false;
      } else if (nombre === "email" && !campo.input.validity.valid) {
        establecerError(campo, "Ingresa un correo electrónico válido.");
        valido = false;
      } else if (nombre === "password" && valor.length < 12) {
        establecerError(campo, "La contraseña debe tener al menos 12 caracteres.");
        valido = false;
      } else if (nombre === "confirmation" && !valor) {
        establecerError(campo, "Confirma tu contraseña.");
        valido = false;
      }
    });

    const password = campos.password.input.value;
    const confirmation = campos.confirmation.input.value;
    if (password.length >= 12 && confirmation && password !== confirmation) {
      establecerError(campos.confirmation, "Las contraseñas no coinciden.");
      valido = false;
    }

    return valido;
  }

  async function cargarCiudades() {
    try {
      const response = await fetch("/api/cities", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("No se pudieron consultar las ciudades.");
      }

      const ciudades = await response.json();
      if (!Array.isArray(ciudades) || ciudades.length === 0) {
        throw new Error("El servidor no devolvió ciudades disponibles.");
      }

      const opciones = [new Option("Selecciona una ciudad", "")];
      ciudades.forEach((ciudad) => {
        if (
          ciudad &&
          typeof ciudad.id === "string" &&
          typeof ciudad.name === "string"
        ) {
          opciones.push(new Option(ciudad.name, ciudad.name));
        }
      });
      if (opciones.length === 1) {
        throw new Error("El servidor no devolvió ciudades válidas.");
      }
      citySelect.replaceChildren(...opciones);
      errorCargaCiudades = false;
    } catch (error) {
      errorCargaCiudades = true;
      mostrarMensaje(
        error instanceof TypeError
          ? "No se pudieron cargar las ciudades. Comprueba la conexión e inténtalo de nuevo."
          : error instanceof SyntaxError
            ? "El servidor devolvió una respuesta de ciudades no válida."
            : error.message,
      );
    }
  }

  async function enviarFormulario(event) {
    event.preventDefault();
    if (enviando) return;

    limpiarMensaje();
    if (!validarFormulario()) {
      form.reportValidity();
      return;
    }

    enviando = true;
    submitButton.disabled = true;
    submitButton.textContent = "Creando perfil…";

    const solicitud = {
      email: campos.email.input.value.trim(),
      password: campos.password.input.value,
      profile: {
        name: campos.name.input.value.trim(),
        profession: campos.profession.input.value.trim(),
        city: campos.city.input.value,
        university: campos.university.input.value.trim(),
      },
    };

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(solicitud),
      });

      let resultado;
      try {
        resultado = await response.json();
      } catch {
        resultado = null;
      }

      if (response.status === 201) {
        window.location.assign("/Perfil%20Profesional/Perfil_Profesional.html");
        return;
      }

      // La API devuelve los errores de validación en la propiedad "error".
      mostrarMensaje(
        resultado && typeof resultado.error === "string"
          ? resultado.error
          : "No se pudo crear el perfil. Inténtalo de nuevo.",
      );
    } catch {
      mostrarMensaje("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      enviando = false;
      submitButton.disabled = false;
      submitButton.textContent = "Crear perfil";
    }
  }

  Object.values(campos).forEach((campo) => {
    campo.input.addEventListener("input", () => {
      limpiarMensaje();
      if (campo === campos.password || campo === campos.confirmation) {
        validarContrasenas();
      } else {
        campo.input.setCustomValidity("");
        campo.input.removeAttribute("aria-invalid");
        campo.error.textContent = "";
      }
    });
    campo.input.addEventListener("change", limpiarMensaje);
  });

  form.addEventListener("submit", enviarFormulario);
  cargarCiudades();
})();
