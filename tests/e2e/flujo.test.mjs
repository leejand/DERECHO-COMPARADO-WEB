// Pruebas de extremo a extremo con Playwright: un estudiante y la administradora usan la app real.
// Requiere `npm install` (devDependency playwright) y el navegador Chromium de Playwright
// (`npx playwright install chromium` si no está descargado).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { startServer, ADMIN } from '../helpers.mjs';

const PASSWORD = 'clave-e2e-1';
const STUDENT = `Estudiante E2E ${Date.now().toString(36)}`;
const pageErrors = [];

let srv, browser, student, adminCtx;

function watch(page, who) {
  page.on('pageerror', (e) => pageErrors.push(`[${who}] ${e.message}`));
  // Los 401/409 de un login fallido o un nombre repetido son respuestas esperadas, no errores de la página.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource.* (401|409) /.test(m.text())) pageErrors.push(`[${who}] console: ${m.text()}`); });
  page.on('dialog', (d) => d.accept()); // confirmaciones de enviar / reiniciar
  return page;
}

async function newPage(opts = {}, who = 'estudiante') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', acceptDownloads: true, ...opts });
  return watch(await ctx.newPage(), who);
}

async function register(page, name) {
  await page.goto(srv.base + '/#/registro');
  await page.fill('#authForm input[name=name]', name);
  await page.fill('#authForm input[name=password]', PASSWORD);
  await page.fill('#authForm input[name=confirm]', PASSWORD);
  await page.click('#authForm button[type=submit]');
  await page.waitForURL(/#\/inicio$/);
}

const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

before(async () => {
  srv = await startServer({ port: 3930, name: 'e2e' });
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await srv?.stop();
});

test('la validación del formulario muestra errores sin llamar a la API', async () => {
  const page = await newPage({}, 'validación');
  await page.goto(srv.base + '/#/registro');
  await page.fill('#authForm input[name=name]', 'Nombre Prueba');
  await page.fill('#authForm input[name=password]', 'abcd');
  await page.fill('#authForm input[name=confirm]', 'abce');
  await page.click('#authForm button[type=submit]');
  await assert.doesNotReject(page.waitForFunction(() => document.querySelector('#authError').textContent.trim().length > 0));
  await page.goto(srv.base + '/#/ingresar');
  await page.fill('#authForm input[name=name]', 'Nadie Registrado');
  await page.fill('#authForm input[name=password]', 'clave-mala');
  await page.click('#authForm button[type=submit]');
  await page.waitForFunction(() => /incorrect/i.test(document.querySelector('#authError').textContent));
  assert.match(page.url(), /#\/ingresar$/);
  await page.context().close();
});

test('sin sesión, cualquier ruta redirige a ingresar', async () => {
  const page = await newPage({}, 'anónimo');
  await page.goto(srv.base + '/#/admin');
  await page.waitForURL(/#\/ingresar$/);
  await page.context().close();
});

test('registro del estudiante y recorrido por el inicio', async () => {
  student = await newPage();
  await register(student, STUDENT);
  await student.waitForSelector('#contexto');
  for (const id of ['#elementos', '#obra', '#paises', '#comparativo', '#conclusiones']) assert.ok(await student.$(id), `falta la sección ${id}`);
  await student.click('#fullTableBtn');
  await student.waitForSelector('#fullTable:not([hidden])');
});

test('normativa: abrir la ficha y marcarla como verificada', async () => {
  await student.goto(srv.base + '/#/normativa');
  await student.waitForSelector('.law-card');
  const total = await student.$$eval('.law-card', (els) => els.length);
  assert.ok(total >= 20, `solo hay ${total} normas`);
  await student.click('.law-card >> nth=0');
  await student.waitForSelector('#verifyBtn');
  await student.click('#verifyBtn');
  await student.waitForFunction(() => /Verificada/i.test(document.querySelector('#verifyBtn').textContent));
  await student.click('[data-close]');
  await student.waitForURL(/#\/normativa$/);
  // Tras recargar, la marca se conserva (viene del servidor).
  await student.reload();
  await student.click('.law-card >> nth=0');
  await student.waitForFunction(() => /Verificada/i.test(document.querySelector('#verifyBtn')?.textContent || ''));
  await student.click('[data-close]');
});

test('etapas: se muestran las tres etapas', async () => {
  await student.goto(srv.base + '/#/etapas');
  for (const id of ['#stage-pre', '#stage-con', '#stage-post']) await student.waitForSelector(id, { state: 'attached' });
});

test('evaluación completa: girar, responder, enviar y ver la nota', async () => {
  await student.goto(srv.base + '/#/evaluacion');
  await student.click('#spinBtn');
  await student.click('#startQuiz', { timeout: 15000 });
  await student.waitForSelector('.qdot');
  const total = await student.$$eval('.qdot', (els) => els.length);
  assert.ok([5, 8, 10].includes(total), `número de preguntas inesperado: ${total}`);

  for (let k = 0; k < total; k++) {
    await student.waitForFunction((n) => document.querySelector('.qdot.current')?.dataset.k === String(n), k);
    await student.click('.option >> nth=1');
    await student.waitForFunction((n) => document.querySelectorAll('.qdot.answered').length >= n + 1, k);
    if (k < total - 1) {
      // La app avanza sola; si no lo hace, se usa «Siguiente».
      const advanced = await student.waitForFunction((n) => document.querySelector('.qdot.current')?.dataset.k === String(n + 1), k, { timeout: 2000 }).then(() => true, () => false);
      if (!advanced) await student.click('#nextQ');
    }
  }
  await student.click('#submitQ');
  await student.waitForSelector('.score-num', { timeout: 15000 });
  const score = await student.textContent('.score-num');
  assert.match(score, /\d,\d/);

  // Recargar muestra el mismo resultado (no permite repetir).
  await student.reload();
  await student.waitForSelector('.score-num', { timeout: 15000 });
  assert.equal((await student.textContent('.score-num')).trim(), score.trim());
});

test('admin: ve al estudiante, descarga el CSV y reinicia su evaluación', async () => {
  const page = await newPage({ viewport: { width: 1440, height: 900 } }, 'admin');
  adminCtx = page.context();
  await page.goto(srv.base + '/#/ingresar');
  await page.fill('#authForm input[name=name]', ADMIN.name);
  await page.fill('#authForm input[name=password]', ADMIN.password);
  await page.click('#authForm button[type=submit]');
  await page.waitForURL(/#\/admin$/);
  const row = page.locator('#adminRows tr', { hasText: STUDENT });
  await row.waitFor();
  assert.match(await row.textContent(), /Terminada/);

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('a[href="/api/admin/export.csv"]')]);
  const csv = fs.readFileSync(await download.path(), 'utf8');
  assert.ok(csv.includes(STUDENT), 'el CSV no incluye al estudiante');

  // El panel debe poder desplazarse hasta el final de la tabla.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => window.scrollY > 0), 'el panel admin no se desplaza');

  await row.locator('[data-reset]').click();
  await page.locator('#adminRows tr', { hasText: STUDENT }).filter({ hasText: /Sin iniciar/ }).waitFor();

  // El estudiante puede volver a girar.
  await student.goto(srv.base + '/#/evaluacion');
  await student.reload();
  await student.waitForSelector('#spinBtn:not([disabled])');
});

test('móvil (390×844): registro, menú y sin desbordamiento horizontal', async () => {
  const page = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'móvil');
  await register(page, `Estudiante Móvil ${Date.now().toString(36)}`);
  assert.ok(await noHorizontalScroll(page), 'el inicio desborda en horizontal');
  await page.click('#menuBtn');
  await page.click('.menu-card[href="#/normativa"]');
  await page.waitForURL(/#\/normativa$/);
  await page.waitForSelector('.law-card');
  assert.ok(await noHorizontalScroll(page), 'la normativa desborda en horizontal');
  await page.click('.law-card >> nth=0');
  await page.waitForSelector('#verifyBtn');
  await page.click('[data-close]');
  await page.goto(srv.base + '/#/evaluacion');
  await page.waitForSelector('#spinBtn');
  assert.ok(await noHorizontalScroll(page), 'la evaluación desborda en horizontal');
  await page.context().close();
});

test('cerrar sesión vuelve a la pantalla de ingreso', async () => {
  await student.goto(srv.base + '/#/inicio');
  await student.click('#menuBtn');
  await student.click('#logoutBtn');
  await student.waitForURL(/#\/ingresar$/);
  await student.goto(srv.base + '/#/evaluacion');
  await student.waitForURL(/#\/ingresar$/);
});

test('sin errores de JavaScript en el navegador', () => {
  assert.deepEqual(pageErrors, []);
});
