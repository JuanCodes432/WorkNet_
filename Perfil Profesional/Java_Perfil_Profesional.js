
const CONFIG = {
  API_BASE_URL: '/api',
  REQUEST_TIMEOUT_MS: 6000,
  DEFAULT_CITY: 'Popayán, Cauca',
  CITY_STORAGE_KEY: 'worknet:city',
  // Páginas a las que navega el front (cámbialas por tus rutas reales)
  PAGES: {
    home: 'Pagina_Principal.html',
    messages: 'mensajes.html',
    receipt: 'generar-recibo.html',
    editProfile: 'editar-perfil.html',
    visits: 'historial-visitas.html',
  },
};

/* Datos de ejemplo: se usan solo si el backend no responde */
const FALLBACK = {
  profile: {
    name: 'Pepito perez',
    profession: 'Ingeniero de Software',
    city: 'Popayán, Cauca',
    university: 'Universidad del Cauca',
    photoUrl: '',
    coverEyebrow: 'TECNOLOGÍA QUE CONECTA',
    coverTitle: 'Ideas que se convierten en soluciones.',
    about: [
      'Soy Pepito, Ingeniero de Software de la Universidad del Cauca, en Popayán. Mi trabajo se centra en convertir ideas y necesidades en soluciones de software.',
      'Cuéntame sobre tu proyecto para conversar acerca de lo que necesitas y definir juntos el siguiente paso.',
    ],
    interests: ['Ingeniería de software', 'Tecnología', 'Proyectos digitales'],
    education: [
      {
        program: 'Ingeniería de Software',
        institution: 'Universidad del Cauca',
        place: 'Popayán, Cauca',
      },
    ],
    experience: [],
    activity: [],
    punctuality: { onTime: 39, total: 40 },
    hasUnreadMessages: true,
    shareUrl: '',
  },
  cities: [
    { id: 'popayan', name: 'Popayán, Cauca' },
    { id: 'cali', name: 'Cali, Valle del Cauca' },
    { id: 'bogota', name: 'Bogotá, D.C.' },
    { id: 'medellin', name: 'Medellín, Antioquia' },
  ],
};

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

/* "Popayán, Cauca" → "Popayán · Cauca" (formato del menú lateral) */
function placeForSidebar(city) {
  return String(city ?? '').replace(/\s*,\s*/, ' · ');
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
  getProfile: () => withFallback(() => api('/me/profile'), FALLBACK.profile),
  getCities: () => withFallback(() => api('/cities'), FALLBACK.cities),
};

/* ==========================================================================
   Render
   ========================================================================== */

const state = {
  city: CONFIG.DEFAULT_CITY,
  profile: FALLBACK.profile,
};

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value ?? '';
}

/* Pone la foto si existe; si no, deja el ícono de persona del diseño */
function setAvatar(selector, photoUrl, alt) {
  const container = $(selector);
  const url = safeUrl(photoUrl);
  if (!container || !url) return;

  const img = document.createElement('img');
  img.src = url;
  img.alt = alt;
  img.addEventListener('error', () => img.remove());
  container.querySelector('svg')?.setAttribute('hidden', '');
  container.appendChild(img);
  img.addEventListener('error', () => container.querySelector('svg')?.removeAttribute('hidden'));
}

function renderProfile(profile) {
  const p = { ...FALLBACK.profile, ...profile };
  state.profile = p;

  document.title = `${p.name} · Perfil profesional · Worknet`;

  // Menú lateral
  setText('#side-name', p.name);
  setText('#side-role', p.profession);
  setText('#side-place', placeForSidebar(p.city));
  setText('#side-uni', p.university);
  $('#unread-dot').classList.toggle('is-visible', Boolean(p.hasUnreadMessages));
  setAvatar('#side-avatar', p.photoUrl, '');

  // Portada e identidad
  setText('#cover-eyebrow', p.coverEyebrow);
  setText('#cover-title', p.coverTitle);
  setText('#profile-name', p.name);
  setText('#profile-role', p.profession);
  setText('#profile-city', p.city);
  setText('#profile-university', p.university);
  setAvatar('#profile-avatar', p.photoUrl, `Foto de ${p.name}`);

  // Acerca de mí
  const about = Array.isArray(p.about) ? p.about : [String(p.about || '')];
  $('#about-text').innerHTML = about
    .filter(Boolean)
    .map((paragraph) => `<p>${esc(paragraph)}</p>`)
    .join('');

  // Áreas de interés
  $('#interests').innerHTML = (p.interests || [])
    .map((item) => `<li>${esc(item)}</li>`)
    .join('');

  // Formación académica
  $('#education').innerHTML = (p.education || [])
    .map((e) => `
      <li class="study">
        <span class="study__icon">${icon('graduation-cap', 26)}</span>
        <div class="study__text">
          <p class="study__program">${esc(e.program)}</p>
          <p class="study__school">${esc(e.institution)}</p>
          <p class="study__place">${esc(e.place)}</p>
        </div>
      </li>`)
    .join('');

  // Puntualidad
  const { onTime, total } = p.punctuality || {};
  setText('#punct-value', total ? `${onTime} de ${total}` : '—');

  renderExperience(p.experience);
  renderActivity(p.activity);
}

