// Servidor HTTP sin dependencias: API REST + archivos estáticos.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, nameKey, hashPasswordAsync, checkPasswordAsync } = require('./src/db');
const QUESTIONS = require('./src/questions');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_DAYS = 7;

// Casillas de la ruleta. El orden debe coincidir con el dibujo del frontend (se envía por la API).
const SEGMENTS = [
  { label: '5', questions: 5, bonus: 0 },
  { label: '8', questions: 8, bonus: 0 },
  { label: '10', questions: 10, bonus: 0 },
  { label: 'BONUS', questions: 5, bonus: 0.5 },
  { label: '5', questions: 5, bonus: 0 },
  { label: '8', questions: 8, bonus: 0 },
  { label: '10', questions: 10, bonus: 0 },
];
const MAX_SCORE = 5;
const PASS_SCORE = 3;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// ---------- helpers ----------
function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(data);
}

// Siempre resuelve un objeto plano: JSON inválido, `null`, números o arreglos se tratan como {}.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; let tooBig = false; const chunks = [];
    req.on('data', (c) => {
      if (tooBig) return;
      size += c.length;
      if (size > 1e6) { tooBig = true; reject(Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 })); } else chunks.push(c);
    });
    req.on('end', () => {
      if (tooBig) return;
      let data = {};
      try { data = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; } catch { /* JSON inválido */ }
      resolve(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
    });
    req.on('error', reject);
  });
}

const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, safeDecode(v.join('='))]));
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires.toISOString());
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`);
}

function currentUser(req) {
  const token = parseCookies(req).sid;
  if (!token) return null;
  const row = db.prepare(`SELECT u.id, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).get(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) { db.prepare('DELETE FROM sessions WHERE token = ?').run(token); return null; }
  return { id: row.id, name: row.name, role: row.role, token };
}

const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role });
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

function attemptView(a, withSolutions) {
  const ids = JSON.parse(a.question_ids);
  const answers = a.answers ? JSON.parse(a.answers) : {};
  return {
    id: a.id, status: a.status, segmentIndex: a.segment_index, spinLabel: a.spin_label,
    numQuestions: a.num_questions, bonus: a.bonus, correct: a.correct, score: a.score,
    passed: a.score != null ? a.score >= PASS_SCORE : null, startedAt: a.started_at, finishedAt: a.finished_at,
    // filter: si el banco de preguntas cambia, un id antiguo no debe romper la vista del intento.
    questions: ids.filter((id) => byId.has(id)).map((id) => {
      const q = byId.get(id);
      const base = { id: q.id, topic: q.topic, q: q.q, options: q.options };
      return withSolutions ? { ...base, answer: q.answer, explain: q.explain, chosen: answers[id] ?? null } : base;
    }),
  };
}

