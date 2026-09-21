// lib/rateLimit.ts
//
// Límite de intentos fallidos (fuerza bruta) con contadores en un "store"
// intercambiable: en producción es Firestore (lib/rateLimitStore.ts), así el
// conteo lo comparten todas las instancias del hosting y sobrevive a los
// arranques en frío. El primer freno de /api/join-class vivía en la memoria
// de cada proceso, que en un servidor sin estado casi no frena a nadie: cada
// petición puede caer en una instancia distinta con el contador en cero.
//
// Ventana fija: el contador arranca en el primer fallo y se reinicia cuando
// pasa `windowMs`. Todo lo que hace este módulo es puro salvo llamar al store.
import { createHash } from 'crypto';

export interface WindowState {
  count: number;
  /** ms desde epoch en que arrancó la ventana actual. */
  windowStart: number;
}

export interface RateLimitStore {
  get(id: string): Promise<WindowState | null>;
  /** Suma 1 al contador; si la ventana venció (o no había), arranca una nueva en 1. Tiene que ser atómico. */
  increment(id: string, windowMs: number, now: number): Promise<WindowState>;
  delete(id: string): Promise<void>;
}

export interface LimitRule {
  /** Nombre corto, para logs y pruebas. */
  name: string;
  /** Clave lógica (IP, código de clase, usuario…). Se hashea antes de guardarse. */
  key: string;
  /** Fallos permitidos dentro de la ventana; el siguiente ya se bloquea. */
  max: number;
  windowMs: number;
}

export interface Blocked {
  rule: LimitRule;
  retryAfterSeconds: number;
}

/**
 * Id del documento: un hash, no la clave. Así en la base no quedan a la
 * vista IPs de alumnos ni nombres de usuario, y el id es siempre válido.
 */
export function limitId(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

const activeState = (state: WindowState | null, windowMs: number, now: number): WindowState | null =>
  state && now - state.windowStart < windowMs ? state : null;

/** ¿Alguna regla ya llegó a su máximo? Devuelve la que tarda más en liberarse. */
export async function findBlocked(store: RateLimitStore, rules: LimitRule[], now: number = Date.now()): Promise<Blocked | null> {
  const states = await Promise.all(rules.map((r) => store.get(limitId(r.key))));
  let worst: Blocked | null = null;
  rules.forEach((rule, i) => {
    const state = activeState(states[i], rule.windowMs, now);
    if (!state || state.count < rule.max) return;
    const retryAfterSeconds = Math.max(1, Math.ceil((state.windowStart + rule.windowMs - now) / 1000));
    if (!worst || retryAfterSeconds > worst.retryAfterSeconds) worst = { rule, retryAfterSeconds };
  });
  return worst;
}

/** Anota un fallo en todas las reglas. */
export async function recordFailure(store: RateLimitStore, rules: LimitRule[], now: number = Date.now()): Promise<void> {
  await Promise.all(rules.map((r) => store.increment(limitId(r.key), r.windowMs, now)));
}

/** Borra los contadores de las reglas dadas (p. ej. el del propio usuario tras un login correcto). */
export async function clearRules(store: RateLimitStore, rules: LimitRule[]): Promise<void> {
  await Promise.all(rules.map((r) => store.delete(limitId(r.key))));
}

/** Store en memoria: para pruebas. */
export function createMemoryStore(): RateLimitStore & { size: () => number } {
  const map = new Map<string, WindowState>();
  return {
    async get(id) {
      const s = map.get(id);
      return s ? { ...s } : null;
    },
    async increment(id, windowMs, now) {
      const current = map.get(id);
      const next: WindowState = current && now - current.windowStart < windowMs
        ? { count: current.count + 1, windowStart: current.windowStart }
        : { count: 1, windowStart: now };
      map.set(id, next);
      return { ...next };
    },
    async delete(id) {
      map.delete(id);
    },
    size: () => map.size,
  };
}
