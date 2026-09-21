// lib/rateLimitStore.ts
//
// Store de lib/rateLimit.ts sobre Firestore (Admin SDK): la colección
// `rateLimits` es solo del servidor — las reglas prohíben cualquier acceso
// del cliente. Cada documento es tiny: { count, windowStart, expiresAt }.
//
// `expiresAt` existe para una política TTL de Firestore (consola → Firestore →
// TTL → colección `rateLimits`, campo `expiresAt`): sin ella los documentos
// viejos se quedan, aunque no molestan — un contador vencido se pisa solo en
// el siguiente fallo de esa clave.
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import type { RateLimitStore, WindowState } from '@/lib/rateLimit';

export const RATE_LIMITS_COLLECTION = 'rateLimits';

export function createFirestoreStore(): RateLimitStore {
  const collection = () => getFirestore(getAdminApp()).collection(RATE_LIMITS_COLLECTION);

  return {
    async get(id) {
      const snap = await collection().doc(id).get();
      if (!snap.exists) return null;
      const { count, windowStart } = snap.data() as WindowState;
      return { count, windowStart };
    },

    async increment(id, windowMs, now) {
      const ref = collection().doc(id);
      return getFirestore(getAdminApp()).runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists ? (snap.data() as WindowState) : null;
        const next: WindowState = current && now - current.windowStart < windowMs
          ? { count: current.count + 1, windowStart: current.windowStart }
          : { count: 1, windowStart: now };
        tx.set(ref, { ...next, expiresAt: Timestamp.fromMillis(next.windowStart + windowMs) });
        return next;
      });
    },

    async delete(id) {
      await collection().doc(id).delete();
    },
  };
}
