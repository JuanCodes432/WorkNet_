
const CONFIG = {
  DEFAULT_CITY: 'Popayán, Cauca',
  CITY_STORAGE_KEY: 'worknet:city',
  SESSION_EXPIRY_KEY: 'worknet:session-expires',
  ACCOUNT_DELETED_PAGE: '/Cuenta%20Eliminada/cuenta_eliminada.html',
  PAGES: {
    home: '/',
    messages: '/resenas',
    receipt: '/contrato',
    editProfile: '/Perfil%20Profesional/Perfil_Profesional.html',
    visits: '/historial-contratos',
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

function hasSessionHint() {
  try {
    const expiresAt = Number(localStorage.getItem(CONFIG.SESSION_EXPIRY_KEY));
    if (expiresAt > Date.now()) return true;
    localStorage.removeItem(CONFIG.SESSION_EXPIRY_KEY);
  } catch {
    return false;
  }
  return false;
}

function saveSessionHint() {
  try {
    localStorage.setItem(
      CONFIG.SESSION_EXPIRY_KEY,
      String(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
  } catch {
    // The signed cookie remains the source of truth for the API.
  }
}

function clearSessionHint() {
  try { localStorage.removeItem(CONFIG.SESSION_EXPIRY_KEY); } catch { /* sin almacenamiento */ }
}

/* "Popayán, Cauca" → "Popayán · Cauca" (formato del menú lateral) */
function placeForSidebar(city) {
  return String(city ?? '').replace(/\s*,\s*/, ' · ');
}

const Api = window.WorkNetApi;

/* ==========================================================================
   Render
   ========================================================================== */

const state = {
  city: CONFIG.DEFAULT_CITY,
  profile: FALLBACK.profile,
  authenticated: false,
  authMode: 'login',
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

function setAuthMode(mode) {
  state.authMode = mode;
  const creating = mode === 'create';
  $('#registration-fields').hidden = !creating;
  ['#auth-name', '#auth-profession', '#auth-city', '#auth-university'].forEach((selector) => {
    $(selector).required = creating;
  });
  $('#auth-password').autocomplete = creating ? 'new-password' : 'current-password';
  $('#btn-auth-submit').textContent = creating ? 'Crear cuenta' : 'Iniciar sesión';
  $('[data-auth-mode="login"]').classList.toggle('is-active', !creating);
  $('[data-auth-mode="create"]').classList.toggle('is-active', creating);
  $('#auth-error').hidden = true;
}

function openAccountDialog(mode = 'login') {
  const dialog = $('#account-dialog');
  setAuthMode(mode);
  dialog.classList.toggle('is-authenticated', state.authenticated);
  $('#btn-logout').hidden = !state.authenticated;
  $('#btn-auth-submit').hidden = state.authenticated;
  $('.account-form__modes').hidden = state.authenticated;
  $$('.account-form__field').forEach((field) => {
    field.hidden = state.authenticated;
  });
  if (!dialog.open) dialog.showModal();
}

function closeAccountDialog() {
  $('#account-dialog').close();
}

async function submitAccountForm(event) {
  event.preventDefault();
  const submitButton = $('#btn-auth-submit');
  const errorMessage = $('#auth-error');
  submitButton.disabled = true;
  errorMessage.hidden = true;

  try {
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    const profile = state.authMode === 'create'
      ? {
          ...FALLBACK.profile,
          name: $('#auth-name').value.trim(),
          profession: $('#auth-profession').value.trim(),
          city: $('#auth-city').value.trim(),
          university: $('#auth-university').value.trim(),
        }
      : await Api.login(email, password);
    const authenticatedProfile = state.authMode === 'create'
      ? await Api.createAccount(email, password, profile)
      : profile;

    saveSessionHint();
    state.authenticated = true;
    renderProfile(authenticatedProfile);
    closeAccountDialog();
    showToast(state.authMode === 'create' ? 'Cuenta creada' : 'Sesión iniciada');
  } catch (error) {
    console.error('[Worknet] No se pudo acceder a la cuenta:', error);
    errorMessage.textContent = error.message.startsWith('HTTP ')
      ? error.message === 'HTTP 409'
        ? 'Ya existe una cuenta con ese correo electrónico.'
        : error.message === 'HTTP 401'
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo completar la solicitud.'
      : 'No se pudo conectar con el servidor. Comprueba que esté iniciado.';
    errorMessage.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
}

async function logout() {
  const button = $('#btn-logout');
  button.disabled = true;
  try {
    await Api.logout();
    clearSessionHint();
    state.authenticated = false;
    renderProfile(FALLBACK.profile);
    closeAccountDialog();
    showToast('Sesión cerrada');
  } catch (error) {
    console.error('[Worknet] No se pudo cerrar la sesión:', error);
    $('#auth-error').textContent = 'No se pudo cerrar la sesión. Inténtalo de nuevo.';
    $('#auth-error').hidden = false;
  } finally {
    button.disabled = false;
  }
}

function addProfileField(container, key, label, value, multiline = false) {
  const field = document.createElement(multiline ? 'textarea' : 'input');
  field.className = `profile-field${multiline ? ' profile-field--multiline' : ''}`;
  field.setAttribute('aria-label', label);
  field.dataset.profileField = key;
  field.value = value ?? '';
  container.replaceChildren(field);
}

function setProfileEditing(editing) {
  $('#btn-edit-profile').hidden = editing;
  $('#btn-cancel-edit').hidden = !editing;
  $('#btn-save-profile').hidden = !editing;
  if (!editing) {
    renderProfile(state.profile);
    return;
  }

  const fields = [
    ['#cover-eyebrow', 'coverEyebrow', 'Texto superior de portada'],
    ['#cover-title', 'coverTitle', 'Título de portada'],
    ['#profile-name', 'name', 'Nombre'],
    ['#profile-role', 'profession', 'Profesión'],
    ['#profile-city', 'city', 'Ciudad'],
    ['#profile-university', 'university', 'Universidad'],
  ];
  fields.forEach(([selector, key, label]) => {
    const element = $(selector);
    addProfileField(element, key, label, state.profile[key]);
  });

  addProfileField(
    $('#about-text'),
    'about',
    'Acerca de mí',
    (Array.isArray(state.profile.about) ? state.profile.about : [state.profile.about]).join('\n\n'),
    true,
  );
  addProfileField(
    $('#interests'),
    'interests',
    'Áreas de interés (una por línea)',
    (state.profile.interests || []).join('\n'),
    true,
  );

  $('#education').querySelectorAll('.study').forEach((study, index) => {
    const education = state.profile.education[index] || {};
    const text = study.querySelector('.study__text');
    text.replaceChildren();
    [
      ['program', 'Programa'],
      ['institution', 'Institución'],
      ['place', 'Lugar'],
    ].forEach(([key, label]) => {
      const field = document.createElement('input');
      field.className = 'profile-field';
      field.setAttribute('aria-label', `${label} de formación ${index + 1}`);
      field.dataset.profileField = `education.${index}.${key}`;
      field.value = education[key] || '';
      text.appendChild(field);
    });
  });
}

function profileFromEditor() {
  const value = (key) => $(`[data-profile-field="${key}"]`).value.trim();
  const name = value('name');
  const profession = value('profession');
  const city = value('city');
  const university = value('university');
  if (!name || !profession || !city || !university) {
    throw new Error('Completa nombre, profesión, ciudad y universidad.');
  }

  return {
    ...state.profile,
    coverEyebrow: value('coverEyebrow'),
    coverTitle: value('coverTitle'),
    name,
    profession,
    city,
    university,
    about: value('about').split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
    interests: value('interests').split('\n').map((interest) => interest.trim()).filter(Boolean),
    education: (state.profile.education || []).map((education, index) => ({
      ...education,
      program: value(`education.${index}.program`),
      institution: value(`education.${index}.institution`),
      place: value(`education.${index}.place`),
    })),
  };
}

async function saveProfile() {
  const button = $('#btn-save-profile');
  button.disabled = true;
  try {
    const profile = profileFromEditor();
    const savedProfile = await Api.saveProfile(profile);
    renderProfile(savedProfile || profile);
    setProfileEditing(false);
    showToast('Perfil actualizado');
  } catch (error) {
    console.error('[Worknet] No se pudo guardar el perfil:', error);
    showToast(error.message === 'Completa nombre, profesión, ciudad y universidad.'
      ? error.message
      : 'No se pudo guardar el perfil. Inténtalo de nuevo.');
  } finally {
    button.disabled = false;
  }
}

async function deleteAccount() {
  if (!window.confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción es permanente y no se puede deshacer.')) return;

  const button = $('#btn-delete-account');
  button.disabled = true;
  try {
    await Api.deleteAccount();
    clearSessionHint();
    window.location.assign(CONFIG.ACCOUNT_DELETED_PAGE);
  } catch (error) {
    console.error('[Worknet] No se pudo eliminar la cuenta:', error);
    showToast('No se pudo eliminar la cuenta. Inténtalo de nuevo.');
  } finally {
    button.disabled = false;
  }
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
  $('#btn-edit-profile').addEventListener('click', () => {
    if (state.authenticated) setProfileEditing(true);
    else openAccountDialog('login');
  });
  $('#btn-cancel-edit').addEventListener('click', () => setProfileEditing(false));
  $('#btn-save-profile').addEventListener('click', saveProfile);
  $('#btn-delete-account').addEventListener('click', () => {
    if (state.authenticated) deleteAccount();
    else openAccountDialog('login');
  });
  $('#btn-account').addEventListener('click', () => openAccountDialog());
  $('#btn-close-account').addEventListener('click', closeAccountDialog);
  $('#account-form').addEventListener('submit', submitAccountForm);
  $$('[data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
  });
  $('#btn-logout').addEventListener('click', logout);
  $('#account-dialog').addEventListener('click', (event) => {
    if (event.target === $('#account-dialog')) closeAccountDialog();
  });

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
}

/* ==========================================================================
   Inicio
   ========================================================================== */

async function init() {
  state.city = readStoredCity() || CONFIG.DEFAULT_CITY;
  applyPageLinks();
  bindEvents();

  const [profileResult, citiesResult] = await Promise.all([
    hasSessionHint()
      ? Api.getProfile()
        .then((profile) => ({ profile }))
        .catch((error) => ({ error }))
      : Promise.resolve({ error: new Error('HTTP 401') }),
    Api.getCities()
      .then((cities) => ({ cities }))
      .catch((error) => ({ error })),
  ]);

  const cities = citiesResult.cities || FALLBACK.cities;
  if (citiesResult.error) {
    console.error('[Worknet] No se pudieron cargar las ciudades:', citiesResult.error);
  }

  // Si la persona no eligió ciudad antes, usa la de su perfil
  renderCities(cities);
  if (profileResult.profile) {
    state.authenticated = true;
    if (!readStoredCity() && profileResult.profile.city) state.city = profileResult.profile.city;
    renderCities(cities);
    renderProfile(profileResult.profile);
  } else {
    state.authenticated = false;
    if (profileResult.error.message === 'HTTP 401') clearSessionHint();
    renderProfile(FALLBACK.profile);
    if (profileResult.error.message === 'HTTP 401') {
      openAccountDialog('login');
    } else {
      console.error('[Worknet] No se pudo cargar el perfil:', profileResult.error);
      showToast('No se pudo conectar. Inicia el servidor con python py\\api.py y abre http://127.0.0.1:5000/.');
    }
  }
  document.body.classList.remove('is-loading');
}

document.addEventListener('DOMContentLoaded', init);