# APP · Derecho comparado

Plataforma web interactiva basada en el trabajo *Las Asociaciones Público-Privadas (APP). Etapas precontractual, contractual y postcontractual. Un estudio de derecho comparado: Colombia, Francia y Estados Unidos* (Yury Carolina Ochoa Álvarez, 2026).

## Requisitos

- Node.js 22.13 o superior (usa el módulo nativo `node:sqlite`; **no requiere `npm install`**).

## Ejecutar

```bash
npm start
```

Abrir <http://localhost:3000>. El puerto se cambia con la variable `PORT`.

## Administrador

El usuario administrador (`admin`, o el valor de `ADMIN_USER`) se crea en el **primer arranque**, cuando aún no existe la base de datos. Su contraseña se toma de la variable `ADMIN_PASSWORD`:

```powershell
$env:ADMIN_PASSWORD = "<su-clave>"; npm start
```

Si no se define `ADMIN_PASSWORD`, se genera una contraseña aleatoria y se muestra **una sola vez** en la consola. Guárdela. Estas variables solo se leen al crear la base; para empezar de cero, borre `data/app.db*`.

## Secciones

| Ruta | Contenido |
|------|-----------|
| `#/ingresar`, `#/registro` | Inicio de sesión y registro con nombre + contraseña |
| `#/inicio` | Sección informativa: qué es una APP, para qué sirve, elementos, obra pública vs. APP, países, cuadro comparativo, conclusiones |
| `#/normativa` | 27 normas y sentencias con filtros, ficha de artículos clave, enlace a la fuente oficial y marca de "verificada" |
| `#/etapas` | Precontractual, contractual y postcontractual en los tres países |
| `#/evaluacion` | Ruleta (5, 8, 10 preguntas o BONUS: 5 preguntas + 0,5), cuestionario y nota de 0,0 a 5,0 (aprueba con 3,0) |
| `#/admin` | Solo admin: estudiantes, ingresos, normas verificadas, resultado de la ruleta, aciertos, nota, exportación CSV y reinicio de evaluaciones |

## Base de datos (`data/app.db`, SQLite)

- `users` — nombre, contraseña (scrypt + sal), rol, fecha de registro, último ingreso
- `sessions` — sesiones con cookie HttpOnly (7 días)
- `logins` — historial de cada registro e ingreso
- `attempts` — giro de la ruleta, preguntas asignadas, respuestas, aciertos, bonus y nota
- `verified_laws` — normas que cada estudiante marcó como verificadas

La ruleta y la calificación se resuelven en el servidor: el navegador nunca recibe las respuestas correctas antes de enviar. Cada estudiante tiene un solo giro; el administrador puede reiniciarlo.

## Pruebas

Cada prueba arranca su propio `server.js` con una base temporal en `tests/.tmp/`: nunca toca `data/app.db`. Puertos usados: 3923 (API), 3930 (e2e) y 3935 (estrés).

```bash
npm test               # unitarias + integración de la API (node:test, sin dependencias)
npm run test:e2e       # extremo a extremo en Chromium (requiere npm install)
npm run test:stress    # carga: 60 estudiantes simultáneos + consultas del admin
```

- Una sola prueba: `node --test --test-name-pattern="doble clic" "tests/unit/*.test.mjs"`.
- Para el e2e, `npm install` instala Playwright (solo para pruebas: `npm start` sigue sin dependencias). Si falta el navegador: `npx playwright install chromium`.
- Estrés con más estudiantes: `STUDENTS=150 npm run test:stress` (en PowerShell: `$env:STUDENTS=150; npm run test:stress`). Contra un servidor ya encendido: `BASE=http://localhost:3000 ADMIN_PASSWORD=<clave> npm run test:stress` (crea estudiantes «Carga …» en esa base: no lo use contra la base real de la clase).

| Archivo | Qué cubre |
|---------|-----------|
| `tests/unit/db.test.mjs` | `nameKey`, hash y verificación de contraseñas (síncronas y asíncronas), esquema, administrador inicial, restricciones y cascadas |
| `tests/unit/api.test.mjs` | Registro, ingreso, sesión y cookie, permisos 401/403, normas, ruleta (un giro, sin filtrar respuestas), calificación y bonus, envíos simultáneos, panel admin, CSV, estáticos, path traversal y entradas malformadas |
| `tests/e2e/flujo.test.mjs` | Estudiante: registro, inicio, normativa, etapas, evaluación completa; admin: panel, CSV, reinicio y desplazamiento; vista móvil sin desbordes; errores de JavaScript |
| `tests/stress.mjs` | Registro e ingreso simultáneos, flujo completo concurrente y latencias p50/p95/p99 |

## Estructura

```
server.js            API REST + archivos estáticos
src/db.js            Esquema SQLite y usuario administrador
src/questions.js     Banco de 40 preguntas (con respuestas y explicaciones)
public/index.html    Página única
public/css/styles.css
public/js/content.js Contenido del trabajo (normas, etapas, cuadro comparativo)
public/js/app.js     Enrutador, vistas, efectos, ruleta y panel admin
```

## Diseño

Inspirado en <https://history.jailhouselawyers.org/>: bloques de color planos con los colores de las banderas (amarillo de Colombia; azul, blanco y rojo de Francia y EE. UU.; marino como tinta), tipografía display condensada, scroll suave con inercia, títulos que aparecen palabra por palabra, cursor con mezcla *difference*, secciones sticky con desplazamiento horizontal, menú de tarjetas con revelado circular, cortina de transición, riel de navegación inferior y trazos dibujados a mano. Los efectos se desactivan con `prefers-reduced-motion`.
