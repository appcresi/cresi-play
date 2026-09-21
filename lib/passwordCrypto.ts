// lib/passwordCrypto.ts
//
// Cifrado de las contraseñas de `estudiantesPendientes` (los usuarios que el
// docente arma para su clase). No se hashean a propósito: el docente tiene
// que poder volver a VERLAS para dárselas otra vez a un alumno que la olvidó.
// Lo que sí se evita es que queden legibles en la base: una filtración de
// Firestore, un error de reglas o un docente mirando la consola no las
// expone — hace falta además la clave del servidor (PENDING_PASSWORD_KEY).
//
// SOLO se usa server-side (API routes). AES-256-GCM: cifra y autentica, así
// que un valor alterado en la base falla al descifrar en vez de dar basura.
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

const VERSION = 'v1';
const KEY_BYTES = 32;

export class PasswordKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordKeyError';
  }
}

/** Clave del servidor: 32 bytes en base64 (`openssl rand -base64 32`). */
export function loadKey(raw: string | undefined = process.env.PENDING_PASSWORD_KEY): Buffer {
  if (!raw) {
    throw new PasswordKeyError('Falta la variable de entorno PENDING_PASSWORD_KEY.');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new PasswordKeyError(`PENDING_PASSWORD_KEY debe ser de ${KEY_BYTES} bytes en base64 (tiene ${key.length}).`);
  }
  return key;
}

/** Formato: `v1.<iv>.<tag>.<texto cifrado>`, todo en base64url. */
export function encryptPassword(plain: string, key: Buffer = loadKey()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, encrypted].map((part) => (typeof part === 'string' ? part : part.toString('base64url'))).join('.');
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(`${VERSION}.`) && value.split('.').length === 4;
}

export function decryptPassword(encrypted: string, key: Buffer = loadKey()): string {
  const [version, iv, tag, data] = encrypted.split('.');
  if (version !== VERSION || !iv || !tag || data === undefined) {
    throw new Error('Formato de contraseña cifrada no reconocido.');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

/**
 * Comparación en tiempo constante (se comparan los hashes, que tienen
 * siempre el mismo largo) para no filtrar por tiempo cuántos caracteres
 * coinciden.
 */
export function passwordsMatch(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export interface StoredCredentials {
  password?: unknown;
  passwordEnc?: unknown;
}

/**
 * Lee la contraseña de un documento, sea cual sea su formato: la cifrada
 * (`passwordEnc`) o la vieja en texto plano (`password`, de antes de este
 * cambio). `legacy` avisa que hay que cifrarla.
 * `key` solo se necesita si el documento ya está cifrado — así los
 * documentos viejos siguen funcionando aunque falte configurar la clave.
 */
export function readStoredPassword(
  data: StoredCredentials,
  getKey: () => Buffer = loadKey
): { password: string; legacy: boolean } | null {
  if (isEncrypted(data.passwordEnc)) {
    return { password: decryptPassword(data.passwordEnc, getKey()), legacy: false };
  }
  if (typeof data.password === 'string' && data.password !== '') {
    return { password: data.password, legacy: true };
  }
  return null;
}
