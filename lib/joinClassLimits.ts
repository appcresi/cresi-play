// lib/joinClassLimits.ts
//
// Qué se limita en /api/join-class y con qué topes. Cada intento fallido suma
// en varias "reglas" a la vez, cada una tapa un ataque distinto:
//
//   ipCode  — una IP probando contraseñas en una clase.
//   ip      — una IP recorriendo muchos códigos de clase (escaneo).
//   user    — probar contraseñas de UN alumno desde muchas IPs (la contraseña
//             puede tener solo 3 caracteres, así que este es el tope que
//             realmente protege una cuenta).
//   code    — ataque distribuido contra toda una clase.
//
// Los topes de `ipCode` y `code` son ALTOS a propósito: en un colegio toda la
// clase sale por la misma IP y los chicos se equivocan seguido al tipear. Con
// el tope viejo (5 fallos por IP+clase cada 10 min) unos pocos errores
// bloqueaban a toda la clase. Son estimaciones sin datos reales: si un
// alumno legítimo recibe "demasiados intentos", subirlos acá.
import type { LimitRule } from '@/lib/rateLimit';

export const WINDOW_MS = 10 * 60 * 1000; // 10 minutos

export const MAX_FAILURES = {
  ipCode: 30,
  ip: 60,
  user: 10,
  code: 150,
} as const;

interface Attempt {
  ip: string;
  /** Ya normalizado (mayúsculas, sin espacios). */
  code: string;
  /** Ya normalizado (minúsculas, sin espacios). */
  username: string;
}

const rule = (name: keyof typeof MAX_FAILURES, key: string): LimitRule => ({
  name,
  key,
  max: MAX_FAILURES[name],
  windowMs: WINDOW_MS,
});

/** Todas las reglas que se consultan antes de tocar la base. */
export function checkRules({ ip, code, username }: Attempt): LimitRule[] {
  return [
    rule('ipCode', `ipcode:${ip}:${code}`),
    rule('ip', `ip:${ip}`),
    rule('user', `user:${code}:${username}`),
    rule('code', `code:${code}`),
  ];
}

/**
 * Reglas que suman un fallo. Si el código ni siquiera existe, no tiene
 * sentido contar contra un "usuario" o una "clase" que no hay: solo cuenta la IP.
 */
export function failureRules(attempt: Attempt, codeFound: boolean): LimitRule[] {
  const all = checkRules(attempt);
  return codeFound ? all : all.filter((r) => r.name === 'ipCode' || r.name === 'ip');
}

/**
 * Tras un login correcto se borra SOLO el contador de ese usuario. Los de
 * IP y clase no: si un login bueno los reiniciara, alguien con UNA cuenta
 * válida podría "limpiar" su contador entre intento e intento y seguir
 * probando contraseñas de otras.
 */
export function successRules(attempt: Attempt): LimitRule[] {
  return checkRules(attempt).filter((r) => r.name === 'user');
}
