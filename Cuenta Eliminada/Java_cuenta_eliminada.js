(function iniciarPantallaCuentaEliminada() {
  "use strict";

  const PAGINA_DE_INICIO = "../Perfil%20Profesional/Perfil_Profesional.html";

  const elementoTituloConfirmacion = document.getElementById("titulo-confirmacion");
  const elementoAnioActual = document.getElementById("anio-actual");
  const botonVolverAlInicio = document.getElementById("boton-volver-al-inicio");

  // Cierra cualquier rastro de sesión guardado en el navegador,
  // ya que la cuenta dejó de existir.
  function limpiarDatosDeSesionGuardados() {
    try {
      window.sessionStorage.clear();
      window.localStorage.removeItem("tokenDeSesion");
      window.localStorage.removeItem("usuarioActual");
    } catch (errorDeAlmacenamiento) {
      // El navegador puede bloquear el almacenamiento (modo privado, por ejemplo).
      // No es crítico para mostrar la pantalla.
    }
  }

  // Actualiza el año del derecho de autor según la fecha del dispositivo.
  function mostrarAnioActualEnElPieDePagina() {
    if (elementoAnioActual) {
      elementoAnioActual.textContent = String(new Date().getFullYear());
    }
  }

  // Lleva el foco al título para que los lectores de pantalla anuncien
  // la confirmación apenas se carga la página.
  function anunciarConfirmacionAccesible() {
    if (elementoTituloConfirmacion) {
      elementoTituloConfirmacion.focus({ preventScroll: true });
    }
  }

  // Evita volver a esta pantalla con el botón "Atrás" del navegador.
  function reemplazarEntradaDelHistorial() {
    window.history.replaceState(null, "", window.location.href);
  }

  function volverAlInicio(eventoDeClic) {
    eventoDeClic.preventDefault();
    window.location.replace(PAGINA_DE_INICIO);
  }

  limpiarDatosDeSesionGuardados();
  mostrarAnioActualEnElPieDePagina();
  reemplazarEntradaDelHistorial();
  anunciarConfirmacionAccesible();

  if (botonVolverAlInicio) {
    botonVolverAlInicio.addEventListener("click", volverAlInicio);
  }
})();