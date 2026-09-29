// Prueba de estrés sin dependencias: simula una clase completa usando la app al mismo tiempo.
//
//   npm run test:stress                      → 60 estudiantes contra un servidor temporal
//   STUDENTS=120 npm run test:stress         → más estudiantes
//   BASE=http://localhost:3000 ADMIN_PASSWORD=... npm run test:stress   → contra un servidor ya encendido
//
// Fases: 1) todos se registran a la vez, 2) todos vuelven a iniciar sesión a la vez,
// 3) flujo completo concurrente (normas, ruleta, envío) mientras el admin consulta panel y CSV.
// Una sonda consulta /api/auth/me cada 50 ms: su latencia máxima indica cuánto se bloqueó el servidor.
import { startServer, Client, ADMIN } from './helpers.mjs';

const N = Number(process.env.STUDENTS) || 60;
const ROUNDS = Number(process.env.ROUNDS) || 1;
const TIMEOUT = 30000;
const LAWS = ['ley-1508-2012', 'ley-80-1993', 'ley-1150-2007'];

const stats = new Map(); // etiqueta → { lat: [], errors: {} }
const record = (label, ms, err) => {
  if (!stats.has(label)) stats.set(label, { lat: [], errors: {} });
  const s = stats.get(label);
  if (err) s.errors[err] = (s.errors[err] || 0) + 1; else s.lat.push(ms);
};

async function timed(label, fn, okStatus = [200, 201]) {
  const t = performance.now();
  try {
    const r = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT))]);
    const ms = performance.now() - t;
    if (!okStatus.includes(r.status)) record(label, ms, `HTTP ${r.status}`); else record(label, ms);
    return r;
  } catch (e) {
    record(label, performance.now() - t, e.message === 'timeout' ? 'timeout' : `red: ${e.cause?.code || e.message}`);
    return null;
  }
}

const pct = (arr, p) => { if (!arr.length) return NaN; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.ceil((p / 100) * a.length) - 1)]; };
const fmt = (n) => (Number.isNaN(n) ? '—' : `${Math.round(n)} ms`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function studentFlow(base, i, round) {
  const c = new Client(base);
  const name = `Carga ${round}-${i} ${Date.now().toString(36)}`;
  const reg = await timed('1 registro', () => c.register(name));
  if (!reg) return null;
  return { c, name };
}

async function fullFlow({ c }) {
  await timed('3 config', () => c.get('/api/eval/config'));
  await timed('3 status', () => c.get('/api/eval/status'));
  for (const id of LAWS) await timed('3 verificar norma', () => c.post(`/api/laws/${id}/verify`));
  await timed('3 normas verificadas', () => c.get('/api/laws/verified'));
  const spin = await timed('3 girar ruleta', () => c.post('/api/eval/spin'));
  const a = spin?.data?.attempt;
  if (!a) return;
  await sleep(Math.random() * 300); // pequeño "tiempo de respuesta" desordena los envíos
  const answers = Object.fromEntries(a.questions.map((q) => [q.id, Math.floor(Math.random() * 4)]));
  const sub = await timed('3 enviar evaluación', () => c.post('/api/eval/submit', { answers }));
  if (sub?.data?.attempt?.status !== 'done') record('3 enviar evaluación', 0, 'nota no guardada');
  await timed('3 ver resultado', () => c.get('/api/eval/status'));
}

async function main() {
  let srv = null;
  let base = process.env.BASE;
  if (!base) {
    srv = await startServer({ port: 3935, name: 'stress' });
    base = srv.base;
  }
  console.log(`\nPrueba de estrés · ${N} estudiantes · ${ROUNDS} ronda(s) · ${base}\n`);

  // Sonda de disponibilidad: mide la latencia de una petición trivial durante toda la prueba.
  let probing = true;
  const probe = (async () => { while (probing) { await timed('sonda /api/auth/me', () => new Client(base).get('/api/auth/me')); await sleep(50); } })();

  const admin = new Client(base);
  const adminLogin = await timed('admin login', () => admin.login(process.env.ADMIN_USER || ADMIN.name, process.env.ADMIN_PASSWORD || ADMIN.password));
  if (adminLogin?.status !== 200) console.warn('⚠ No se pudo iniciar sesión como admin; se omiten sus consultas.');

  const t0 = performance.now();
  for (let round = 1; round <= ROUNDS; round++) {
    // Fase 1: registro simultáneo.
    const students = (await Promise.all(Array.from({ length: N }, (_, i) => studentFlow(base, i, round)))).filter(Boolean);

    // Fase 2: todos inician sesión a la vez (p. ej. al volver del descanso).
    await Promise.all(students.map((s) => timed('2 login simultáneo', () => new Client(base).login(s.name))));

    // Fase 3: flujo completo + admin consultando.
    let adminBusy = adminLogin?.status === 200;
    const adminLoop = (async () => {
      while (adminBusy) {
        await Promise.all([timed('admin panel', () => admin.get('/api/admin/overview')), timed('admin CSV', () => admin.get('/api/admin/export.csv'))]);
        await sleep(200);
      }
    })();
    await Promise.all(students.map(fullFlow));
    adminBusy = false;
    await adminLoop;
  }
  const total = performance.now() - t0;
  probing = false;
  await probe;

  // Verificación final: todos los estudiantes quedaron calificados.
  let graded = null;
  if (adminLogin?.status === 200) {
    const ov = await admin.get('/api/admin/overview');
    const mine = ov.data.students.filter((s) => s.name.startsWith('Carga '));
    graded = `${mine.filter((s) => s.status === 'done').length}/${mine.length}`;
  }
  const alive = srv ? srv.alive : (await new Client(base).get('/api/auth/me').then((r) => r.status === 200, () => false));

  const rows = [...stats.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, s]) => ({
    operación: label,
    ok: s.lat.length,
    errores: Object.entries(s.errors).map(([k, v]) => `${k}×${v}`).join(', ') || '0',
    p50: fmt(pct(s.lat, 50)), p95: fmt(pct(s.lat, 95)), p99: fmt(pct(s.lat, 99)), máx: fmt(s.lat.length ? Math.max(...s.lat) : NaN),
  }));
  console.table(rows);
  const errors = [...stats.values()].reduce((n, s) => n + Object.values(s.errors).reduce((a, b) => a + b, 0), 0);
  console.log(`Duración total: ${(total / 1000).toFixed(1)} s`);
  console.log(`Evaluaciones guardadas: ${graded ?? '— (sin admin)'}`);
  console.log(`Errores: ${errors}`);
  console.log(`Servidor vivo al final: ${alive ? 'sí' : 'NO'}`);
  if (srv && /Error|SQLITE_BUSY/i.test(srv.output)) console.log('\nSalida del servidor con errores:\n' + srv.output.split('\n').filter((l) => /Error|BUSY/i.test(l)).slice(0, 20).join('\n'));

  await srv?.stop();
  process.exitCode = errors || !alive ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exit(1); });