function renderExperience(items) {
  const box = $('#experience-list');
  if (!Array.isArray(items) || items.length === 0) return;
  box.classList.remove('card--empty');
  box.innerHTML = `
    <h2>Experiencia</h2>
    <ul class="studies">
      ${items.map((x) => `
        <li class="study">
          <span class="study__icon">${icon('code-xml', 26)}</span>
          <div class="study__text">
            <p class="study__program">${esc(x.role)}</p>
            <p class="study__school">${esc(x.company)}${x.period ? ` · ${esc(x.period)}` : ''}</p>
            ${x.description ? `<p class="study__place">${esc(x.description)}</p>` : ''}
          </div>
        </li>`).join('')}
    </ul>`;
}

function renderActivity(items) {
  const box = $('#activity-list');
  if (!Array.isArray(items) || items.length === 0) return;
  box.classList.remove('card--empty');
  box.innerHTML = `
    <h2>Actividad reciente</h2>
    <ul class="studies">
      ${items.map((x) => `
        <li class="study">
          <span class="study__icon">${icon('calendar-check', 26)}</span>
          <div class="study__text">
            <p class="study__program">${esc(x.title)}</p>
            ${x.date ? `<p class="study__school">${esc(x.date)}</p>` : ''}
            ${x.description ? `<p class="study__place">${esc(x.description)}</p>` : ''}
          </div>
        </li>`).join('')}
    </ul>`;
}

function renderCities(cities) {
  const list = Array.isArray(cities) && cities.length ? cities : FALLBACK.cities;
  const names = list.map((c) => c.name);
  if (!names.includes(state.city)) names.unshift(state.city);

  const select = $('#city-header');
  select.innerHTML = names
    .map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
    .join('');
  select.value = state.city;
}

/* Enlaces de navegación: se toman de CONFIG.PAGES (un solo lugar para cambiarlos) */
function applyPageLinks() {
  $$('[data-page]').forEach((el) => {
    const target = CONFIG.PAGES[el.dataset.page];
    if (target) el.setAttribute('href', target);
  });
}

/* ==========================================================================
   Interacciones
   ========================================================================== */

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

async function shareProfile() {
  const { name, profession, shareUrl } = state.profile;
  const url = shareUrl || window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: `${name} · Worknet`, text: profession, url });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return; // la persona canceló
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast('Enlace del perfil copiado');
  } catch {
    showToast('No se pudo copiar el enlace');
  }
}

function selectTab(name, { focus = false } = {}) {
  $$('[role="tab"]').forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  $$('[role="tabpanel"]').forEach((panel) => {
    panel.hidden = panel.id !== `panel-${name}`;
  });
}

function bindEvents() {
  /* Pestañas (clic y flechas del teclado) */
  const tabs = $$('[role="tab"]');
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (event.key === 'Home') { event.preventDefault(); selectTab(tabs[0].dataset.tab, { focus: true }); }
      else if (event.key === 'End') { event.preventDefault(); selectTab(tabs.at(-1).dataset.tab, { focus: true }); }
      else if (keys[event.key]) {
        event.preventDefault();
        const next = tabs[(index + keys[event.key] + tabs.length) % tabs.length];
        selectTab(next.dataset.tab, { focus: true });
      }
    });
  });

  $('#btn-share').addEventListener('click', shareProfile);

  /* Cambio de ciudad de la barra superior */
  $('#city-header').addEventListener('change', (event) => {
    state.city = event.target.value;
    storeCity(state.city);
  });

  /* Si el logo no carga, se muestra el texto "worknet" como respaldo */
  const useLogoFallback = (img) => {
    const logo = img.closest('.logo');
    if (!logo) return;
    img.classList.add('is-broken');
    logo.classList.add('is-fallback');
  };
  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) useLogoFallback(event.target);
  }, true);
  // El error puede haber ocurrido antes de que cargara este script
  $$('.logo img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) useLogoFallback(img);
  });

  /* Botones de la barra superior: listos para conectar */
  $('#btn-notifications').addEventListener('click', () => {
    // TODO: abrir panel de notificaciones (GET /api/notifications)
  });
  $('#btn-account').addEventListener('click', () => {
    // TODO: abrir menú de cuenta (ajustes, cerrar sesión)
  });
}

/* ==========================================================================
   Inicio
   ========================================================================== */

async function init() {
  state.city = readStoredCity() || CONFIG.DEFAULT_CITY;
  applyPageLinks();
  bindEvents();

  const [profile, cities] = await Promise.all([Api.getProfile(), Api.getCities()]);

  // Si la persona no eligió ciudad antes, usa la de su perfil
  if (!readStoredCity() && profile && profile.city) state.city = profile.city;

  renderCities(cities);
  renderProfile(profile);
  document.body.classList.remove('is-loading');
}

document.addEventListener('DOMContentLoaded', init);