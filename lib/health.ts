// lib/health.ts
//
// Comprobaciones de configuración para /api/health. Puras (reciben el
// entorno como argumento) para poder probarlas sin levantar Next.
//
// Nunca devuelven valores, solo "ok" o "fail": el endpoint es público y lo
// que se quiere saber es SI la configuración sirve, no cuál es.
import { loadSessionSecret } from '@/lib/sessionToken';
import { loadKey } from '@/lib/passwordCrypto';

export type CheckStatus = 'ok' | 'fail';
export type Env = Record<string, string | undefined>;

const attempt = (fn: () => unknown): CheckStatus => {
  try {
    fn();
    return 'ok';
  } catch {
    return 'fail';
  }
};

/** Credenciales del Admin SDK (join-class, sync-score, session, pending-students, delete-account). */
export function checkAdminEnv(env: Env): CheckStatus {
  const { FIREBASE_ADMIN_PROJECT_ID: id, FIREBASE_ADMIN_CLIENT_EMAIL: email, FIREBASE_ADMIN_PRIVATE_KEY: key } = env;
  if (!id || !email || !key) return 'fail';
  // La clave se guarda con "\n" escritos como texto; tiene que parecer una clave PEM.
  return key.replace(/\\n/g, '\n').includes('PRIVATE KEY') ? 'ok' : 'fail';
}

/** Firma la cookie de sesión del servidor (lib/sessionToken.ts). */
export const checkSessionSecret = (env: Env): CheckStatus => attempt(() => loadSessionSecret(env.SESSION_SECRET));

/** Cifra las contraseñas de los alumnos pendientes (lib/passwordCrypto.ts). */
export const checkPasswordKey = (env: Env): CheckStatus => attempt(() => loadKey(env.PENDING_PASSWORD_KEY));

/** Firma los certificados de trivia (utils/jwt.ts). */
export const checkCertificateSecret = (env: Env): CheckStatus => (env.JWT_SECRET ? 'ok' : 'fail');

export function checkConfig(env: Env): Record<string, CheckStatus> {
  return {
    adminEnv: checkAdminEnv(env),
    sessionSecret: checkSessionSecret(env),
    passwordKey: checkPasswordKey(env),
    certificateSecret: checkCertificateSecret(env),
  };
}

export function summarize(checks: Record<string, CheckStatus>): { ok: boolean; failing: string[] } {
  const failing = Object.entries(checks)
    .filter(([, status]) => status !== 'ok')
    .map(([name]) => name);
  return { ok: failing.length === 0, failing };
}
