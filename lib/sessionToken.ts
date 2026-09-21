// lib/sessionToken.ts
//
// Token de sesión firmado (HS256) para la cookie `cresi_session`. Puro y sin
// dependencias de Next, para poder probarlo aislado; lib/session.ts lo usa
// junto con `cookies()`.
//
// Por qué una cookie propia y no `createSessionCookie` de Firebase: esa
// exige un login hecho hace menos de 5 minutos, y acá la sesión de Firebase
// persiste entre visitas — habría que pedirle al usuario que vuelva a
// iniciar sesión para poder emitirla. Esta se emite en cualquier momento a
// partir de un ID token válido (el mismo que ya verifican las rutas de API)
// y dura poco (2 h), así que se renueva sola mientras el usuario está
// activo y caduca sola cuando se va.
//
// La cookie identifica al usuario (uid); NO da permisos por sí sola: lo que
// cada usuario puede ver lo decide cada consulta del servidor (ver el DAL).
import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_TTL_SECONDS = 2 * 60 * 60;
const MIN_SECRET_BYTES = 32;

export class SessionSecretError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionSecretError';
  }
}

export interface SessionPayload {
  /** uid de Firebase. */
  uid: string;
  /** Emitido (segundos, epoch). */
  iat: number;
  /** Vence (segundos, epoch). */
  exp: number;
  /** true si es un ALUMNO que entró con código de clase (marca `student` del token de Firebase). */
  stu?: boolean;
}

/** Secreto del servidor (`openssl rand -base64 48`). Falla cerrado si falta o es corto. */
export function loadSessionSecret(raw: string | undefined = process.env.SESSION_SECRET): string {
  if (!raw) throw new SessionSecretError('Falta la variable de entorno SESSION_SECRET.');
  if (Buffer.byteLength(raw, 'utf8') < MIN_SECRET_BYTES) {
    throw new SessionSecretError(`SESSION_SECRET debe tener al menos ${MIN_SECRET_BYTES} bytes.`);
  }
  return raw;
}

const b64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');
const sign = (data: string, secret: string): Buffer => createHmac('sha256', secret).update(data).digest();

// El encabezado es fijo: no se lee del token, así un atacante no puede
// pedir "alg: none" ni otro algoritmo.
const HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

export function createSessionToken(
  uid: string,
  options: { secret?: string; now?: number; ttlSeconds?: number; student?: boolean } = {}
): { token: string; payload: SessionPayload } {
  const secret = options.secret ?? loadSessionSecret();
  const iat = Math.floor((options.now ?? Date.now()) / 1000);
  const payload: SessionPayload = { uid, iat, exp: iat + (options.ttlSeconds ?? SESSION_TTL_SECONDS) };
  // Solo se escribe cuando es true: la mayoría de las cookies (docentes) no lo llevan.
  if (options.student === true) payload.stu = true;
  const body = b64url(JSON.stringify(payload));
  const signature = b64url(sign(`${HEADER}.${body}`, secret));
  return { token: `${HEADER}.${body}.${signature}`, payload };
}

/** Devuelve el payload si la firma es válida y no venció; si no, null. Nunca lanza por un token malo. */
export function verifySessionToken(
  token: string | undefined | null,
  options: { secret?: string; now?: number } = {}
): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  if (header !== HEADER) return null;

  const secret = options.secret ?? loadSessionSecret();
  const expected = sign(`${header}.${body}`, secret);
  let given: Buffer;
  try {
    given = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<SessionPayload>;
    if (typeof payload.uid !== 'string' || payload.uid === '') return null;
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null;
    const now = Math.floor((options.now ?? Date.now()) / 1000);
    if (payload.exp <= now) return null;
    return { uid: payload.uid, iat: payload.iat, exp: payload.exp, ...(payload.stu === true ? { stu: true } : {}) };
  } catch {
    return null;
  }
}
