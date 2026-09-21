# CrESI Play

Plataforma de actividades y juegos de **Educación Sexual Integral (ESI)** para
alumnos, con un **panel docente** para armar clases, trivias y lecciones y
seguir el progreso. Producción: <https://jugar.cresi.com.ar>.

**Stack:** Next.js 16 (App Router) · React 18 · Firebase (Auth + Firestore) ·
Tailwind CSS · desplegado en Vercel.

## Empezar

Requisitos: **Node 22.x** (lo exige `firebase-admin` 14; con un Node más viejo
las rutas de `/api` se caen al cargar) y, solo para las pruebas de reglas y de
sesión, **Java** (los emuladores de Firebase corren en la JVM).

```bash
npm ci
cp .env.example .env.local   # y completalo (ver abajo)
npm run dev                  # http://localhost:3000
```

> Este Next.js **no es el que quizá conozcas**: `next lint` ya no existe (se usa
> `npm run lint`) y `middleware` se llama `proxy`. Ante la duda, leé `node_modules/next/dist/docs/`
> (ver `AGENTS.md`).

## Variables de entorno

Todas están documentadas, con cómo generarlas, en [`.env.example`](.env.example).
Las obligatorias en producción:

| Variable | Para qué | Si falta |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6) | Firebase en el navegador | el sitio no inicia |
| `FIREBASE_ADMIN_PROJECT_ID`, `_CLIENT_EMAIL`, `_PRIVATE_KEY` | Firebase Admin en las rutas de `/api` | `session`, `sync-score`, `join-class`, `pending-students`, `delete-account` fallan |
| `SESSION_SECRET` | firma la cookie de sesión del servidor | las páginas docentes muestran "no pudimos verificarla" |
| `PENDING_PASSWORD_KEY` | cifra las contraseñas de los alumnos del docente | no se pueden crear ni ver esas contraseñas |
| `JWT_SECRET` | firma los certificados de trivia | `/api/certificado` falla |
| `HEALTH_TOKEN` *(opcional)* | habilita `/api/health?deep=1` | solo queda la comprobación superficial |

⚠️ **`PENDING_PASSWORD_KEY` no se puede perder ni cambiar**: las contraseñas ya
cifradas con la anterior dejan de poder leerse. Guardala también fuera de Vercel.

En Vercel las variables nuevas **solo aplican a los despliegues siguientes**:
después de cargarlas hay que volver a desplegar.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` / `build` / `start` | desarrollo / compilar / servir el build |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (el CI lo corre antes que nada) |
| `npm run check:lock` | comprueba el `package-lock.json` con **npm 10**, el que trae Node 22 y usa el CI. Correlo después de tocar dependencias: npm 11 (Windows) puede dejar el lock sin paquetes opcionales de otras plataformas y `npm ci` falla en Linux con "Missing: … from lock file"; se arregla con `npx npm@10 install --package-lock-only` |
| `npm run lint` | ESLint 9 con la config oficial de Next 16 (`eslint.config.mjs`). Falla con **errores** o si **sube** el tope de avisos de `package.json` (`--max-warnings`): los avisos actuales se corrigen de a poco y el tope solo puede bajar |
| `npm test` | tests unitarios (Vitest, sin dependencias externas) |
| `npm run test:rules` | reglas de Firestore contra el emulador (necesita Java): `tests/rules/firestore.rules.test.mjs` (usuarios, puntaje, pendientes, lecciones) y `tests/rules/collections.rules.test.mjs` (contenido, clases, tareas y entregas, salas sin login, todo lo demás cerrado). **Al tocar `firestore.rules`, agregá su prueba** |
| `npm run test:browser:prod` | las mismas pruebas de navegador pero contra un **build de producción** (`next build && next start`): la política de seguridad de contenido es otra que en desarrollo, y esto prueba el sitio con la que recibe el público |
| `npm run test:session` | sesión del servidor de punta a punta: `next dev` real + emuladores de Auth y Firestore (necesita Java; la primera compilación tarda) |
| `npm run test:browser` | pruebas en **Chromium real** (Playwright) contra `next dev` y los emuladores, con las reglas reales de Firestore: panel docente (crear/duplicar/editar/borrar trivias, nube de palabras, trivia en vivo, completa palabras), ingreso de alumnos y errores de hidratación. Necesita Java y `npx playwright install chromium` |

El CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) corre todos en cada
push y pull request, y además compila producción y comprueba que los ganchos de
prueba (ver abajo) no estén en el JavaScript público (`scripts/check-bundle.sh`).

### Sobre las pruebas en navegador

- Los docentes entran con un popup de Google, que un test no puede recorrer. Con
  `NEXT_PUBLIC_E2E_EMULATORS=1` (que **solo** fija `playwright.config.ts`) el
  navegador se conecta a los emuladores y expone `window.__cresiE2E` para iniciar
  sesión con un token de prueba. `next.config.js` fija esa variable en `'0'` por
  defecto, así que en producción esos ganchos **no existen** (el CI lo vigila).
- `.env.local` tiene credenciales REALES de Firebase: `tests/browser/global-setup.ts`
  se niega a correr si no están los emuladores. Usá siempre `npm run test:browser`.
- Corren en `http://localhost` y no en `127.0.0.1`: Next 16 bloquea con 403 los
  recursos de desarrollo pedidos desde otro host.
