import { describe, expect, it } from 'vitest';
import { errorCode } from './routeErrors';

describe('errorCode', () => {
  it('usa el code de Firebase Admin (string)', () => {
    expect(errorCode({ code: 'auth/argument-error' })).toBe('auth/argument-error');
  });

  it('acepta el code numérico de gRPC (Firestore)', () => {
    expect(errorCode({ code: 7 })).toBe('7');
  });

  it('sin code, cae al nombre del error', () => {
    expect(errorCode(new TypeError('x'))).toBe('TypeError');
  });

  it('nunca devuelve el mensaje (puede traer datos internos)', () => {
    expect(errorCode(new Error('clave privada: ABC'))).not.toContain('ABC');
  });

  it('valores raros no rompen', () => {
    for (const v of [null, undefined, 'texto', 42, {}]) expect(errorCode(v)).toBe('UNKNOWN');
  });
});
