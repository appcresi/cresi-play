// lib/sessionRevocation.ts
//
// Revocación de la cookie de sesión (lib/session.ts). La cookie se firma una
// vez y vale 2 horas; sin esto, una cuenta comprometida, deshabilitada o
// borrada seguía "entrando" a las páginas del servidor hasta que venciera.
//
// Ahora cada lectura de la cookie consulta a Firebase Auth si el usuario:
//   - fue REVOCADO  (`revokeRefreshTokens`: guarda `tokensValidAfterTime`;
//                    una cookie emitida ANTES de esa fecha ya no sirve),
//   - está DESHABILITADO, o
//   - fue BORRADO.
// La respuesta se guarda en memoria unos segundos por usuario, así una
// página no cuesta una llamada a Firebase cada vez: la revocación se nota
// en como mucho `ttlMs` (60 s por defecto), no en 2 horas.
//
// Puro salvo por la función `fetchState` que se le inyecta (en producción,
// el Admin SDK; en las pruebas, un doble).

export interface AuthState {
  disabled: boolean;
  /** Segundos desde epoch a partir de los cuales las sesiones son válidas; null si nunca se revocó. */
  validSinceSeconds: number | null;
}

/** `null` = el usuario no existe (borrado). */
export type FetchAuthState = (uid: string) => Promise<AuthState | null>;

/**
 * ¿La cookie (emitida en `iat`, segundos) ya no vale?
 * Igual que Firebase: una sesión emitida en el MISMO segundo de la revocación
 * sigue valiendo (es la del inicio de sesión nuevo); solo caen las anteriores.
 */
export function isRevoked(state: AuthState | null, iat: number): boolean {
  if (state === null) return true;
  if (state.disabled) return true;
  return state.validSinceSeconds !== null && iat < state.validSinceSeconds;
}

export interface RevocationOptions {
  /** Cuánto se reutiliza el estado de un usuario antes de volver a preguntar. */
  ttlMs?: number;
  now?: () => number;
  /** Para registrar fallos del servicio de Auth sin depender de `console`. */
  onError?: (err: unknown) => void;
}

export function createRevocationChecker(fetchState: FetchAuthState, options: RevocationOptions = {}) {
  const { ttlMs = 60_000, now = Date.now, onError = () => undefined } = options;
  const cache = new Map<string, { state: AuthState | null; at: number }>();

  return async function isSessionRevoked(uid: string, iat: number): Promise<boolean> {
    const cached = cache.get(uid);
    if (cached && now() - cached.at < ttlMs) return isRevoked(cached.state, iat);

    let state: AuthState | null;
    try {
      state = await fetchState(uid);
    } catch (err) {
      // Si Firebase Auth no responde, se DEJA PASAR: una caída de ese servicio
      // no puede dejar afuera a todos los docentes, y un atacante no tiene
      // forma de provocarla. No se guarda el fallo: la próxima vez se reintenta.
      onError(err);
      return false;
    }
    cache.set(uid, { state, at: now() });
    return isRevoked(state, iat);
  };
}