- Las búsquedas de texto justo después de navegar usan `.filter({ visible: true })`:
  la transmisión progresiva del servidor puede dejar un instante una copia oculta
  del contenido, y un `getByText` a secas fallaría por "strict mode".
- El aviso de cookies queda fijo abajo y tapa botones hasta que se decide;
  `tests/browser/fixtures.ts` ya lo deja resuelto.

## Cómo está armado

```
app/
  (routes)/…        juegos y actividades del alumno (trivias, lecciones, pasapalabras…)
  docente/…         panel docente (trivias, completapalabras, nube de palabras, trivia en vivo)
  api/              rutas de servidor (usan Firebase Admin)
components/         componentes compartidos (components/teacher/… para el panel docente)
lib/                lógica de negocio y servicios (Firestore, sesión, cifrado…)
firestore.rules     reglas de seguridad de Firestore
tests/              pruebas de reglas (tests/rules) y de punta a punta (tests/e2e)
scripts/            mantenimiento: migraciones, carga de contenido, monitoreo
```

**Rutas de API** (`app/api/`): `session` (cookie de sesión), `sync-score`
(puntaje del alumno), `join-class` (ingreso con código), `pending-students`
(alumnos que arma el docente), `certificado`, `delete-account`, `health`,
`track` (contadores públicos), `csp-report`.

### Decisiones de seguridad que conviene conocer

- **Los contadores públicos los suma el servidor.** Partidas de una trivia,
  "veces completada" de una lección, descargas y "en qué se equivocan más" ya no
  se escriben desde el navegador (las reglas lo prohíben, antes lo permitían a
  cualquiera sin login): van a `/api/track`, que solo suma +1 sobre documentos
  existentes, valida ids e índices y corta por IP y elemento (en memoria, mejor
  esfuerzo). Un contador que no suma nunca rompe el juego. `web` ya sumaba sus
  descargas por su cuenta.

- **El puntaje lo valida el servidor.** El cliente no puede escribir
  `game.totalScore` (lo prohíben las reglas): lo manda a `/api/sync-score`, que
  acota cuánto puede subir según el tiempo transcurrido (cubeta de fichas). El
  progreso que se copia a la clase tampoco puede superar el puntaje validado.
- **Sesión en el servidor.** Al iniciar sesión el navegador pide una cookie
  firmada (`cresi_session`, 2 h) a `/api/session`; las páginas de servidor la
  leen con `getSession()` (`lib/session.ts`). **La cookie dice quién es el
  usuario, no qué puede hacer:** toda consulta con el Admin SDK ignora las
  reglas de Firestore, así que tiene que filtrar por `session.uid` ella misma.
  Las rutas que cambian datos usan el token de Firebase en la cabecera
  `Authorization`, no la cookie (evita CSRF).
- **La sesión se puede revocar.** Además de la firma y el vencimiento (2 h), cada
  lectura de la cookie consulta a Firebase Auth si el usuario fue **revocado,
  deshabilitado o borrado** (`lib/sessionRevocation.ts`, con caché de 60 s por
  instancia: `SESSION_REVOCATION_TTL_MS`). Ante una cuenta comprometida:
  `npx tsx scripts/revoke-sessions.ts <uid> --apply` (y `--disable` para cortar
  también los ID tokens ya emitidos, que duran hasta 1 h en las rutas de `/api`).
  Si Firebase Auth no responde, se deja pasar (no se deja afuera a todos los docentes).
