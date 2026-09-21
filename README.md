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

> Este Next.js **no es el que quizá conozcas**: `next lint` ya no existe y
> `middleware` se llama `proxy`. Ante la duda, leé `node_modules/next/dist/docs/`
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
| `npm test` | tests unitarios (Vitest, sin dependencias externas) |
| `npm run test:rules` | reglas de Firestore contra el emulador (necesita Java) |
| `npm run test:session` | sesión del servidor de punta a punta: `next dev` real + emuladores de Auth y Firestore (necesita Java; la primera compilación tarda) |

El CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) corre los cuatro
en cada push y pull request.

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
(alumnos que arma el docente), `certificado`, `delete-account`, `health`.

### Decisiones de seguridad que conviene conocer

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
- **Contraseñas de alumnos cifradas** (AES-256-GCM, `lib/passwordCrypto.ts`). El
  docente puede verlas pidiéndolas al servidor; nunca viajan con los datos de la clase.
- **El "rol" docente sigue en `localStorage`** y no es de confianza: la
  autorización real es de propiedad (`classrooms.profesorId`, `author == uid`)
  en las reglas y en las rutas.
- **Progreso de actividades:** todas las pantallas usan `recordActivityProgress`
  (`lib/activityProgress.ts`); no armes `activityScores` / `completedActivities` a mano.

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
| Los puntos no se guardan | `/api/sync-score` falla: la consola muestra el paso y el código del error |
| Docente no puede ver/crear contraseñas de alumnos | falta o es incorrecta `PENDING_PASSWORD_KEY` (`/api/health` lo dice) |
| Falla el CI en `tsc` con "Cannot find module '…webp'" | falta `next typegen`; ya está incluido en `npm run typecheck` |

## Scripts de mantenimiento

En `scripts/` hay migraciones y cargas de contenido de un solo uso. Se corren
con `node scripts/<nombre>.mjs` (o `npx tsx` los `.ts`) y necesitan las variables
`FIREBASE_ADMIN_*` en `.env.local`. Los que escriben corren **en simulación por
defecto** y solo aplican con `--apply`, por ejemplo
`npx tsx scripts/encrypt-pending-passwords.ts --apply`.