// ---------- API ----------
async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const user = currentUser(req);

  // --- autenticación ---
  if (route === 'POST /api/auth/register') {
    const { name = '', password = '' } = await readBody(req);
    const clean = String(name).replace(/\s+/g, ' ').trim();
    if (clean.length < 3 || clean.length > 80) return send(res, 400, { error: 'Escribe tu nombre completo (entre 3 y 80 caracteres).' });
    if (String(password).length < 4) return send(res, 400, { error: 'La contraseña debe tener al menos 4 caracteres.' });
    const taken = () => send(res, 409, { error: 'Ya existe un usuario con ese nombre. Ingresa desde "Iniciar sesión".' });
    if (db.prepare('SELECT id FROM users WHERE name_key = ?').get(nameKey(clean))) return taken();
    const { hash, salt } = await hashPasswordAsync(password);
    // Durante el hash (asíncrono) otro registro con el mismo nombre pudo adelantarse: lo resuelve la restricción UNIQUE.
    let lastInsertRowid;
    try {
      ({ lastInsertRowid } = db.prepare("INSERT INTO users (name, name_key, password_hash, salt, last_login) VALUES (?, ?, ?, ?, datetime('now'))").run(clean, nameKey(clean), hash, salt));
    } catch (e) { if (/UNIQUE/i.test(e.message)) return taken(); throw e; }
    const id = Number(lastInsertRowid);
    db.prepare("INSERT INTO logins (user_id, kind) VALUES (?, 'register')").run(id);
    createSession(res, id);
    return send(res, 201, { user: { id, name: clean, role: 'student' } });
  }

  if (route === 'POST /api/auth/login') {
    const { name = '', password = '' } = await readBody(req);
    const u = db.prepare('SELECT * FROM users WHERE name_key = ?').get(nameKey(name));
    if (!u || !(await checkPasswordAsync(password, u))) return send(res, 401, { error: 'Nombre o contraseña incorrectos.' });
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(u.id);
    db.prepare("INSERT INTO logins (user_id, kind) VALUES (?, 'login')").run(u.id);
    createSession(res, u.id);
    return send(res, 200, { user: publicUser(u) });
  }

  if (route === 'POST /api/auth/logout') {
    if (user) db.prepare('DELETE FROM sessions WHERE token = ?').run(user.token);
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }

  if (route === 'GET /api/auth/me') return send(res, 200, { user: user ? publicUser(user) : null });

  if (!user) return send(res, 401, { error: 'Debes iniciar sesión.' });

  // --- normas verificadas ---
  if (route === 'GET /api/laws/verified') {
    const rows = db.prepare('SELECT law_id FROM verified_laws WHERE user_id = ?').all(user.id);
    return send(res, 200, { verified: rows.map((r) => r.law_id) });
  }
  const verifyMatch = url.pathname.match(/^\/api\/laws\/([a-z0-9-]{1,60})\/verify$/);
  if (verifyMatch && (req.method === 'POST' || req.method === 'DELETE')) {
    if (req.method === 'POST') db.prepare('INSERT OR IGNORE INTO verified_laws (user_id, law_id) VALUES (?, ?)').run(user.id, verifyMatch[1]);
    else db.prepare('DELETE FROM verified_laws WHERE user_id = ? AND law_id = ?').run(user.id, verifyMatch[1]);
    return send(res, 200, { ok: true });
  }

  // --- evaluación ---
  if (route === 'GET /api/eval/config') return send(res, 200, { segments: SEGMENTS.map(({ label, questions, bonus }) => ({ label, questions, bonus })), maxScore: MAX_SCORE, passScore: PASS_SCORE });

  if (route === 'GET /api/eval/status') {
    const a = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);
    return send(res, 200, { attempt: a ? attemptView(a, a.status === 'done') : null });
  }

  if (route === 'POST /api/eval/spin') {
    const existing = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(user.id);
    if (existing) return send(res, 200, { attempt: attemptView(existing, existing.status === 'done'), alreadySpun: true });
    const segmentIndex = crypto.randomInt(SEGMENTS.length);
    const seg = SEGMENTS[segmentIndex];
    const ids = shuffle(QUESTIONS.map((q) => q.id)).slice(0, seg.questions);
    const { lastInsertRowid } = db.prepare('INSERT INTO attempts (user_id, segment_index, spin_label, num_questions, bonus, question_ids) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user.id, segmentIndex, seg.label, seg.questions, seg.bonus, JSON.stringify(ids));
    const a = db.prepare('SELECT * FROM attempts WHERE id = ?').get(Number(lastInsertRowid));
    return send(res, 201, { attempt: attemptView(a, false) });
  }

  if (route === 'POST /api/eval/submit') {
    // Primero el cuerpo, después leer y cerrar el intento sin ningún await de por medio: dos envíos
    // simultáneos (doble clic, red lenta) no pueden calificar dos veces el mismo intento.
    const body = await readBody(req);
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const a = db.prepare("SELECT * FROM attempts WHERE user_id = ? AND status = 'in_progress' ORDER BY id DESC LIMIT 1").get(user.id);
    if (!a) return send(res, 400, { error: 'No tienes una evaluación en curso.' });
    const ids = JSON.parse(a.question_ids);
    const clean = {};
    let correct = 0;
    for (const id of ids) {
      const v = answers[id];
      if (Number.isInteger(v) && v >= 0 && v <= 3) { clean[id] = v; if (byId.get(id)?.answer === v) correct++; }
    }
    const score = Math.min(MAX_SCORE, Math.round(((correct / ids.length) * MAX_SCORE + a.bonus) * 10) / 10);
    const { changes } = db.prepare("UPDATE attempts SET answers = ?, correct = ?, score = ?, status = 'done', finished_at = datetime('now') WHERE id = ? AND status = 'in_progress'")
      .run(JSON.stringify(clean), correct, score, a.id);
    if (changes !== 1) return send(res, 400, { error: 'No tienes una evaluación en curso.' });
    return send(res, 200, { attempt: attemptView(db.prepare('SELECT * FROM attempts WHERE id = ?').get(a.id), true) });
  }

  // --- administración ---
  if (url.pathname.startsWith('/api/admin/')) {
    if (user.role !== 'admin') return send(res, 403, { error: 'Solo el administrador puede ver esta sección.' });

    if (route === 'GET /api/admin/overview') {
      const students = db.prepare(`
        SELECT u.id, u.name, u.created_at, u.last_login,
          (SELECT COUNT(*) FROM logins l WHERE l.user_id = u.id) AS logins,
          (SELECT COUNT(*) FROM verified_laws v WHERE v.user_id = u.id) AS verified,
          a.id AS attempt_id, a.spin_label, a.num_questions, a.bonus, a.correct, a.score, a.status, a.started_at, a.finished_at
        FROM users u
        LEFT JOIN attempts a ON a.id = (SELECT MAX(id) FROM attempts WHERE user_id = u.id)
        WHERE u.role = 'student'
        ORDER BY COALESCE(u.last_login, u.created_at) DESC`).all();
      const activity = db.prepare(`
        SELECT l.kind, l.at, u.name FROM logins l JOIN users u ON u.id = l.user_id
        WHERE u.role = 'student' ORDER BY l.id DESC LIMIT 40`).all();
      return send(res, 200, { students, activity, passScore: PASS_SCORE });
    }

    const reset = url.pathname.match(/^\/api\/admin\/attempts\/(\d+)$/);
    if (reset && req.method === 'DELETE') {
      db.prepare('DELETE FROM attempts WHERE id = ?').run(Number(reset[1]));
      return send(res, 200, { ok: true });
    }

    if (route === 'GET /api/admin/export.csv') {
      const rows = db.prepare(`
        SELECT u.name, u.created_at, u.last_login, (SELECT COUNT(*) FROM logins l WHERE l.user_id = u.id) AS logins,
          a.spin_label, a.num_questions, a.correct, a.bonus, a.score, a.status, a.finished_at
        FROM users u LEFT JOIN attempts a ON a.id = (SELECT MAX(id) FROM attempts WHERE user_id = u.id)
        WHERE u.role = 'student' ORDER BY u.name`).all();
      // Anteponer ' a celdas que empiezan por = + - @ (o tab/CR) evita que Excel ejecute un nombre como fórmula.
      const esc = (v) => `"${String(v ?? '').replace(/^[=+\-@\t\r]/, "'$&").replace(/"/g, '""')}"`;
      const header = ['Nombre', 'Registro (UTC)', 'Último ingreso (UTC)', 'Ingresos', 'Ruleta', 'Preguntas', 'Aciertos', 'Bonus', 'Nota', 'Estado', 'Finalizó (UTC)'];
      const csv = '﻿' + [header, ...rows.map((r) => [r.name, r.created_at, r.last_login, r.logins, r.spin_label, r.num_questions, r.correct, r.bonus, r.score, r.status, r.finished_at])]
        .map((r) => r.map(esc).join(';')).join('\r\n');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="notas_app_derecho_comparado.csv"' });
      return res.end(csv);
    }
  }

  return send(res, 404, { error: 'Ruta no encontrada.' });
}

// ---------- estáticos ----------
function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Solicitud inválida'); }
  if (rel.includes('\0')) { res.writeHead(400); return res.end(); }
  if (rel === '/' || !path.extname(rel)) rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    // Base fija: una cabecera Host malformada no debe poder lanzar fuera del try (y tumbar el proceso).
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    if (e.status === 413) return send(res, 413, { error: e.message }, { Connection: 'close' });
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: 'Error interno del servidor.' });
    else res.destroy();
  }
});

// Última red de seguridad: un error inesperado se registra, pero no apaga el servidor en plena clase.
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));

// Limpieza periódica de sesiones vencidas.
setInterval(() => db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString()), 36e5).unref();

server.listen(PORT, () => console.log(`APP · Derecho comparado → http://localhost:${PORT}`));
