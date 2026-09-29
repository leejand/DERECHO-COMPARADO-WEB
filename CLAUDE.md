# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Plataforma web interactiva (en español) basada en el trabajo académico *Las Asociaciones Público-Privadas (APP)… Colombia, Francia y Estados Unidos* (Yury Carolina Ochoa Álvarez, 2026). Los estudiantes se registran, leen el contenido, marcan normas como verificadas y presentan una evaluación con ruleta; un administrador ve resultados y exporta CSV.

**Cero dependencias en tiempo de ejecución**: solo módulos nativos de Node (`node:http`, `node:sqlite`, `node:crypto`); `npm start` no necesita `npm install`. La única devDependency es Playwright (solo para `test:e2e`). No hay bundler, framework ni linter. No añadas dependencias sin que se pida.

## Comandos

```bash
npm start          # http://localhost:3000 (PORT para cambiar el puerto)
npm run dev        # igual, con --watch (reinicia al cambiar archivos del servidor)
node --check public/js/app.js   # verificación de sintaxis (no hay linter)
npm test                        # unitarias + integración de la API (node:test, sin dependencias)
npm run test:e2e                # Playwright/Chromium (requiere npm install)
npm run test:stress             # carga: STUDENTS=150 para más estudiantes simultáneos
node --test --test-name-pattern="doble clic" "tests/unit/*.test.mjs"   # una sola prueba
```

- Requiere Node ≥ 22.13 (`node:sqlite`). La bandera `--disable-warning=ExperimentalWarning` silencia el aviso de SQLite experimental.
- Variables de entorno: `PORT`, `DB_PATH` (por defecto `data/app.db`), `ADMIN_USER` / `ADMIN_PASSWORD` (solo se leen al crear el admin en el **primer arranque**; admin por defecto `admin` / `Admin-APP-2026`). Para regenerar la base, borra `data/app.db*`.
- Cada prueba arranca su propio `server.js` como proceso hijo con `DB_PATH` en `tests/.tmp/` (helpers en `tests/helpers.mjs`); nunca usan `data/app.db`, que además está en `.gitignore` (tiene datos reales de estudiantes).
- Los cambios en `public/` no requieren reiniciar el servidor (se sirven con `Cache-Control: no-cache`).

## Arquitectura

**Backend (`server.js`)** — un único `http.createServer`. Todo lo que empieza por `/api/` pasa por la función `api()`, que es una cadena de `if (route === 'MÉTODO /ruta')` (más algunas regex para rutas con parámetros). El orden importa: las rutas `/api/auth/*` van antes de la comprobación `if (!user) return 401`, y las `/api/admin/*` están tras la verificación de `role === 'admin'`. Cualquier otra ruta sin extensión devuelve `index.html` (SPA).

**Base de datos (`src/db.js`)** — crea el esquema con `CREATE TABLE IF NOT EXISTS` al importarse (no hay migraciones: para cambiar columnas de una tabla existente hay que usar `ALTER TABLE` a mano o borrar la base) y siembra el admin. Los usuarios se identifican por `name_key` (nombre normalizado sin tildes, minúsculas), no por email. Contraseñas con scrypt + sal: el servidor usa las versiones asíncronas (`hashPasswordAsync`/`checkPasswordAsync`) para no bloquear el event loop cuando toda la clase entra a la vez; las síncronas quedan para el seed y los tests; sesiones con cookie `sid` HttpOnly de 7 días.

**Evaluación — la lógica sensible vive en el servidor:**
- `src/questions.js` es el banco de preguntas con `answer` (índice 0–3) y `explain`. **Nunca** debe cargarse en el navegador; `attemptView(a, withSolutions)` solo incluye respuestas cuando el intento está `done`.
- El giro de la ruleta (`SEGMENTS` en `server.js`) se sortea en el servidor; el frontend recibe la configuración por `GET /api/eval/config` y solo anima hasta `segmentIndex`. Si cambias `SEGMENTS`, el dibujo de la ruleta se adapta porque se genera desde la API.
- Un intento por estudiante (el admin lo reinicia borrando el intento). El envío es atómico (`UPDATE … AND status = 'in_progress'` y se comprueba `changes`), así que un doble envío simultáneo solo cuenta una vez. Nota = aciertos/total × 5 + bonus, tope 5,0; aprueba con 3,0.

**Frontend (`public/`)** — SPA sin dependencias con hash routing (`#/inicio`, `#/normativa/:lawId`, etc.).
- `public/js/content.js` se carga como script clásico y define **globales** (`COUNTRIES`, `LAWS`, `STAGES`, `COMPARISON`, `CASES`, …) con todo el contenido académico. Para editar textos, normas o etapas se toca este archivo, no `app.js`.
- `public/js/app.js` es un IIFE con: helper `api()`, `state` global, funciones `render*` por vista (que escriben `view.innerHTML` con template strings; escapa siempre datos dinámicos con `esc()`), efectos visuales y el `route()` al final, que mapea sección → `render*` y exige sesión salvo en `ingresar`/`registro`.
- Los `id` de `LAWS` se usan como `law_id` en la tabla `verified_laws` y en la ruta `/api/laws/:id/verify`, que solo acepta `[a-z0-9-]{1,60}`. No renombres ids existentes (se perderían las marcas guardadas).
- El color de cada país sale de `COUNTRIES[k].color` en `content.js` (co amarillo, fr azul, us rojo) y el de cada etapa de `STAGES[i].color`; en `app.js` se convierte con `bgClass(color)`, que añade `on-dark` (texto claro) a los fondos oscuros `blue` e `ink`. No repitas el mapeo país → color a mano.
- Scroll suave con inercia propio: la rueda solo se cede al navegador en contenedores que realmente se desplazan en vertical (`innerScrollsY`) o marcados con `data-native-scroll`; si no, el bucle de inercia pisa el scroll nativo (fue el bug del panel admin).
- `route()` usa un contador `navSeq` para descartar vistas lentas si el usuario ya navegó a otra sección; las vistas asíncronas nuevas deben respetarlo.
- Anclas internas sin `/` inicial (p. ej. `#stage-pre`) se ignoran en el router a propósito.

## Diseño

Estética inspirada en history.jailhouselawyers.org: bloques de color planos con la paleta de las banderas, definida en `:root` de `styles.css` (`--yellow` Colombia, `--blue`/`--red`/`--paper` Francia y EE. UU., `--ink` azul marino como tinta), tipografía display condensada (Anton), títulos que aparecen palabra por palabra (clase `.wsplit`), cursor con `mix-blend-mode: difference` (el encabezado y el riel inferior ya no lo usan: `updateTones()` en `app.js` mide el fondo detrás de ellos y elige texto marino o blanco), secciones sticky con scroll horizontal, cortina de transición entre vistas. Todos los efectos deben respetar `prefers-reduced-motion`. La interfaz y los mensajes de error de la API están en español.
