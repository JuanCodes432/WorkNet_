'use strict';

/* ==========================================================================
   Worknet · Página de inicio
   --------------------------------------------------------------------------
   Todo lo que depende del backend está en la sección "API". Mientras el
   servidor no responda, la página usa los datos de ejemplo (FALLBACK) para
   que se vea igual que el diseño.

   Endpoints esperados (ajusta CONFIG.API_BASE_URL y las rutas a tu backend):

     GET  /api/me
          → { "name": "Pepito", "city": "Popayán, Cauca" }

     GET  /api/cities
          → [ { "id": "popayan", "name": "Popayán, Cauca" }, ... ]

     GET  /api/specialists/recommended?city=Popayán, Cauca
          → [ { "id", "name", "profession", "description",
                "photoUrl", "verified": true, "badge": "Más cercano" }, ... ]

     GET  /api/categories
          → [ { "id": "plomeria", "name": "Plomería", "icon": "droplets" }, ... ]
          (icon: droplets | zap | laptop | house | wrench)

     POST /api/specialists/:id/recommend   body: { "recommended": true|false }
   ========================================================================== */

const CONFIG = {
  API_BASE_URL: '/api',
  REQUEST_TIMEOUT_MS: 6000,
  DEFAULT_CITY: 'Popayán, Cauca',
  CITY_STORAGE_KEY: 'worknet:city',
  // Páginas a las que navega el front (cámbialas por tus rutas reales)
  PAGES: {
    results: 'resultados.html',
    profile: 'perfil.html',
  },
};

/* Datos de ejemplo: se usan solo si el backend no responde */
const FALLBACK = {
  me: { name: 'Pepito', city: CONFIG.DEFAULT_CITY },
  cities: [
    { id: 'popayan', name: 'Popayán, Cauca' },
    { id: 'cali', name: 'Cali, Valle del Cauca' },
    { id: 'bogota', name: 'Bogotá, D.C.' },
    { id: 'medellin', name: 'Medellín, Antioquia' },
  ],
  specialists: [
    {
      id: 'carlos-gomez',
      name: 'Carlos Gómez',
      profession: 'Plomero',
      description: 'Atención inmediata en Popayán para fugas, tuberías y emergencias del hogar.',
      photoUrl: 'img/carlos-gomez.png',
      verified: true,
      badge: 'Más cercano',
    },
    {
      id: 'juan-david-almeria',
      name: 'Juan David Almeria',
      profession: 'Electricista',
      description: 'Especialista cerca de ti para reparaciones urgentes e instalaciones eléctricas seguras.',
      photoUrl: 'img/juan-david-almeria.png',
      verified: true,
      badge: 'Más cercano',
    },
    {
      id: 'david-ruiz',
      name: 'David Ruiz',
      profession: 'Ingeniero de sistemas',
      description: 'Desarrollo de software y soporte técnico remoto o presencial con 5+ años de experiencia.',
      photoUrl: 'img/david-ruiz.png',
      verified: true,
      badge: 'Más cercano',
    },
  ],
  categories: [
    { id: 'plomeria', name: 'Plomería', icon: 'droplets' },
    { id: 'electricidad', name: 'Electricidad', icon: 'zap' },
    { id: 'tecnologia', name: 'Tecnología', icon: 'laptop' },
    { id: 'hogar', name: 'Servicios del hogar', icon: 'house' },
  ],
};

const ALLOWED_ICONS = new Set(['droplets', 'zap', 'laptop', 'house', 'wrench']);

