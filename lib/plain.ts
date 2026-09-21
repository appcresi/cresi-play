// lib/plain.ts
//
// Convierte lo que devuelve el Admin SDK de Firestore en datos "planos" que
// se pueden pasar de un Server Component a un Client Component. Los
// documentos pueden traer `Timestamp` (u otros objetos con métodos) que React
// no sabe serializar y rompen el render: acá los `Timestamp` pasan a texto
// ISO, que es el formato que ya usan los campos de fecha del proyecto
// (`created_at`, `updated_at`).
export type Plain = string | number | boolean | null | Plain[] | { [key: string]: Plain };

const isTimestampLike = (value: object): value is { toDate: () => Date } =>
  typeof (value as { toDate?: unknown }).toDate === 'function';

export function toPlain(value: unknown): Plain {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === 'object') {
    if (isTimestampLike(value)) return value.toDate().toISOString();
    const out: { [key: string]: Plain } = {};
    for (const [key, inner] of Object.entries(value)) {
      // `undefined` no existe en JSON: el campo simplemente no viaja.
      if (inner !== undefined) out[key] = toPlain(inner);
    }
    return out;
  }
  return null; // funciones, símbolos, bigint…
}