- **Los alumnos con código de clase no usan funciones de docente.** `/api/join-class`
  les pone la marca `student` en el token de Firebase (firmada, no la pueden
  quitar): las reglas les impiden crear clases, trivias, lecciones y salas, y las
  páginas del panel docente les muestran "solo para docentes" sin traer datos. Los
  alumnos que ya estaban logueados antes de este cambio no tienen la marca hasta que
  vuelvan a entrar con su código.
- **Encabezados de seguridad** (`lib/securityHeaders.js`, aplicados en `next.config.js`):
  `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, y `Permissions-Policy`
  que cierra cámara, micrófono, geolocalización y pagos (el sitio no los usa). La
  **política de contenido (CSP)** está en modo **solo observación**: no bloquea
  nada, informa a `/api/csp-report` y se registra en el log `CSP (observación): …`
  (una línea por combinación). Cuando el log lleve unos días sin cosas legítimas
  (AdSense abre muchos dominios), se pasa a modo que **bloquea** con la variable
  `CSP_ENFORCE=1` en Vercel + redesplegar; volver atrás es quitarla. No hay COOP
  (rompe el popup de Google) ni HSTS (lo pone Vercel).
- **Contraseñas de alumnos cifradas** (AES-256-GCM, `lib/passwordCrypto.ts`). El
  docente puede verlas pidiéndolas al servidor; nunca viajan con los datos de la clase.
- **Límite de intentos en `/api/join-class`, persistente.** Los intentos
  fallidos se cuentan en Firestore (colección `rateLimits`, solo del servidor),
  así los comparten todas las instancias de Vercel. Se limita por usuario
  (10 fallos / 10 min: es lo que protege una cuenta, porque una contraseña puede
  tener 3 caracteres), por IP + clase (30), por IP (60, contra el escaneo de
  códigos) y por clase (150). Los topes altos son a propósito: en un colegio
  toda la clase sale por la misma IP. Ajustables en `lib/joinClassLimits.ts`.
  *Opcional:* en la consola de Firestore → TTL, crear una política sobre la
  colección `rateLimits` con el campo `expiresAt` para que los contadores viejos
  se borren solos (sin ella no molestan, solo ocupan un poco de espacio).
- **Reglas de Firestore.** Además de lo anterior: el **autor** de un contenido (trivia, lección, completa palabras) solo lo cambia el admin (si no, un docente podría hacer pasar su contenido por oficial, `author == 'CRESI'`, ante todos los alumnos); y en las **entregas** el alumno no puede escribir la nota ni la devolución del docente ni apuntarla a otra clase. Ojo: hay **dos vocabularios** para las entregas porque escriben dos apps (`grade`/`feedback`/`classroomId` en cresi-play; `calificacion`/`comentarios`/`claseId` en `classroom`); las reglas cubren los dos.
- **El "rol" docente sigue en `localStorage`** y no es de confianza: la
  autorización real es de propiedad (`classrooms.profesorId`, `author == uid`)
  en las reglas y en las rutas.
- **Progreso de actividades:** todas las pantallas usan `recordActivityProgress`
  (`lib/activityProgress.ts`); no armes `activityScores` / `completedActivities` a mano.

## Retención y métricas

**Racha diaria** (`lib/dailyStreak.ts`, funciones puras con tests). Cuenta los
días en que la persona *juega* (suma puntos o termina una actividad; abrir la
página no cuenta). Los fines de semana no la cortan (`FORGIVE_WEEKENDS`), porque
el uso es sobre todo en clase. Se guarda en `progress.activityStreak` y se copia
a `game.streak`, que es lo que lee el panel del docente. Antes `game.streak`
era la racha del registro de ánimo: el MoodTracker ahora calcula la suya aparte
(`UserDataManager.getMoodStreak`).

**Reto del día** (`lib/dailyChallenge.ts`). Una actividad repetible que sale de
la fecha (igual para todos, sin servidor) y respeta las actividades que el
docente habilitó a la clase. Cumplirlo marca un tilde y suma a "retos
cumplidos"; a propósito no da puntos ni vidas, porque cada juego es dueño de
los suyos y pisaría el premio.

**Pantalla final "qué sigue"** (`components/ActivityFinishedSheet.tsx`). Todas
las pantallas de juego avisan al terminar con `reportActivityFinished`
(`lib/activityFinished.ts`), que registra la analítica, cuenta el día, revisa el
reto y muestra una tarjeta con la racha y qué hacer ahora. Para una actividad
nueva alcanza con llamar a esa función al terminar (con `silent: true` si no
debe mostrar la tarjeta, por ejemplo dentro de una tarea).

**Eventos de Google Analytics** (solo de quien aceptó cookies):

| Evento | Qué mide |
|---|---|
| `activity_completed` | primera vez que se completa una actividad (`activity_title`) |
| `activity_finished` | cada vez que se termina una actividad (`first_time`) |
| `trivia_completed` / `trivia_abandoned` | fin de una trivia, o en qué pregunta se fue (`question`, `of`) |
| `streak_day`, `streak_milestone` | un día más de racha (`days`, `status`) y los hitos de 3, 7, 14, 30... |
| `return_visit` | volvió a jugar tras `days_away` días (`kept_streak`): es la métrica de regreso |
| `next_steps_shown`, `next_step_click` | si la tarjeta final se ve y a dónde lleva |
| `daily_challenge_click`, `daily_challenge_completed` | uso del reto del día |

Cómo leerlo en GA4 → Explorar: un *embudo* con `page_view` de la actividad →
`activity_finished` muestra cuánta gente termina; `trivia_abandoned` por
`question` muestra dónde se pierde; `return_visit` por `days_away` muestra
cuánta gente vuelve. Ojo: solo ve a quien aceptó cookies.

## Desplegar

1. Cargar/actualizar las variables de entorno en Vercel (Node **22.x**).
2. **Desplegar la app primero y las reglas después** (`firestore.rules`). Al
   revés, un cliente viejo puede dejar de guardar cosas.
3. Comprobar que `/api/health` responde `200`.

## Monitoreo

`GET /api/health` responde `200` si la configuración y el Admin SDK andan, y
`503` con la lista de qué falla (nunca muestra valores). Informa también la
versión de Node del servidor. Con `?deep=1` y `Authorization: Bearer <HEALTH_TOKEN>`
lee además un documento de Firestore.

[`.github/workflows/health.yml`](.github/workflows/health.yml) lo consulta
después de cada deploy de producción y cada 30 minutos; si falla, GitHub avisa
por mail (Settings → Notifications → Actions). Para activar la comprobación
profunda, cargá `HEALTH_TOKEN` como secreto del repositorio **y** en Vercel. Para
otro dominio, definí la variable de repositorio `SITE_URL`. A mano:
`bash scripts/check-health.sh https://jugar.cresi.com.ar`.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| 500 **sin cuerpo** en `/api/session`, `sync-score` o `join-class`; en el log de Vercel `ERR_REQUIRE_ESM` | Node del hosting demasiado viejo para `firebase-admin`. El proyecto fija `engines: 22.x` y un `override` de `jwks-rsa` para tolerarlo; revisar Settings → Build and Deployment → Node.js Version |
| Cartel rojo "Iniciaste sesión, pero no pudimos verificarla en el servidor" | falta `SESSION_SECRET` (la consola dice `SERVER_MISCONFIGURED`) o falló `/api/session` |
| Un alumno legítimo ve "Hiciste demasiados intentos" | superó un tope de `lib/joinClassLimits.ts` (mirá el log: `intento bloqueado por "<regla>"`); esperar 10 min o subir el tope de esa regla |
| Los puntos no se guardan | `/api/sync-score` falla: la consola muestra el paso y el código del error |
| Docente no puede ver/crear contraseñas de alumnos | falta o es incorrecta `PENDING_PASSWORD_KEY` (`/api/health` lo dice) |
| `npm audit` / alertas de GitHub | `npm audit fix` suele bastar (no cambia versiones mayores). Dependabot abre PRs semanales agrupadas (`.github/dependabot.yml`); activá también "Dependabot security updates" en Settings → Code security |
| Falla el CI en `tsc` con "Cannot find module '…webp'" | falta `next typegen`; ya está incluido en `npm run typecheck` |

## Scripts de mantenimiento

En `scripts/` hay migraciones y cargas de contenido de un solo uso. Se corren
con `node scripts/<nombre>.mjs` (o `npx tsx` los `.ts`) y necesitan las variables
`FIREBASE_ADMIN_*` en `.env.local`. Los que escriben corren **en simulación por
defecto** y solo aplican con `--apply`, por ejemplo
`npx tsx scripts/encrypt-pending-passwords.ts --apply`.
