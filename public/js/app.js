/* APP · Derecho comparado — SPA sin dependencias (hash routing). */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const view = $('#view');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dec = (n) => (n == null ? '—' : Number(n).toFixed(1).replace('.', ','));
  const pad = (n) => String(n).padStart(2, '0');
  // Clase de fondo para un color de la paleta; los fondos oscuros (marino, azul) llevan texto claro.
  const bgClass = (color) => `bg-${color}${color === 'ink' || color === 'blue' ? ' on-dark' : ''}`;
  const fmtDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } },
  };

  const state = { user: null, verified: new Set(), current: null, evalConfig: null };

  // ---------------- API ----------------
  async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.startsWith('/api/auth/')) { state.user = null; go('/ingresar'); }
    if (!res.ok) throw new Error(data.error || 'Ocurrió un error. Intenta de nuevo.');
    return data;
  }

  let toastTimer;
  function toast(msg, isError = false) {
    const t = $('#toast');
    t.textContent = msg; t.classList.toggle('error', isError); t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
  }

  const go = (path) => { if (location.hash !== '#' + path) location.hash = path; else route(); };

  // ---------------- Ilustraciones (trazo a mano) ----------------
  const ICONS = {
    doc: '<svg viewBox="0 0 120 150" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8 L84 6 L104 28 L102 142 L16 144 Z"/><path d="M84 6 L83 29 L104 28"/><path d="M32 52 C52 50 72 53 88 51 M32 70 C50 72 70 68 88 70 M32 88 C48 86 66 90 88 87 M32 106 C44 108 56 104 66 106"/><path d="M58 118 c10 -14 26 -10 28 2 c2 12 -18 18 -30 8"/></svg>',
    scales: '<svg viewBox="0 0 150 150" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M75 16 L76 132 M48 134 C62 131 88 131 104 135"/><path d="M22 40 C50 34 100 34 128 41"/><path d="M22 40 L6 84 M22 40 L40 84 M4 84 C12 100 34 100 42 84 Z"/><path d="M128 41 L110 86 M128 41 L146 86 M108 86 C116 102 138 102 146 86 Z"/><circle cx="75" cy="16" r="6"/></svg>',
    steps: '<svg viewBox="0 0 160 150" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 132 L50 131 L50 96 L92 97 L92 60 L134 58 L134 22 L154 22"/><path d="M20 118 l14 -1 M62 84 l14 0 M104 46 l14 -1"/><path d="M140 12 C146 4 156 8 152 16 C148 24 138 22 140 12 Z"/><path d="M8 144 C50 140 110 146 154 142"/></svg>',
    wheel: '<svg viewBox="0 0 150 150" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M75 12 C112 10 140 40 139 76 C138 114 108 140 73 138 C36 136 10 108 12 73 C14 38 42 13 75 12 Z"/><path d="M75 14 L74 138 M13 74 L139 76 M31 30 L118 120 M119 31 L30 118"/><circle cx="75" cy="75" r="12"/><path d="M68 2 L82 2 L75 16 Z"/></svg>',
    star: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z"/></svg>',
    co: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 90 C30 60 50 40 70 34 C84 30 96 36 100 48"/><path d="M10 104 C40 98 80 100 112 104"/><path d="M40 80 l0 -26 l14 -8 l14 8 l0 26"/></svg>',
    fr: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M60 8 L60 20 M46 108 L58 20 L62 20 L74 108 M50 76 L70 76 M53 50 L67 50 M36 108 L84 108"/></svg>',
    us: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M8 80 C30 70 50 64 60 64 C70 64 90 70 112 80"/><path d="M20 76 L20 40 M100 76 L100 40 M20 40 C40 60 80 60 100 40"/><path d="M4 90 C40 84 80 84 116 90"/></svg>',
  };
  const scribbleEllipse = '<svg viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M12 34 C 8 14, 70 4, 118 6 C 170 8, 196 20, 190 36 C 184 52, 110 58, 64 54 C 22 50, 4 40, 20 22 C 30 12, 60 8, 80 8"/></svg>';
  const scribble = (text) => `<span class="scribble">${text}${scribbleEllipse}</span>`;

  // ---------------- Menú ----------------
  function navItems() {
    const items = [
      { n: '01', path: '/inicio', title: 'Inicio', text: 'Contexto general: qué son las APP, para qué sirven y cómo se comparan en los tres países.' },
      { n: '02', path: '/normativa', title: 'Normativa', text: 'Leyes, códigos y jurisprudencia. Entra a cada norma, revisa sus artículos y verifícala en la fuente oficial.' },
      { n: '03', path: '/etapas', title: 'Las 3 etapas', text: 'Precontractual, contractual y postcontractual en Colombia, Francia y Estados Unidos.' },
      { n: '04', path: '/evaluacion', title: 'Evaluación', text: 'Gira la ruleta: 5, 8 o 10 preguntas… o el bonus. Responde y recibe tu nota.' },
    ];
    if (state.user?.role === 'admin') items.push({ n: '05', path: '/admin', title: 'Panel admin', text: 'Quién ingresó, cuándo, y qué nota obtuvo cada estudiante.' });
    return items;
  }

  function renderChrome() {
    const logged = !!state.user;
    $('#topbar').hidden = !logged;
    if (!logged) { closeMenu(); return; }
    $('#topbarUser').textContent = state.user.name;
    const path = location.hash.slice(1).split('/').slice(0, 2).join('/');
    const [home, ...rest] = navItems();
    $('#menuGrid').innerHTML = `
      <div class="menu-card big${path === home.path ? ' current' : ''}" style="--i:0">
        <a href="#${home.path}" style="text-decoration:none"><span class="num">(${home.n})</span></a>
        <a href="#${home.path}" class="display" style="text-decoration:none">${home.title}</a>
        <p>${home.text}</p>
        <p class="menu-user">Sesión iniciada como <b>${esc(state.user.name)}</b></p>
        <div class="menu-actions">
          <a href="#/evaluacion" class="pill pill-red">Ir a la evaluación</a>
          <button class="pill pill-ink" id="logoutBtn">Cerrar sesión</button>
        </div>
      </div>
      ${rest.map((i, k) => `
        <a class="menu-card${path === i.path ? ' current' : ''}" href="#${i.path}" style="--i:${k + 1}">
          <span class="num">(${i.n})</span><span class="display">${i.title}</span><p>${i.text}</p>
        </a>`).join('')}`;
    $('#logoutBtn').addEventListener('click', async () => {
      await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
      state.user = null; state.verified = new Set(); closeMenu(); go('/ingresar');
    });
  }

  function openMenu() { document.body.classList.add('menu-open'); $('#menu').setAttribute('aria-hidden', 'false'); $('#menuBtn').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { document.body.classList.remove('menu-open'); $('#menu').setAttribute('aria-hidden', 'true'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
  $('#menuBtn').addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  $('#menu').addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

  // =========================================================
  // EFECTOS (inspirados en la web de referencia)
  // =========================================================
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // --- Scroll suave con inercia (equivalente a Lenis, lerp 0.1) ---
  const smooth = { cur: 0, target: 0, last: 0, active: false, enabled: finePointer && !reduceMotion };
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  // ¿Hay un contenedor bajo el puntero que todavía puede desplazarse en vertical? Entonces la rueda es suya.
  // (Las tablas con overflow-x no cuentan: solo se desplazan en horizontal.)
  function innerScrollsY(el, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
    }
    return false;
  }
  window.addEventListener('wheel', (e) => {
    if (!smooth.enabled || e.ctrlKey || e.shiftKey || document.body.classList.contains('menu-open') || document.body.classList.contains('drawer-open')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (e.target.closest('[data-native-scroll]') || innerScrollsY(e.target, e.deltaY)) return;
    e.preventDefault();
    if (!smooth.active) { smooth.cur = scrollY; smooth.target = scrollY; smooth.last = scrollY; }
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    smooth.target = clamp(smooth.target + d, 0, maxScroll());
    smooth.active = true;
  }, { passive: false });
  function scrollToY(y, instant = false) {
    y = clamp(y, 0, maxScroll());
    if (instant || !smooth.enabled) { smooth.active = false; window.scrollTo(0, y); return; }
    if (!smooth.active) { smooth.cur = scrollY; smooth.last = scrollY; }
    smooth.target = y; smooth.active = true;
  }
  const scrollToEl = (el) => el && scrollToY(el.getBoundingClientRect().top + scrollY);

  // --- Cursor: punto que crece sobre enlaces y muestra etiquetas ---
  const cursor = { el: $('#cursor'), label: $('#cursorLabel'), x: -100, y: -100, cx: -100, cy: -100 };
  if (finePointer) {
    addEventListener('mousemove', (e) => { cursor.x = e.clientX; cursor.y = e.clientY; cursor.el.classList.remove('hidden'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.el.classList.add('hidden'));
    document.addEventListener('mouseover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, [role=button], input, label');
      cursor.el.classList.toggle('has-label', !!lab);
      cursor.el.classList.toggle('is-larger', !lab && !!link);
      if (lab) cursor.label.textContent = lab.dataset.cursor;
    });
  }

  // --- Títulos que aparecen palabra por palabra ---
  function splitWords(root) {
    $$('.wsplit', root).forEach((el) => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = '1';
      let w = 0;
      [...el.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement('span'); s.className = 'word'; s.style.setProperty('--w', w++); s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { n.classList.add('word'); n.style.setProperty('--w', w++); }
      });
    });
  }

  // --- Imágenes de capítulo que se turnan al pasar el mouse ---
  function chapterCycles(root) {
    $$('.chapter-imgs', root).forEach((wrap) => {
      const imgs = $$('svg', wrap); let k = 0; let timer;
      imgs[0]?.classList.add('up');
      const card = wrap.closest('.chapter');
      card.addEventListener('mouseenter', () => {
        clearInterval(timer);
        timer = setInterval(() => { imgs[k].classList.remove('up'); k = (k + 1) % imgs.length; imgs[k].classList.add('up'); }, 260);
      });
      card.addEventListener('mouseleave', () => { clearInterval(timer); imgs.forEach((i) => i.classList.remove('up')); k = 0; imgs[0].classList.add('up'); });
    });
  }

  // --- Secciones sticky con desplazamiento horizontal ---
  function layoutHScroll() {
    $$('.hscroll', view).forEach((sec) => {
      const track = $('.hs-track', sec);
      if (innerWidth >= 992) {
        sec._dist = Math.max(0, track.scrollWidth - innerWidth);
        sec.style.height = sec._dist + innerHeight + 'px';
      } else { sec._dist = 0; sec.style.height = ''; track.style.transform = ''; }
    });
  }
  addEventListener('resize', layoutHScroll);

  // --- Riel inferior de navegación (como la línea de tiempo de años) ---
  let railIo;
  function setupRail() {
    railIo?.disconnect();
    queueTones();
    const secs = $$('[data-rail-label]', view);
    if (!secs.length) return;
    const rail = document.createElement('nav');
    rail.className = 'rail'; rail.setAttribute('aria-label', 'Secciones');
    rail.innerHTML = secs.map((s, i) => `<a href="#${s.id}" data-rail-i="${i}">${esc(s.dataset.railLabel)}</a>`).join('');
    view.appendChild(rail);
    $$('a', rail).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToEl(secs[+a.dataset.railI]); }));
    railIo = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) $$('a', rail).forEach((a) => a.classList.toggle('active', secs[+a.dataset.railI] === e.target));
    }), { rootMargin: '-50% 0px -50% 0px' });
    secs.forEach((s) => railIo.observe(s));
  }

  // --- Tono del encabezado y del riel según el fondo que tienen debajo ---
  // Sustituye a mix-blend-mode: difference, que sobre el rojo producía un cian ilegible.
  const TONE_SKIP = '.topbar, .rail, .cursor, .curtain, .toast';
  const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const L_INK = lum(11, 27, 54); const L_PAPER = lum(248, 246, 241);
  function bgAt(x, y) {
    const hit = document.elementsFromPoint(x, y).find((el) => !el.closest(TONE_SKIP));
    for (let e = hit; e; e = e.parentElement) {
      const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
      if (m && (m[3] === undefined || +m[3] >= 0.5)) return m.slice(0, 3).map(Number);
    }
    return [248, 246, 241];
  }
  // true si sobre ese fondo contrasta más el texto claro (papel) que el oscuro (marino).
  const wantsLight = ([r, g, b]) => { const l = lum(r, g, b); return (L_PAPER + 0.05) / (l + 0.05) > (l + 0.05) / (L_INK + 0.05); };
  let toneQueued = false;
  function updateTones() {
    toneQueued = false;
    const top = $('#topbar');
    if (!top.hidden) {
      const y = 32; const dx = Math.min(90, innerWidth * 0.2);
      top.dataset.left = wantsLight(bgAt(dx, y)) ? 'light' : 'dark';
      top.dataset.right = wantsLight(bgAt(innerWidth - dx, y)) ? 'light' : 'dark';
      top.style.setProperty('--topbar-bg', `rgb(${bgAt(innerWidth / 2, y).join(',')})`);
    }
    $$('.rail a', view).forEach((a) => {
      const r = a.getBoundingClientRect();
      if (r.width) a.classList.toggle('tone-light', wantsLight(bgAt(r.left + r.width / 2, r.top + r.height / 2)));
    });
  }
  function queueTones() { if (!toneQueued) { toneQueued = true; requestAnimationFrame(updateTones); } }
  addEventListener('scroll', queueTones, { passive: true });
  addEventListener('resize', queueTones);
  document.addEventListener('transitionend', queueTones);

  // --- Bucle de animación: scroll suave, cursor, horizontal y parallax ---
  function frame() {
    if (smooth.active) {
      // Si algo más movió la página (teclado, barra de desplazamiento, foco), se le cede el control
      // en vez de devolverla a la posición de la inercia.
      if (Math.abs(scrollY - smooth.last) > 3) smooth.active = false;
      else {
        smooth.target = clamp(smooth.target, 0, maxScroll());
        smooth.cur += (smooth.target - smooth.cur) * 0.1;
        if (Math.abs(smooth.target - smooth.cur) < 0.5) { smooth.cur = smooth.target; smooth.active = false; }
        window.scrollTo(0, smooth.cur);
        smooth.last = scrollY;
      }
    }
    if (finePointer) {
      cursor.cx += (cursor.x - cursor.cx) * 0.22; cursor.cy += (cursor.y - cursor.cy) * 0.22;
      cursor.el.style.transform = `translate3d(${cursor.cx}px, ${cursor.cy}px, 0)`;
    }
    $$('.hscroll', view).forEach((sec) => {
      if (!sec._dist) return;
      const p = clamp(-sec.getBoundingClientRect().top / (sec.offsetHeight - innerHeight), 0, 1);
      $('.hs-track', sec).style.transform = `translate3d(${(-p * sec._dist).toFixed(1)}px,0,0)`;
    });
    if (!reduceMotion) {
      $$('[data-speed]', view).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        el.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * +el.dataset.speed).toFixed(1)}px`;
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // --- Cortina entre secciones ---
  const curtainEl = $('#curtain');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function curtainIn(label) {
    if (reduceMotion) return;
    $('#curtainLabel').textContent = label;
    curtainEl.className = 'curtain';
    void curtainEl.offsetWidth;
    curtainEl.classList.add('in');
    await wait(480);
  }
  function curtainOut() {
    if (reduceMotion || !curtainEl.classList.contains('in')) return;
    curtainEl.classList.replace('in', 'out');
    setTimeout(() => { curtainEl.className = 'curtain'; }, 650);
  }

  // Marca "#" dibujada a mano y flecha
  const HASH_MARK = '<svg class="hash-mark mark-draw" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 C16 24 15 40 13 56"/><path d="M38 4 C36 22 35 38 34 54"/><path d="M4 20 C22 19 40 18 56 17"/><path d="M3 38 C22 37 40 36 55 35"/></svg>';
  const ARROW_MARK = '<svg class="arrow-mark mark-draw" viewBox="0 0 120 60" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 44 C30 20 70 12 108 22"/><path d="M92 8 L110 22 L90 34"/></svg>';

  // ---------------- Observador de entradas ----------------
  let io;
  function observe() {
    splitWords(view);
    chapterCycles(view);
    layoutHScroll();
    setupRail();
    io?.disconnect();
    io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$('.reveal, .scribble, .wsplit, .mark-draw', view).forEach((el) => io.observe(el));
  }

  // =========================================================
  // AUTENTICACIÓN
  // =========================================================
  function renderAuth(mode) {
    view.innerHTML = `
    <section class="auth">
      <div class="auth-hero bg-paper">
        <div>
          <a class="brand" href="#/ingresar"><b>APP</b> • DERECHO COMPARADO</a>
          <h1 class="display d-xl auth-title wsplit">Las asociaciones público-privadas</h1>
          <p class="auth-sub">Etapas precontractual, contractual y postcontractual. Un estudio de derecho comparado entre Colombia, Francia y Estados Unidos.</p>
        </div>
        <div class="country-strip">
          ${Object.entries(COUNTRIES).map(([k, c]) => `
            <div class="${bgClass(c.color)}">
              <span class="mono">${esc(c.tradition)}</span>
              <span class="display d-m">${esc(c.name)}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="auth-panel on-dark">
        <div class="tabs" role="tablist">
          <button class="tab${mode === 'login' ? ' active' : ''}" data-mode="login" role="tab">(01) Iniciar sesión</button>
          <button class="tab${mode === 'register' ? ' active' : ''}" data-mode="register" role="tab">(02) Registrarse</button>
        </div>
        <h2 class="display d-l" style="margin-bottom:30px">${mode === 'login' ? 'Bienvenido<br>de nuevo' : 'Crea tu<br>registro'}</h2>
        <form id="authForm" novalidate>
          <label class="field"><span>${mode === 'login' ? 'Tu nombre' : 'Nombre completo'}</span>
            <input name="name" autocomplete="name" required minlength="3" maxlength="80" placeholder="Ej. María Fernanda López"></label>
          <label class="field"><span>Contraseña</span>
            <input name="password" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required minlength="4"></label>
          ${mode === 'register' ? `<label class="field"><span>Confirmar contraseña</span><input name="confirm" type="password" autocomplete="new-password" required minlength="4"></label>` : ''}
          <p class="form-error" id="authError"></p>
          <button class="pill pill-red pill-lg arrow" type="submit">${mode === 'login' ? 'Ingresar' : 'Registrarme'}</button>
        </form>
        <p class="form-note">${mode === 'login' ? '¿Primera vez? Ve a <a href="#/registro">Registrarse</a> e ingresa con tu nombre.' : 'Tu nombre quedará registrado junto con tu nota de la evaluación. ¿Ya tienes cuenta? <a href="#/ingresar">Inicia sesión</a>.'}</p>
      </div>
    </section>`;

    $$('.tab', view).forEach((b) => b.addEventListener('click', () => go(b.dataset.mode === 'login' ? '/ingresar' : '/registro')));
    const form = $('#authForm');
    form.name.focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#authError');
      const name = form.name.value.trim(); const password = form.password.value;
      if (name.length < 3) return (err.textContent = 'Escribe tu nombre completo.');
      if (password.length < 4) return (err.textContent = 'La contraseña debe tener al menos 4 caracteres.');
      if (mode === 'register' && password !== form.confirm.value) return (err.textContent = 'Las contraseñas no coinciden.');
      err.textContent = '';
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      try {
        const { user } = await api(mode === 'login' ? '/api/auth/login' : '/api/auth/register', { method: 'POST', body: { name, password } });
        state.user = user;
        await loadVerified();
        toast(mode === 'login' ? `Hola de nuevo, ${user.name}.` : `¡Registro exitoso! Bienvenido, ${user.name}.`);
        go(user.role === 'admin' ? '/admin' : '/inicio');
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
    });
  }

  // =========================================================
  // INICIO / INFORMATIVA
  // =========================================================
  function renderHome() {
    const chapters = [
      { ch: 'CH.1', path: '#contexto', title: 'Contexto', icons: ['doc', 'co', 'fr', 'us'], text: 'Qué es una APP y para qué sirve.' },
      { ch: 'CH.2', path: '#/normativa', title: 'Normativa', icons: ['scales', 'doc', 'star'], text: 'Leyes, códigos y sentencias verificables.' },
      { ch: 'CH.3', path: '#/etapas', title: 'Las 3 etapas', icons: ['steps', 'doc', 'scales'], text: 'Precontractual, contractual y postcontractual.' },
      { ch: 'CH.4', path: '#/evaluacion', title: 'Evaluación', icons: ['wheel', 'star', 'wheel'], text: 'La ruleta decide tus preguntas.' },
    ];
    view.innerHTML = `
    <section class="hero bg-paper">
      <div class="hero-top">
        <h1 class="display hero-title wsplit">Las asociaciones público-privadas</h1>
        <p class="lead reveal">Un estudio de derecho comparado sobre las APP en Colombia, Francia y Estados Unidos, a través de sus tres momentos jurídicos.</p>
      </div>
      <div class="chapters">
        ${chapters.map((c) => `
          <div><div class="chapter-label">${c.ch}</div>
            <a class="chapter" href="${c.path}" ${c.path.startsWith('#/') ? '' : 'data-scroll'} data-cursor="Entrar">
              <span class="display">${c.title}</span><div class="chapter-imgs">${c.icons.map((i) => ICONS[i]).join('')}</div><p>${c.text}</p>
            </a></div>`).join('')}
      </div>
    </section>

    <section class="section bg-ink on-dark" id="contexto" data-rail-label="Contexto">
      <div class="wrap split">
        <div class="sticky"><p class="label">Definición</p><h2 class="display d-l wsplit">¿Qué es una APP?</h2></div>
        <div>
          <p class="lead-l reveal">Un contrato de ${scribble('largo plazo')} entre una entidad pública y un particular, mediante el cual este asume la provisión de un activo o servicio público, aporta total o parcialmente su financiación y soporta una parte significativa de los riesgos, a cambio de una remuneración vinculada a su desempeño.</p>
          <div class="reveal" style="margin-top:60px; display:grid; grid-template-columns:auto 1fr; gap:14px 30px;">
            <p class="label">Para qué sirve</p>
            <p class="lead">La infraestructura pública —carreteras, hospitales, colegios, transporte— exige recursos que los presupuestos estatales rara vez pueden cubrir por sí solos. La APP permite que un particular <span class="hl" style="color:var(--ink)">diseñe, financie, construya, opere y mantenga</span> la infraestructura durante un largo período.</p>
            <p class="label">Cómo se llama</p>
            <p class="lead">Colombia: <em class="serif">asociaciones público-privadas</em>. Francia: <em class="serif">concession</em> y <em class="serif">marché de partenariat</em>. Estados Unidos: <em class="serif">P3 — public-private partnerships</em>.</p>
            <p class="label">Origen</p>
            <p class="lead">El modelo moderno se consolidó con la <b>Private Finance Initiative</b> británica de 1992. Chile legisló en 1996; México y Colombia en 2012.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="hscroll" id="elementos" data-rail-label="Elementos">
      <div class="hs-sticky"><div class="hs-track">
        <div class="panel panel-title bg-blue on-dark">
          <p class="label">Común a los tres sistemas</p>
          <h2 class="display d-xl wsplit">Cuatro elementos estructurales</h2>
          <span class="hs-hint mono">Sigue bajando para recorrerlos</span>
        </div>
        ${ELEMENTS.map((el, i) => `
          <div class="panel panel-element ${['bg-paper', 'bg-yellow', 'bg-red', 'bg-ink on-dark'][i]}">
            <p class="mono" style="margin:0">(${el.n})</p>
            <span class="element-num" data-speed="-0.06">${el.n}</span>
            <h3 class="display d-l wsplit">${el.title}</h3>
            <p class="lead reveal" style="max-width:26ch">${el.text}</p>
          </div>`).join('')}
      </div></div>
    </section>

    <section class="section bg-red" id="obra" data-rail-label="¿Obra o APP?">
      <div class="wrap">
        <p class="label" style="color:var(--ink)">La diferencia clave</p>
        <h2 class="display d-xl wsplit">¿Obra pública<br>o APP?</h2>
        <div class="toggle" role="tablist">
          <button class="active" data-mode="obra">Obra pública tradicional</button>
          <button data-mode="app">Asociación público-privada</button>
        </div>
        <div class="versus" id="versus"></div>
      </div>
    </section>

    <section class="section bg-paper" id="paises" data-rail-label="Países">
      <div class="wrap">
        <p class="label">Tres tradiciones jurídicas</p>
        <h2 class="display d-xl wsplit">Tres países,<br>una técnica</h2>
        <div class="postcards">
          ${Object.entries(COUNTRIES).map(([k, c], i) => `
            <button class="postcard${k === 'co' ? ' active' : ''}" data-country="${k}" data-cursor="Ver ${esc(c.name)}" data-speed="${[0.05, -0.04, 0.07][i]}">
              <div class="postcard-img ${bgClass(c.color)}">${ICONS[k]}<span class="display">${esc(c.short)}</span>${i === 1 ? HASH_MARK.replace('hash-mark', 'hash-mark" style="color:var(--paper)') : ''}</div>
              <p class="mono">${esc(c.name)} — ${esc(COUNTRY_PROFILES[k].label)}</p>
            </button>`).join('')}
        </div>
        <div class="country-detail" id="countryDetail"></div>
      </div>
    </section>

    <section class="section bg-ink on-dark" id="comparativo" data-rail-label="Comparativo">
      <div class="wrap">
        <p class="label">Tabla 1 · Cuadro comparativo interactivo</p>
        <h2 class="display d-xl wsplit">Compara<br>criterio a criterio</h2>
        <div class="criteria" id="criteria">
          ${COMPARISON.map((r, i) => `<button class="chip${i === 0 ? ' active' : ''}" data-i="${i}">${esc(r.k)}</button>`).join('')}
        </div>
        <div class="compare-cols" id="compareCols"></div>
        <button class="pill pill-line" id="fullTableBtn" style="margin-top:40px;color:var(--paper)">Ver cuadro completo</button>
        <div class="full-table-wrap" id="fullTable" hidden>
          <table class="full-table"><thead><tr><th>Criterio</th><th>Colombia</th><th>Francia</th><th>Estados Unidos</th></tr></thead>
          <tbody>${COMPARISON.map((r) => `<tr><td>${esc(r.k)}</td><td>${esc(r.co)}</td><td>${esc(r.fr)}</td><td>${esc(r.us)}</td></tr>`).join('')}</tbody></table>
          <p class="label" style="margin-top:12px">Fuente: elaboración propia a partir de la normativa y la jurisprudencia citadas.</p>
        </div>
      </div>
    </section>

    <section class="section bg-paper2" id="conclusiones" data-rail-label="Conclusiones">
      <div class="wrap">
        <p class="label">Cierre</p>
        <h2 class="display d-xl wsplit">Conclusiones</h2>
        <div class="conclusions">
          ${CONCLUSIONS.map((c) => `<div class="conclusion reveal"><p class="serif">${c.n}.</p><p>${esc(c.text)}</p></div>`).join('')}
        </div>
        <div style="margin-top:60px;display:flex;gap:12px;flex-wrap:wrap">
          <a class="pill pill-ink pill-lg arrow" href="#/normativa">Explorar la normativa</a>
          <a class="pill pill-red pill-lg arrow" href="#/evaluacion">Ir a la evaluación</a>
        </div>
      </div>
    </section>
    ${footer()}`;

    $$('[data-scroll]', view).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToEl($(a.getAttribute('href'), view)); }));

    // Obra pública vs APP
    const VS = {
      obra: [['Qué compra el Estado', 'Una obra'], ['Cómo paga', 'Por avance de obra'], ['Quién financia', 'El presupuesto público'], ['Operación y mantenimiento', 'Riesgo del Estado una vez recibe la infraestructura']],
      app: [['Qué compra el Estado', 'Un servicio durante décadas'], ['Cómo paga', 'Por disponibilidad, niveles de servicio y calidad (o peajes)'], ['Quién financia', 'El privado: capital propio y deuda (project finance)'], ['Operación y mantenimiento', 'Riesgo asignado al privado según la matriz de riesgos']],
    };
    const versus = $('#versus');
    const drawVs = (m) => { versus.innerHTML = VS[m].map(([k, v]) => `<div><p class="label">${k}</p><p class="swap">${v}</p></div>`).join(''); };
    drawVs('obra');
    $$('.toggle button', view).forEach((b) => b.addEventListener('click', () => {
      $$('.toggle button', view).forEach((x) => x.classList.toggle('active', x === b));
      versus.classList.add('switching');
      setTimeout(() => { drawVs(b.dataset.mode); versus.classList.remove('switching'); }, 220);
    }));

    // Postales de países
    const drawCountry = (k) => {
      const p = COUNTRY_PROFILES[k];
      $('#countryDetail').innerHTML = `<div class="fade-swap"><p class="label">${esc(COUNTRIES[k].name)} · ${esc(COUNTRIES[k].tradition)}</p><p class="lead">${esc(p.lead)}</p></div>
        <ul class="fade-swap">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`;
    };
    drawCountry('co');
    $$('.postcard', view).forEach((b) => b.addEventListener('click', () => { $$('.postcard', view).forEach((x) => x.classList.toggle('active', x === b)); drawCountry(b.dataset.country); }));

    // Cuadro comparativo
    const drawCmp = (i) => {
      const r = COMPARISON[i];
      $('#compareCols').innerHTML = ['co', 'fr', 'us'].map((k) => `<div class="fade-swap"><span class="tag ${bgClass(COUNTRIES[k].color)}">${COUNTRIES[k].name}</span><p>${esc(r[k])}</p></div>`).join('');
    };
    drawCmp(0);
    $$('#criteria .chip', view).forEach((b) => b.addEventListener('click', () => { $$('#criteria .chip', view).forEach((x) => x.classList.toggle('active', x === b)); drawCmp(+b.dataset.i); }));
    $('#fullTableBtn').addEventListener('click', (e) => { const t = $('#fullTable'); t.hidden = !t.hidden; e.currentTarget.textContent = t.hidden ? 'Ver cuadro completo' : 'Ocultar cuadro completo'; });
  }

  const footer = () => `<footer class="footer bg-ink on-dark"><span>Las Asociaciones Público-Privadas (APP) · Estudio de derecho comparado</span><span>Yury Carolina Ochoa Álvarez · Especialización en Derecho Administrativo · Bogotá, 2026</span></footer>`;

  // =========================================================
  // NORMATIVA
  // =========================================================
  const lawFilters = { country: 'all', stage: 'all', type: 'all', q: '' };

  async function loadVerified() {
    try { const { verified } = await api('/api/laws/verified'); state.verified = new Set(verified); } catch { state.verified = new Set(); }
  }

  function filteredLaws() {
    const q = lawFilters.q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return LAWS.filter((l) => (lawFilters.country === 'all' || l.country === lawFilters.country)
      && (lawFilters.stage === 'all' || l.stages.includes(lawFilters.stage))
      && (lawFilters.type === 'all' || (lawFilters.type === 'jurisprudencia' ? l.type === 'jurisprudencia' : l.type !== 'jurisprudencia'))
      && (!q || [l.title, l.subtitle, l.summary, l.short, ...l.articles.map((a) => a.ref + ' ' + a.text)].join(' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)));
  }

  function renderNormativa() {
    const chip = (group, val, label) => `<button class="chip${lawFilters[group] === val ? ' active' : ''}" data-group="${group}" data-val="${val}">${label}</button>`;
    view.innerHTML = `
    <section class="hero bg-paper" style="padding-bottom:50px">
      <div class="hero-top">
        <div><p class="label">CH.2 · Marco normativo</p><h1 class="display d-xxl wsplit">Normativa</h1></div>
        <div>
          <p class="lead" style="margin-bottom:20px">Entra a cada norma, revisa sus artículos clave y <b>verifícala</b> en la fuente oficial. Marca las que ya revisaste.</p>
          <p class="label" id="verifiedLabel"></p>
          <div class="progress"><i id="verifiedBar"></i></div>
        </div>
      </div>
    </section>
    <div class="filters">
      <div class="filter-group"><span class="label">País</span>${chip('country', 'all', 'Todos')}${chip('country', 'co', 'Colombia')}${chip('country', 'fr', 'Francia')}${chip('country', 'us', 'EE. UU.')}</div>
      <div class="filter-group"><span class="label">Etapa</span>${chip('stage', 'all', 'Todas')}${chip('stage', 'pre', 'Pre')}${chip('stage', 'con', 'Contractual')}${chip('stage', 'post', 'Post')}</div>
      <div class="filter-group"><span class="label">Tipo</span>${chip('type', 'all', 'Todo')}${chip('type', 'norma', 'Normas')}${chip('type', 'jurisprudencia', 'Jurisprudencia')}</div>
      <input class="search" id="lawSearch" type="search" placeholder="Buscar: «reversión», «L2212», «TIFIA»…" value="${esc(lawFilters.q)}" aria-label="Buscar normas">
    </div>
    <div class="law-grid" id="lawGrid"></div>
    ${footer()}`;

    drawLawGrid();
    $$('.filters .chip', view).forEach((b) => b.addEventListener('click', () => {
      lawFilters[b.dataset.group] = b.dataset.val;
      $$(`.filters .chip[data-group="${b.dataset.group}"]`, view).forEach((x) => x.classList.toggle('active', x === b));
      drawLawGrid();
    }));
    $('#lawSearch').addEventListener('input', (e) => { lawFilters.q = e.target.value; drawLawGrid(); });
  }

  function drawLawGrid() {
    const list = filteredLaws();
    const grid = $('#lawGrid');
    if (!grid) return;
    grid.innerHTML = list.length ? list.map((l) => `
      <button class="law-card" data-id="${l.id}" data-cursor="Ver norma">
        <div class="meta"><span><i class="country-bar c-${l.country}"></i>${COUNTRIES[l.country].short}</span><span>${TYPE_LABELS[l.type]}</span></div>
        <span class="display">${esc(l.short)}</span>
        <span class="year">${l.year ?? 's. f.'}</span>
        <p class="sub">${esc(l.subtitle)}</p>
        <div class="dots">${l.stages.map((s) => `<span class="dot-tag">${STAGE_NAMES[s]}</span>`).join('')}</div>
        ${state.verified.has(l.id) ? '<span class="stamp">Verificada</span>' : ''}
      </button>`).join('') : '<p class="empty">No hay normas con esos filtros.</p>';
    $$('.law-card', grid).forEach((c) => c.addEventListener('click', () => go('/normativa/' + c.dataset.id)));
    const total = LAWS.length; const done = LAWS.filter((l) => state.verified.has(l.id)).length;
    $('#verifiedLabel').textContent = `Has verificado ${done} de ${total} normas`;
    $('#verifiedBar').style.width = (done / total) * 100 + '%';
  }

  let lastFocus = null;
  function openLaw(id) {
    const list = filteredLaws().some((l) => l.id === id) ? filteredLaws() : LAWS;
    const idx = list.findIndex((l) => l.id === id);
    const l = list[idx];
    if (!l) return go('/normativa');
    const prev = list[(idx - 1 + list.length) % list.length]; const next = list[(idx + 1) % list.length];
    const drawer = $('#drawer');
    const verified = state.verified.has(l.id);
    drawer.innerHTML = `
      <div class="drawer-head ${bgClass(COUNTRIES[l.country].color)}">
        <div class="drawer-nav">
          <button data-go="${prev.id}">← Anterior</button>
          <span>${idx + 1} / ${list.length}</span>
          <button data-go="${next.id}">Siguiente →</button>
          <button data-close aria-label="Cerrar">Cerrar ✕</button>
        </div>
        <p class="mono" style="margin:0 0 10px">${COUNTRIES[l.country].name} · ${TYPE_LABELS[l.type]}</p>
        <h2 class="display d-l">${esc(l.title)}</h2>
        <p class="year-big">${l.year ?? 's. f.'}</p>
      </div>
      <div class="drawer-body">
        <p class="label">${esc(l.subtitle)}</p>
        <p class="lead" style="margin-bottom:30px">${esc(l.summary)}</p>
        <p class="label">Artículos y reglas clave</p>
        <div class="acc">
          ${l.articles.map((a, i) => `<div class="acc-item${i === 0 ? ' open' : ''}"><button class="acc-btn" aria-expanded="${i === 0}">${esc(a.ref)}</button><div class="acc-panel"><div><p>${esc(a.text)}</p></div></div></div>`).join('')}
        </div>
        <p class="label" style="margin-top:26px">Etapas en las que incide</p>
        <div class="dots" style="display:flex;gap:6px;flex-wrap:wrap">${l.stages.map((s) => `<a class="dot-tag" href="#/etapas" style="text-decoration:none">${STAGE_NAMES[s]}</a>`).join('')}</div>
        <div class="drawer-actions">
          <a class="pill pill-ink ext" href="${l.source}" target="_blank" rel="noopener noreferrer">Verificar en fuente oficial</a>
          <button class="pill ${verified ? 'pill-blue' : 'pill-red'}" id="verifyBtn">${verified ? '✓ Verificada' : 'Marcar como verificada'}</button>
        </div>
        <p class="verify-note">Fuente: ${esc(l.sourceName)}. Abre la fuente, contrasta los artículos y marca la norma como verificada.</p>
      </div>`;
    document.body.classList.add('drawer-open'); drawer.setAttribute('aria-hidden', 'false');
    lastFocus = lastFocus || document.activeElement;
    drawer.scrollTop = 0; $('[data-close]', drawer).focus();

    $$('[data-go]', drawer).forEach((b) => b.addEventListener('click', () => go('/normativa/' + b.dataset.go)));
    $('[data-close]', drawer).addEventListener('click', () => go('/normativa'));
    $$('.acc-btn', drawer).forEach((b) => b.addEventListener('click', () => { const it = b.parentElement; it.classList.toggle('open'); b.setAttribute('aria-expanded', it.classList.contains('open')); }));
    $('#verifyBtn').addEventListener('click', async (e) => {
      const btn = e.currentTarget; const on = !state.verified.has(l.id);
      btn.disabled = true;
      try {
        await api(`/api/laws/${l.id}/verify`, { method: on ? 'POST' : 'DELETE' });
        on ? state.verified.add(l.id) : state.verified.delete(l.id);
        btn.textContent = on ? '✓ Verificada' : 'Marcar como verificada';
        btn.classList.toggle('pill-blue', on); btn.classList.toggle('pill-red', !on);
        drawLawGrid();
        if (on) toast(`${l.title}: verificada.`);
      } catch (ex) { toast(ex.message, true); }
      btn.disabled = false;
    });
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open'); $('#drawer').setAttribute('aria-hidden', 'true');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  $('#scrim').addEventListener('click', () => go('/normativa'));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('drawer-open')) go('/normativa');
    else if (document.body.classList.contains('menu-open')) closeMenu();
  });

  // =========================================================
  // ETAPAS
  // =========================================================
  function renderEtapas() {
    view.innerHTML = `
    <section class="hero bg-paper">
      <div class="hero-top">
        <div><p class="label">CH.3 · Los tres momentos jurídicos</p><h1 class="display hero-title wsplit">Las tres etapas de la contratación</h1></div>
        <p class="lead reveal">Recorre cada etapa: al bajar, los paneles se desplazan de lado y comparan cómo la regulan Colombia, Francia y Estados Unidos.</p>
      </div>
      <div class="stage-blocks">
        ${STAGES.map((s) => `<a class="stage-block ${bgClass(s.color)}" href="#stage-${s.key}" data-scroll data-cursor="Recorrer"><span>${s.ch}</span><span class="display d-l">${s.name}</span><span>${s.tagline}</span></a>`).join('')}
      </div>
    </section>
    ${STAGES.map((s) => `
      <section class="hscroll" id="stage-${s.key}" data-rail-label="${s.ch} ${s.name}">
        <div class="hs-sticky"><div class="hs-track">
          <div class="panel panel-title ${bgClass(s.color)}">
            <p class="label">Etapa ${s.ch}</p>
            <h2 class="display stage-name wsplit">${s.name}</h2>
            <div>
              <p class="tagline" style="font-family:var(--f-display);text-transform:uppercase;font-size:clamp(22px,2.2vw,34px);line-height:.95;margin:0 0 26px;max-width:16ch">${s.tagline}</p>
              <span class="hs-hint mono">Sigue bajando para recorrer la etapa</span>
            </div>
          </div>
          <div class="panel panel-intro bg-paper">
            <p class="serif">${s.ch} — Contexto</p>
            <p class="lead-l reveal">${esc(s.intro)}</p>
            <div style="margin-top:40px">${ARROW_MARK}</div>
          </div>
          ${['co', 'fr', 'us'].map((c) => `
            <div class="panel panel-country ${bgClass(COUNTRIES[c].color)}">
              <div class="pc-head">
                <div><p class="mono" style="margin:0 0 10px">${COUNTRIES[c].name} · ${COUNTRIES[c].tradition}</p><h3 class="display wsplit">${esc(s.countries[c].headline)}</h3></div>
                <span class="pc-flag" data-speed="-0.05">${COUNTRIES[c].short}</span>
              </div>
              <ol class="points cols">${s.countries[c].points.map((p) => `<li><div><b>${esc(p.t)}</b><span>${esc(p.d)}</span></div></li>`).join('')}</ol>
            </div>`).join('')}
          ${s.caseStudy ? `
            <div class="panel panel-case bg-paper2">
              <div class="case-card"><p class="mono">Caso ilustrativo · ${COUNTRIES[s.caseStudy.country].name} · ${s.caseStudy.year}</p><h3 class="display">${esc(s.caseStudy.title)}</h3><p>${esc(s.caseStudy.text)}</p></div>
            </div>` : ''}
        </div></div>
      </section>`).join('')}
    <section class="section bg-paper2" id="casos" data-rail-label="Casos">
      <div class="wrap">
        <p class="label">Casos que enseñan</p>
        <h2 class="display d-xl wsplit">La planeación<br>lo decide todo</h2>
        <div class="postcards">
          ${CASES.map((c, i) => `<div class="postcard" data-speed="${[0.05, -0.04, 0.07][i]}"><div class="postcard-img ${bgClass(COUNTRIES[c.country].color)}">${ICONS[c.country]}<span class="display" style="font-size:clamp(40px,4.4vw,68px)">${esc(c.title)}</span>${i === 0 ? HASH_MARK.replace('hash-mark', 'hash-mark" style="color:var(--ink)') : ''}</div><p class="mono">${COUNTRIES[c.country].name} — ${esc(c.year)}</p><p style="margin:6px 2px 4px">${esc(c.text)}</p></div>`).join('')}
        </div>
        <a class="pill pill-red pill-lg arrow" href="#/evaluacion">Ponte a prueba</a>
      </div>
    </section>
    ${footer()}`;

    $$('[data-scroll]', view).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToEl($(a.getAttribute('href'), view)); }));
  }

  // =========================================================
  // EVALUACIÓN
  // =========================================================
  const SEG_COLORS = ['#EF4135', '#0055A4', '#0B1B36', '#FCD116', '#E7E4DC', '#EF4135', '#0055A4'];

  function wheelSVG(segments) {
    const n = segments.length; const a = 360 / n; const r = 250; const c = 260;
    const pt = (deg, rad) => [c + rad * Math.sin((deg * Math.PI) / 180), c - rad * Math.cos((deg * Math.PI) / 180)];
    const slices = segments.map((s, i) => {
      const [x1, y1] = pt(i * a, r); const [x2, y2] = pt((i + 1) * a, r);
      const mid = i * a + a / 2; const fill = SEG_COLORS[i % SEG_COLORS.length]; const txt = fill === '#0B1B36' || fill === '#0055A4' ? '#F8F6F1' : '#0B1B36';
      const isBonus = s.bonus > 0;
      return `<path d="M${c},${c} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${fill}" stroke="#0B1B36" stroke-width="3"/>
        <g transform="rotate(${mid} ${c} ${c})" fill="${txt}" text-anchor="middle">
          <text x="${c}" y="${c - r + 88}" font-family="Anton, Impact, sans-serif" font-size="${isBonus ? 40 : 64}">${isBonus ? 'BONUS' : s.label}</text>
          <text x="${c}" y="${c - r + 116}" font-family="Courier Prime, monospace" font-size="17">${isBonus ? '+0,5 · 5 preg.' : 'preguntas'}</text>
        </g>`;
    }).join('');
    return `<svg class="wheel" id="wheel" viewBox="0 0 520 520" role="img" aria-label="Ruleta de preguntas">
      <circle cx="${c}" cy="${c}" r="${r + 6}" fill="#0B1B36"/>${slices}
      ${segments.map((_, i) => { const [x, y] = pt(i * a, r - 6); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#F8F6F1"/>`; }).join('')}
    </svg>`;
  }

  const rotationFor = (index, n, spins = 0, jitter = 0) => spins * 360 + (360 - (index * (360 / n) + 180 / n)) + jitter;

  async function renderEvaluacion() {
    view.innerHTML = '<section class="section bg-paper"><p class="lead">Cargando evaluación…</p></section>';
    try {
      if (!state.evalConfig) state.evalConfig = await api('/api/eval/config');
      const { attempt } = await api('/api/eval/status');
      if (state.current !== 'evaluacion') return; // se navegó a otra sección mientras cargaba
      if (!attempt) return renderWheel(null);
      if (attempt.status === 'done') return renderResults(attempt);
      return renderWheel(attempt);
    } catch (ex) { view.innerHTML = `<section class="section bg-paper"><p class="lead">${esc(ex.message)}</p></section>`; }
  }

  function renderWheel(attempt) {
    const { segments, passScore, maxScore } = state.evalConfig;
    view.innerHTML = `
    <section class="section bg-paper" style="padding-top:90px">
      <div class="wrap eval-grid">
        <div>
          <p class="label">CH.4 · Evaluación</p>
          <h1 class="display d-xl wsplit">La ruleta</h1>
          ${ARROW_MARK.replace('arrow-mark', 'arrow-mark" style="margin-top:6px')}
          <p class="lead" style="margin-top:20px">La ruleta asigna al azar cuántas preguntas vas a responder. Tienes <b>un solo giro</b>.</p>
          <ul class="rules">
            <li><b>5</b><span>preguntas de selección múltiple</span></li>
            <li><b>8</b><span>preguntas de selección múltiple</span></li>
            <li><b>10</b><span>preguntas de selección múltiple</span></li>
            <li><b style="background:var(--yellow);padding:2px 6px 0">★</b><span><b style="font:inherit;font-weight:700;min-width:0">Casilla BONUS:</b> solo 5 preguntas y <b style="font:inherit;font-weight:700;min-width:0">+0,5</b> adicional en tu nota final.</span></li>
          </ul>
          <p class="label">Nota de 0,0 a ${dec(maxScore)} · Se aprueba con ${dec(passScore)}</p>
        </div>
        <div class="wheel-col">
          <div class="wheel-wrap">
            <div class="wheel-pointer"></div>
            ${wheelSVG(segments)}
            <button class="spin-btn" id="spinBtn" ${attempt ? 'disabled' : ''}>${attempt ? '★' : 'Girar'}</button>
          </div>
          <div id="spinResult"></div>
        </div>
      </div>
    </section>`;

    const wheel = $('#wheel');
    if (attempt) {
      wheel.style.transition = 'none';
      wheel.style.transform = `rotate(${rotationFor(attempt.segmentIndex, segments.length)}deg)`;
      showSpinResult(attempt, true);
      return;
    }
    $('#spinBtn').addEventListener('click', async (e) => {
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = '…';
      try {
        const { attempt: a } = await api('/api/eval/spin', { method: 'POST' });
        const seg = 360 / segments.length;
        const jitter = (Math.random() - 0.5) * seg * 0.6;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        wheel.style.transform = `rotate(${rotationFor(a.segmentIndex, segments.length, 7, jitter)}deg)`;
        setTimeout(() => { if (!btn.isConnected) return; btn.textContent = '★'; showSpinResult(a, false); }, reduce ? 50 : 6100);
      } catch (ex) { toast(ex.message, true); btn.disabled = false; btn.textContent = 'Girar'; }
    });
  }

  function showSpinResult(a, resumed) {
    const isBonus = a.bonus > 0;
    $('#spinResult').innerHTML = `
      <div class="result-reveal">
        <p class="mono" style="margin:0 0 6px">${resumed ? 'Tu giro fue:' : '¡La ruleta ha hablado!'}</p>
        ${isBonus ? `<p class="display" style="background:var(--yellow);display:inline-block;padding:10px 14px 0">Bonus +0,5</p><p class="lead" style="margin:14px 0 0">Te tocan <b>${a.numQuestions} preguntas</b> y medio punto adicional en tu nota.</p>`
          : `<p class="display">${a.numQuestions} preguntas</p>`}
        <button class="pill pill-red pill-lg arrow" id="startQuiz" style="margin-top:20px">${resumed ? 'Continuar evaluación' : 'Comenzar evaluación'}</button>
      </div>`;
    $('#startQuiz').addEventListener('click', () => renderQuiz(a));
    // El resultado queda debajo de la ruleta: en pantallas bajas o móviles hay que traerlo a la vista.
    if (!resumed) $('#spinResult').scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    if (isBonus && !resumed) toast('¡Cayó en BONUS! +0,5 en tu nota final.');
  }

  function renderQuiz(a) {
    const key = `app-eval-${a.id}`;
    const saved = store.get(key) || {};
    const answers = saved.answers || {};
    let i = clamp(Number(saved.i) || 0, 0, a.questions.length - 1);
    let advance; let sending = false;
    const letters = ['A', 'B', 'C', 'D'];

    view.innerHTML = `<section class="quiz bg-ink on-dark" id="quiz"></section>`;
    const root = $('#quiz');
    const save = () => store.set(key, { answers, i });

    const draw = () => {
      const q = a.questions[i];
      const answered = Object.keys(answers).length;
      root.innerHTML = `
        <div class="quiz-top">
          <span class="mono">PREGUNTA ${pad(i + 1)} / ${pad(a.questions.length)}${a.bonus ? ' · <span style="color:var(--yellow)">BONUS +0,5</span>' : ''}</span>
          <div class="qdots">${a.questions.map((qq, k) => `<button class="qdot${answers[qq.id] != null ? ' answered' : ''}${k === i ? ' current' : ''}" data-k="${k}" aria-label="Pregunta ${k + 1}">${k + 1}</button>`).join('')}</div>
        </div>
        <div class="quiz-progress"><i style="width:${(answered / a.questions.length) * 100}%"></i></div>
        <div class="question fade-swap">
          <p class="label">${esc(q.topic)}</p>
          <p class="lead-l">${esc(q.q)}</p>
          <div class="options" role="radiogroup">
            ${q.options.map((o, k) => `<button class="option${answers[q.id] === k ? ' selected' : ''}" role="radio" aria-checked="${answers[q.id] === k}" data-opt="${k}"><span class="letter">${letters[k]}</span><span>${esc(o)}</span></button>`).join('')}
          </div>
        </div>
        <div class="quiz-nav">
          <button class="pill pill-line" id="prevQ" ${i === 0 ? 'disabled' : ''}>← Anterior</button>
          ${i < a.questions.length - 1 ? '<button class="pill pill-paper arrow" id="nextQ">Siguiente</button>' : `<button class="pill pill-red pill-lg" id="submitQ">Enviar respuestas (${answered}/${a.questions.length})</button>`}
        </div>`;
      $$('.option', root).forEach((b) => b.addEventListener('click', () => {
        answers[q.id] = +b.dataset.opt; save();
        clearTimeout(advance); draw();
        // Un solo avance pendiente: con doble clic no se salta preguntas ni se sale del rango.
        if (i < a.questions.length - 1) advance = setTimeout(() => { if (!root.isConnected) return; i = Math.min(i + 1, a.questions.length - 1); save(); draw(); }, 380);
      }));
      const goTo = (k) => { clearTimeout(advance); i = clamp(k, 0, a.questions.length - 1); save(); draw(); };
      $$('.qdot', root).forEach((b) => b.addEventListener('click', () => goTo(+b.dataset.k)));
      $('#prevQ')?.addEventListener('click', () => goTo(i - 1));
      $('#nextQ')?.addEventListener('click', () => goTo(i + 1));
      $('#submitQ')?.addEventListener('click', submit);
      window.scrollTo({ top: 0 });
    };

    async function submit(e) {
      if (sending) return;
      const missing = a.questions.filter((q) => answers[q.id] == null).length;
      if (missing > 0 && !confirm(`Tienes ${missing} pregunta(s) sin responder. Las preguntas sin respuesta cuentan como incorrectas. ¿Enviar de todos modos?`)) return;
      if (missing === 0 && !confirm('¿Enviar tus respuestas? Esta acción es definitiva.')) return;
      const btn = e?.currentTarget; sending = true; if (btn) btn.disabled = true;
      try {
        const { attempt } = await api('/api/eval/submit', { method: 'POST', body: { answers } });
        store.del(key);
        renderResults(attempt, true);
      } catch (ex) {
        sending = false; if (btn) btn.disabled = false;
        toast(ex.message, true);
        // Si el envío sí llegó (p. ej. se cortó la respuesta), el intento ya está cerrado: mostrar la nota.
        if (state.user) api('/api/eval/status').then(({ attempt }) => { if (attempt?.status === 'done' && root.isConnected) { store.del(key); renderResults(attempt); } }).catch(() => {});
      }
    }
    draw();
  }

  function renderResults(a, fresh = false) {
    const passed = a.passed;
    const letters = ['A', 'B', 'C', 'D'];
    view.innerHTML = `
    <section class="section ${passed ? 'bg-blue on-dark' : 'bg-red'}" style="padding-top:100px">
      <div class="wrap">
        <p class="label">Tu nota · ${esc(state.user.name)}</p>
        <div class="score-hero">
          <p class="score-num reveal">${dec(a.score)}<small> / ${dec(state.evalConfig.maxScore)}</small></p>
          <div>
            <p class="display d-l" style="margin-bottom:24px">${passed ? '¡Aprobaste!' : 'Sigue estudiando'}</p>
            <ul class="score-facts">
              <li><span>Casilla de la ruleta</span><b>${a.bonus ? 'BONUS ★' : a.spinLabel + ' preguntas'}</b></li>
              <li><span>Respuestas correctas</span><b>${a.correct} de ${a.numQuestions}</b></li>
              <li><span>Bonus</span><b>${a.bonus ? '+' + dec(a.bonus) : '—'}</b></li>
              <li><span>Enviada</span><b>${fmtDate(a.finishedAt)}</b></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section class="section bg-paper">
      <div class="wrap">
        <p class="label">Retroalimentación</p>
        <h2 class="display d-l">Revisa tus respuestas</h2>
        <div class="review">
          ${a.questions.map((q, k) => {
            const ok = q.chosen === q.answer;
            return `<div class="review-item"><span class="mark ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✕'}</span><div>
              <p class="mono" style="margin:0">${pad(k + 1)} · ${esc(q.topic)}</p>
              <h4>${esc(q.q)}</h4>
              <p>Tu respuesta: <b>${q.chosen == null ? 'Sin responder' : letters[q.chosen] + '. ' + esc(q.options[q.chosen])}</b></p>
              ${ok ? '' : `<p>Respuesta correcta: <b>${letters[q.answer]}. ${esc(q.options[q.answer])}</b></p>`}
              <p class="explain">${esc(q.explain)}</p></div></div>`;
          }).join('')}
        </div>
        <div style="margin-top:50px;display:flex;gap:12px;flex-wrap:wrap">
          <a class="pill pill-ink pill-lg arrow" href="#/etapas">Repasar las etapas</a>
          <a class="pill pill-line pill-lg arrow" href="#/normativa">Ir a la normativa</a>
        </div>
      </div>
    </section>
    ${footer()}`;
    if (fresh) { toast(passed ? '¡Evaluación enviada! Aprobaste.' : 'Evaluación enviada. Tu nota quedó registrada.'); observe(); }
    scrollToY(0, true);
  }

  // =========================================================
  // ADMIN
  // =========================================================
  const adminState = { q: '', sort: 'last', asc: false };

  // refresh = true al pulsar "Actualizar" o tras reiniciar un intento: conserva la vista y la posición de scroll.
  async function renderAdmin(refresh = false) {
    if (state.user?.role !== 'admin') return go('/inicio');
    if (!refresh) view.innerHTML = '<section class="section bg-ink on-dark"><p class="lead">Cargando panel…</p></section>';
    let data;
    try { data = await api('/api/admin/overview'); } catch (ex) {
      if (refresh) { const btn = $('#reloadAdmin'); if (btn) btn.disabled = false; return toast(ex.message, true); }
      view.innerHTML = `<section class="section bg-paper"><p class="lead">${esc(ex.message)}</p></section>`; return;
    }
    if (state.current !== 'admin') return; // el usuario navegó a otra sección mientras cargaba
    const keepY = scrollY;
    const s = data.students;
    const done = s.filter((x) => x.status === 'done');
    const avg = done.length ? done.reduce((t, x) => t + x.score, 0) / done.length : null;
    const passed = done.filter((x) => x.score >= data.passScore).length;

    view.innerHTML = `
    <section class="section-tight admin-head bg-ink on-dark">
      <div class="wrap">
        <p class="label">Administración</p>
        <h1 class="display">Panel admin</h1>
        <p class="admin-summary"><b>${s.length}</b> estudiantes registrados, <b>${done.length}</b> con evaluación terminada${avg != null ? `, promedio <b>${dec(avg)}</b> y <b>${passed}</b> aprobados` : ''}.</p>
      </div>
    </section>
    <section class="section-tight bg-paper">
      <div class="wrap">
        <div class="table-tools">
          <div><p class="label">Estudiantes y notas</p><input class="search" id="adminSearch" type="search" placeholder="Buscar estudiante…" value="${esc(adminState.q)}" aria-label="Buscar estudiante"></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="pill pill-line" id="reloadAdmin">Actualizar</button>
            <a class="pill pill-ink" href="/api/admin/export.csv">Descargar CSV</a>
          </div>
        </div>
        <div class="table-wrap"><table class="data">
          <thead><tr>
            <th data-sort="name">Estudiante</th><th data-sort="created">Registro</th><th data-sort="last">Último ingreso</th><th data-sort="logins">Ingresos</th>
            <th data-sort="verified">Normas verif.</th><th>Ruleta</th><th data-sort="correct">Aciertos</th><th data-sort="score">Nota</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody id="adminRows"></tbody>
        </table></div>
      </div>
    </section>
    <section class="section-tight bg-ink on-dark">
      <div class="wrap split">
        <div><p class="label">Actividad reciente</p><h2 class="display d-l">Ingresos</h2></div>
        <ul class="activity">${data.activity.length ? data.activity.map((x) => `<li><span>${esc(x.name)} <span style="color:#A3AEC4">· ${x.kind === 'register' ? 'se registró' : 'ingresó'}</span></span><span style="color:#A3AEC4">${fmtDate(x.at)}</span></li>`).join('') : '<li>Aún no hay ingresos de estudiantes.</li>'}</ul>
      </div>
    </section>`;

    const sorters = {
      name: (x) => x.name.toLowerCase(), created: (x) => x.created_at || '', last: (x) => x.last_login || x.created_at || '',
      logins: (x) => x.logins, verified: (x) => x.verified, correct: (x) => x.correct ?? -1, score: (x) => x.score ?? -1,
    };
    const drawRows = () => {
      const q = adminState.q.toLowerCase();
      const rows = s.filter((x) => x.name.toLowerCase().includes(q)).sort((x, y) => {
        const a = sorters[adminState.sort](x); const b = sorters[adminState.sort](y);
        return (a > b ? 1 : a < b ? -1 : 0) * (adminState.asc ? 1 : -1);
      });
      $('#adminRows').innerHTML = rows.length ? rows.map((x) => `
        <tr>
          <td><b>${esc(x.name)}</b></td>
          <td class="nowrap" data-label="Registro">${fmtDate(x.created_at)}</td>
          <td class="nowrap" data-label="Último ingreso">${fmtDate(x.last_login)}</td>
          <td data-label="Ingresos">${x.logins}</td>
          <td data-label="Normas verificadas">${x.verified} / ${LAWS.length}</td>
          <td data-label="Ruleta">${x.spin_label ? (x.bonus ? '<span class="badge bonus">Bonus ★</span>' : x.spin_label + ' preg.') : '—'}</td>
          <td data-label="Aciertos">${x.status === 'done' ? `${x.correct} / ${x.num_questions}` : '—'}</td>
          <td data-label="Nota">${x.status === 'done' ? `<span class="grade ${x.score >= data.passScore ? 'pass' : 'fail'}">${dec(x.score)}</span>` : '—'}</td>
          <td data-label="Estado">${x.status === 'done' ? '<span class="badge">Terminada</span>' : x.status === 'in_progress' ? '<span class="badge" style="color:var(--red)">En curso</span>' : '<span class="badge" style="opacity:.5">Sin iniciar</span>'}</td>
          <td>${x.attempt_id ? `<button class="link-btn" data-reset="${x.attempt_id}" data-name="${esc(x.name)}">Reiniciar</button>` : ''}</td>
        </tr>`).join('') : '<tr><td colspan="10" style="padding:30px 10px">No hay estudiantes que coincidan.</td></tr>';
      $$('[data-reset]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm(`¿Reiniciar la evaluación de ${b.dataset.name}? Se borrará su giro y su nota, y podrá presentarla de nuevo.`)) return;
        b.disabled = true;
        try { await api('/api/admin/attempts/' + b.dataset.reset, { method: 'DELETE' }); toast('Evaluación reiniciada.'); renderAdmin(true); } catch (ex) { b.disabled = false; toast(ex.message, true); }
      }));
      $$('th[data-sort]').forEach((th) => { th.classList.toggle('sorted', th.dataset.sort === adminState.sort); th.classList.toggle('asc', th.dataset.sort === adminState.sort && adminState.asc); });
    };
    drawRows();
    if (refresh) scrollToY(keepY, true);
    $('#adminSearch').addEventListener('input', (e) => { adminState.q = e.target.value; drawRows(); });
    $('#reloadAdmin').addEventListener('click', (e) => { e.currentTarget.disabled = true; renderAdmin(true); });
    $$('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
      if (adminState.sort === th.dataset.sort) adminState.asc = !adminState.asc; else { adminState.sort = th.dataset.sort; adminState.asc = th.dataset.sort === 'name'; }
      drawRows();
    }));
  }

  // =========================================================
  // ROUTER
  // =========================================================
  let navSeq = 0;
  async function route() {
    const path = location.hash.slice(1) || '/inicio';
    // Anclas internas (#contexto, #stage-pre) no son rutas.
    if (!path.startsWith('/')) return;
    const [, section, param] = path.split('/');

    if (!state.user && section !== 'ingresar' && section !== 'registro') return go('/ingresar');
    if (state.user && (section === 'ingresar' || section === 'registro')) return go('/inicio');

    // En la normativa, abrir/cerrar la ficha sin volver a dibujar la cuadrícula.
    if (section === 'normativa' && state.current === 'normativa') {
      if (param) openLaw(param); else closeDrawer();
      renderChrome();
      return;
    }
    closeDrawer();

    const views = {
      ingresar: () => renderAuth('login'), registro: () => renderAuth('register'), inicio: renderHome,
      normativa: renderNormativa, etapas: renderEtapas, evaluacion: renderEvaluacion, admin: renderAdmin,
    };
    const labels = { inicio: 'Inicio', normativa: 'Normativa', etapas: 'Las 3 etapas', evaluacion: 'Evaluación', admin: 'Panel admin', ingresar: 'Bienvenido', registro: 'Registro' };
    const fn = views[section];
    if (!fn) return go('/inicio');
    const changing = state.current && state.current !== section;
    const nav = ++navSeq;
    if (changing) await curtainIn(labels[section]);
    if (nav !== navSeq) return; // otra navegación empezó durante la cortina
    state.current = section;
    renderChrome();
    scrollToY(0, true);
    await fn();
    if (nav !== navSeq) return;
    observe();
    curtainOut();
    if (section === 'normativa' && param) openLaw(param);
    view.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', route);

  (async () => {
    try { const { user } = await api('/api/auth/me'); state.user = user; if (user) await loadVerified(); } catch { state.user = null; }
    route();
  })();
})();
