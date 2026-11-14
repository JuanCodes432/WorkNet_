(function conectarPerfilProfesionalConBackend() {
  "use strict";

  const API_BASE_URL = "/api";
  const REQUEST_TIMEOUT_MS = 6000;

  async function solicitarApi(path, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await window.fetch(`${API_BASE_URL}${path}`, {
        credentials: "same-origin",
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.status === 204 ? null : await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("La solicitud al servidor agotó el tiempo de espera.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.WorkNetApi = Object.freeze({
    getProfile: () => solicitarApi("/me/profile"),
    getCities: () => solicitarApi("/cities"),
    createAccount: (email, password, profile) => solicitarApi("/accounts", {
      method: "POST",
      body: JSON.stringify({ email, password, profile }),
    }),
    login: (email, password) => solicitarApi("/sessions", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
    logout: () => solicitarApi("/me/session", { method: "DELETE" }),
    saveProfile: (profile) => solicitarApi("/me/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    }),
    deleteAccount: () => solicitarApi("/me/account", { method: "DELETE" }),
  });
})();