/* ---------- Utilidades ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

/* Solo aceptamos URLs http(s) o rutas relativas para las fotos */
function safeUrl(url) {
  const value = String(url ?? '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || !/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return '';
}

function icon(name, size) {
  const cls = size ? ` icon--${size}` : '';
  return `<svg class="icon${cls}" aria-hidden="true"><use href="#i-${esc(name)}"/></svg>`;
}

function readStoredCity() {
  try { return localStorage.getItem(CONFIG.CITY_STORAGE_KEY); } catch { return null; }
}
function storeCity(city) {
  try { localStorage.setItem(CONFIG.CITY_STORAGE_KEY, city); } catch { /* sin almacenamiento */ }
}

/* ==========================================================================
   API  (aquí se conecta el backend)
   ========================================================================== */

async function api(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.status === 204 ? null : await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/* Intenta el backend; si falla, devuelve los datos de ejemplo */
async function withFallback(request, fallback) {
  try {
    const data = await request();
    return data ?? fallback;
  } catch (error) {
    console.info('[Worknet] Backend no disponible, usando datos de ejemplo:', error.message);
    return fallback;
  }
}

const Api = {
  getMe: () => withFallback(() => api('/me'), FALLBACK.me),
  getCities: () => withFallback(() => api('/cities'), FALLBACK.cities),
  getCategories: () => withFallback(() => api('/categories'), FALLBACK.categories),
  getRecommended: (city) =>
    withFallback(
      () => api(`/specialists/recommended?city=${encodeURIComponent(city)}`),
      FALLBACK.specialists
    ),
  setRecommendation: (id, recommended) =>
    api(`/specialists/${encodeURIComponent(id)}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommended }),
    }),
};

/* ==========================================================================
   Render
   ========================================================================== */

const state = { city: CONFIG.DEFAULT_CITY };

function renderUser(me) {
  const name = (me && me.name) || FALLBACK.me.name;
  $('#user-name').textContent = name;
}

function renderCities(cities) {
  const list = Array.isArray(cities) && cities.length ? cities : FALLBACK.cities;
  const names = list.map((c) => c.name);
  if (!names.includes(state.city)) names.unshift(state.city);

  $$('[data-city-select]').forEach((select) => {
    select.innerHTML = names
      .map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
      .join('');
    select.value = state.city;
  });
}

function setCity(city) {
  state.city = city;
  storeCity(city);
  $$('[data-city-select]').forEach((select) => { select.value = city; });
}

function skeletonCard() {
  return `
    <article class="card card--skeleton" aria-hidden="true">
      <div class="card__media"></div>
      <div class="card__body">
        <span class="sk sk--lg"></span>
        <span class="sk sk--sm"></span>
        <span class="sk"></span>
        <span class="sk" style="width:80%"></span>
        <span class="sk sk--btn"></span>
      </div>
    </article>`;
}

function specialistCard(s) {
  const profileUrl = `${CONFIG.PAGES.profile}?id=${encodeURIComponent(s.id)}`;
  const photo = safeUrl(s.photoUrl);
  const badge = s.badge
    ? `<span class="badge-near">${icon('map-pin')}${esc(s.badge)}</span>`
    : '';
  const verified = s.verified
    ? `<svg class="icon" role="img" aria-label="Perfil verificado"><use href="#i-badge-check"/></svg>`
    : '';

  return `
    <article class="card" data-id="${esc(s.id)}">
      <a class="card__media" href="${esc(profileUrl)}" aria-label="Ver perfil de ${esc(s.name)}">
        ${photo ? `<img src="${esc(photo)}" alt="${esc(s.name)}, ${esc(s.profession)}" loading="lazy">` : ''}
        ${badge}
      </a>
      <div class="card__body">
        <a class="card__identity" href="${esc(profileUrl)}">
          <span class="card__name">${esc(s.name)} ${verified}</span>
          <span class="card__role">${esc(s.profession)}</span>
        </a>
        <p class="card__desc">${esc(s.description)}</p>
        <div class="card__actions">
          <div class="card__stats">
            <button type="button" class="icon-btn" data-action="recommend"
                    aria-pressed="false" aria-label="Recomendar a ${esc(s.name)}" title="Recomendar">
              ${icon('thumbs-up')}
            </button>
            <span class="stat" title="Popularidad" role="img" aria-label="Popularidad">${icon('chart')}</span>
            <span class="stat" title="Cerca de ti" role="img" aria-label="Cerca de ti">${icon('map-pin')}</span>
          </div>
          <a class="btn btn--primary btn--sm" href="${esc(profileUrl)}">
            ${icon('arrow-up-right', 17)}
            Ver más
          </a>
        </div>
      </div>
    </article>`;
}

async function loadSpecialists() {
  const container = $('#specialists');
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = skeletonCard().repeat(3);

  const specialists = await Api.getRecommended(state.city);

  if (!Array.isArray(specialists) || specialists.length === 0) {
    container.innerHTML = '<p class="cards__empty">Aún no hay especialistas recomendados en tu zona.</p>';
  } else {
    container.innerHTML = specialists.map(specialistCard).join('');
  }
  container.setAttribute('aria-busy', 'false');

  $('#link-more-specialists').href =
    `${CONFIG.PAGES.results}?${new URLSearchParams({ city: state.city })}`;
}

function renderCategories(categories) {
  const list = Array.isArray(categories) && categories.length ? categories : FALLBACK.categories;
  $('#categories').innerHTML = list
    .map((c) => {
      const iconName = ALLOWED_ICONS.has(c.icon) ? c.icon : 'wrench';
      const href = `${CONFIG.PAGES.results}?${new URLSearchParams({ category: c.id, city: state.city })}`;
      return `
        <li>
          <a class="category" href="${esc(href)}">
            <span class="category__symbol">${icon(iconName)}</span>
            ${esc(c.name)}
          </a>
        </li>`;
    })
    .join('');
}

/* ==========================================================================
   Eventos
   ========================================================================== */

function bindEvents() {
  /* Buscador → página de resultados */
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = $('#search-query').value.trim();
    const params = new URLSearchParams({ city: state.city });
    if (query) params.set('q', query);
    window.location.href = `${CONFIG.PAGES.results}?${params}`;
  });

  /* Cambio de ciudad (barra superior y buscador van sincronizados) */
  $$('[data-city-select]').forEach((select) => {
    select.addEventListener('change', () => {
      setCity(select.value);
      loadSpecialists();
      Api.getCategories().then(renderCategories);
    });
  });

  /* Recomendar especialista (delegación de eventos) */
  $('#specialists').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="recommend"]');
    if (!button) return;

    const card = button.closest('.card');
    const next = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(next));
    button.disabled = true;

    try {
      await Api.setRecommendation(card.dataset.id, next);
    } catch (error) {
      // Sin backend (o error): se deshace el cambio para no mostrar algo falso
      button.setAttribute('aria-pressed', String(!next));
      console.info('[Worknet] No se pudo guardar la recomendación:', error.message);
    } finally {
      button.disabled = false;
    }
  });

  /* Si una foto no carga, se muestra el fondo degradado de la tarjeta */
  document.addEventListener('error', (event) => {
    const img = event.target;
    if (img instanceof HTMLImageElement && img.closest('.card__media')) {
      img.classList.add('is-broken');
    }
  }, true);

  /* Botones de la barra superior: listos para conectar */
  $('#btn-notifications').addEventListener('click', () => {
    // TODO: abrir panel de notificaciones (GET /api/notifications)
  });
  $('#btn-account').addEventListener('click', () => {
    // TODO: abrir menú de cuenta (perfil, ajustes, cerrar sesión)
  });
}

/* ==========================================================================
   Inicio
   ========================================================================== */

async function init() {
  state.city = readStoredCity() || CONFIG.DEFAULT_CITY;
  bindEvents();

  const [me, cities, categories] = await Promise.all([
    Api.getMe(),
    Api.getCities(),
    Api.getCategories(),
  ]);

  // Si el usuario no eligió una ciudad antes, usa la de su perfil
  if (!readStoredCity() && me && me.city) state.city = me.city;

  renderUser(me);
  renderCities(cities);
  renderCategories(categories);
  loadSpecialists();
}

document.addEventListener('DOMContentLoaded', init);