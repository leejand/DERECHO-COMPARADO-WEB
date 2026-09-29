// Base de datos SQLite (módulo nativo node:sqlite, sin dependencias externas).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(process.env.DB_PATH || path.join(DATA_DIR, 'app.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  name_key      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logins (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL DEFAULT 'login' CHECK (kind IN ('login', 'register')),
  at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attempts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  spin_label    TEXT NOT NULL,
  num_questions INTEGER NOT NULL,
  bonus         REAL NOT NULL DEFAULT 0,
  question_ids  TEXT NOT NULL,
  answers       TEXT,
  correct       INTEGER,
  score         REAL,
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'done')),
  started_at    TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at   TEXT
);

CREATE TABLE IF NOT EXISTS verified_laws (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  law_id     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, law_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_logins_user ON logins(user_id);
`);

// ---- Utilidades de contraseñas y nombres ----
function nameKey(name) {
  return String(name).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { hash, salt };
}

function checkPassword(password, user) {
  const { hash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex'));
}

// Versiones asíncronas para las peticiones HTTP: scrypt corre en el pool de hilos de libuv y no
// bloquea el event loop cuando muchos estudiantes se registran o ingresan a la vez (~35 ms por hash).
function hashPasswordAsync(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(String(password), salt, 64, (err, key) => (err ? reject(err) : resolve({ hash: key.toString('hex'), salt }))));
}

async function checkPasswordAsync(password, user) {
  const { hash } = await hashPasswordAsync(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex'));
}

// ---- Administrador inicial ----
function seedAdmin() {
  const exists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (exists) return;
  const user = process.env.ADMIN_USER || 'admin';
  // Sin ADMIN_PASSWORD se genera una clave aleatoria: nunca hay una contraseña conocida en el código.
  const pass = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const { hash, salt } = hashPassword(pass);
  db.prepare("INSERT INTO users (name, name_key, password_hash, salt, role) VALUES (?, ?, ?, ?, 'admin')")
    .run(user, nameKey(user), hash, salt);
  if (process.env.ADMIN_PASSWORD) console.log(`[db] Usuario administrador creado: "${user}" (contraseña definida en ADMIN_PASSWORD).`);
  else console.log(`[db] Usuario administrador creado: "${user}" · contraseña generada: ${pass}  (guárdela: no se volverá a mostrar)`);
}
seedAdmin();

module.exports = { db, nameKey, hashPassword, checkPassword, hashPasswordAsync, checkPasswordAsync };
