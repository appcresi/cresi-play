import { describe, expect, it, vi } from 'vitest';
import { createRevocationChecker, isRevoked, type AuthState } from './sessionRevocation';

const ok: AuthState = { disabled: false, validSinceSeconds: null };

describe('isRevoked', () => {
  it('un usuario sano y nunca revocado no está revocado', () => {
    expect(isRevoked(ok, 1000)).toBe(false);
  });

  it('un usuario borrado (null) sí', () => {
    expect(isRevoked(null, 1000)).toBe(true);
  });

  it('un usuario deshabilitado sí', () => {
    expect(isRevoked({ ...ok, disabled: true }, 1000)).toBe(true);
  });

  it('una cookie emitida ANTES de la revocación cae', () => {
    expect(isRevoked({ ...ok, validSinceSeconds: 2000 }, 1999)).toBe(true);
  });

  it('una emitida en el mismo segundo o después sigue valiendo (es la del login nuevo)', () => {
    expect(isRevoked({ ...ok, validSinceSeconds: 2000 }, 2000)).toBe(false);
    expect(isRevoked({ ...ok, validSinceSeconds: 2000 }, 2500)).toBe(false);
  });
});

describe('createRevocationChecker', () => {
  it('reutiliza el estado dentro del TTL y vuelve a preguntar después', async () => {
    let clock = 0;
    const fetchState = vi.fn().mockResolvedValue(ok);
    const check = createRevocationChecker(fetchState, { ttlMs: 60_000, now: () => clock });

    await check('u1', 100);
    await check('u1', 100);
    clock = 59_000;
    await check('u1', 100);
    expect(fetchState).toHaveBeenCalledTimes(1);

    clock = 61_000;
    await check('u1', 100);
    expect(fetchState).toHaveBeenCalledTimes(2);
  });

  it('cada usuario tiene su propio estado', async () => {
    const fetchState = vi.fn(async (uid: string) => (uid === 'malo' ? { ...ok, disabled: true } : ok));
    const check = createRevocationChecker(fetchState);
    expect(await check('malo', 100)).toBe(true);
    expect(await check('bueno', 100)).toBe(false);
  });

  it('la revocación se nota apenas vence el TTL', async () => {
    let clock = 0;
    let state: AuthState = ok;
    const check = createRevocationChecker(async () => state, { ttlMs: 60_000, now: () => clock });
    expect(await check('u1', 100)).toBe(false);

    state = { disabled: false, validSinceSeconds: 500 }; // se revocó
    clock = 30_000;
    expect(await check('u1', 100)).toBe(false); // todavía dentro del caché
    clock = 61_000;
    expect(await check('u1', 100)).toBe(true); // ya se ve
  });

  it('con TTL 0 consulta siempre', async () => {
    const fetchState = vi.fn().mockResolvedValue(ok);
    const check = createRevocationChecker(fetchState, { ttlMs: 0 });
    await check('u1', 100);
    await check('u1', 100);
    expect(fetchState).toHaveBeenCalledTimes(2);
  });

  it('un usuario borrado queda revocado', async () => {
    const check = createRevocationChecker(async () => null);
    expect(await check('fantasma', 100)).toBe(true);
  });

  it('si Firebase Auth falla, deja pasar y lo registra', async () => {
    const onError = vi.fn();
    const check = createRevocationChecker(async () => { throw new Error('auth caído'); }, { onError });
    expect(await check('u1', 100)).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('un fallo NO se guarda en el caché: se reintenta en la siguiente consulta', async () => {
    const fetchState = vi.fn()
      .mockRejectedValueOnce(new Error('caído'))
      .mockResolvedValueOnce({ ...ok, disabled: true });
    const check = createRevocationChecker(fetchState);
    expect(await check('u1', 100)).toBe(false); // falló: se dejó pasar
    expect(await check('u1', 100)).toBe(true);  // reintentó y ahora sí ve que está deshabilitado
  });
});
