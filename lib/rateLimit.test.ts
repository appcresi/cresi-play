import { describe, expect, it } from 'vitest';
import { clearRules, createMemoryStore, findBlocked, limitId, recordFailure, type LimitRule } from './rateLimit';
import { MAX_FAILURES, WINDOW_MS, checkRules, failureRules, successRules } from './joinClassLimits';

const T0 = 1_800_000_000_000;
const rule = (over: Partial<LimitRule> = {}): LimitRule => ({ name: 'r', key: 'clave', max: 3, windowMs: 60_000, ...over });

describe('findBlocked / recordFailure', () => {
  it('no bloquea hasta llegar al máximo, y bloquea desde ahí', async () => {
    const store = createMemoryStore();
    const r = [rule()];
    for (let i = 0; i < 3; i++) {
      expect(await findBlocked(store, r, T0)).toBeNull();
      await recordFailure(store, r, T0);
    }
    expect((await findBlocked(store, r, T0))?.rule.name).toBe('r');
  });

  it('informa cuánto falta para que se libere', async () => {
    const store = createMemoryStore();
    const r = [rule({ max: 1, windowMs: 60_000 })];
    await recordFailure(store, r, T0);
    expect((await findBlocked(store, r, T0 + 20_000))?.retryAfterSeconds).toBe(40);
    expect((await findBlocked(store, r, T0 + 59_500))?.retryAfterSeconds).toBe(1);
  });

  it('cuando pasa la ventana se libera y vuelve a contar desde cero', async () => {
    const store = createMemoryStore();
    const r = [rule({ max: 2 })];
    await recordFailure(store, r, T0);
    await recordFailure(store, r, T0);
    expect(await findBlocked(store, r, T0 + 30_000)).not.toBeNull();
    expect(await findBlocked(store, r, T0 + 60_000)).toBeNull();
    await recordFailure(store, r, T0 + 61_000);
    expect(await findBlocked(store, r, T0 + 62_000)).toBeNull(); // 1 fallo nuevo, no 3
  });

  it('claves distintas no se mezclan', async () => {
    const store = createMemoryStore();
    await recordFailure(store, [rule({ key: 'a', max: 1 })], T0);
    expect(await findBlocked(store, [rule({ key: 'a', max: 1 })], T0)).not.toBeNull();
    expect(await findBlocked(store, [rule({ key: 'b', max: 1 })], T0)).toBeNull();
  });

  it('con varias reglas bloqueadas devuelve la que tarda más en liberarse', async () => {
    const store = createMemoryStore();
    const short = rule({ name: 'corta', key: 's', max: 1, windowMs: 30_000 });
    const long = rule({ name: 'larga', key: 'l', max: 1, windowMs: 600_000 });
    await recordFailure(store, [short, long], T0);
    expect((await findBlocked(store, [short, long], T0))?.rule.name).toBe('larga');
  });
});

describe('clearRules', () => {
  it('borra solo lo pedido', async () => {
    const store = createMemoryStore();
    const a = rule({ key: 'a', max: 1 });
    const b = rule({ key: 'b', max: 1 });
    await recordFailure(store, [a, b], T0);
    await clearRules(store, [a]);
    expect(await findBlocked(store, [a], T0)).toBeNull();
    expect(await findBlocked(store, [b], T0)).not.toBeNull();
  });
});

describe('limitId', () => {
  it('es un hash: no deja a la vista la IP ni el usuario', () => {
    const id = limitId('ipcode:190.1.2.3:ABC123');
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain('190');
  });

  it('es estable y distingue claves', () => {
    expect(limitId('x')).toBe(limitId('x'));
    expect(limitId('x')).not.toBe(limitId('y'));
  });
});

describe('reglas de /api/join-class', () => {
  const attempt = { ip: '1.2.3.4', code: 'ABC123', username: 'ana' };

  it('se consultan las cuatro y todas usan la ventana de 10 minutos', () => {
    const rules = checkRules(attempt);
    expect(rules.map((r) => r.name)).toEqual(['ipCode', 'ip', 'user', 'code']);
    expect(rules.every((r) => r.windowMs === WINDOW_MS)).toBe(true);
    expect(rules.find((r) => r.name === 'user')?.max).toBe(MAX_FAILURES.user);
  });

  it('el tope por usuario es el más estricto', () => {
    expect(MAX_FAILURES.user).toBeLessThan(MAX_FAILURES.ipCode);
    expect(MAX_FAILURES.user).toBeLessThan(MAX_FAILURES.ip);
    expect(MAX_FAILURES.user).toBeLessThan(MAX_FAILURES.code);
  });

  it('el tope por IP+clase deja pasar a un curso entero equivocándose', () => {
    // ~30 alumnos detrás de la misma IP de un colegio, un error cada uno.
    expect(MAX_FAILURES.ipCode).toBeGreaterThanOrEqual(30);
  });

  it('un código inexistente solo cuenta contra la IP', () => {
    expect(failureRules(attempt, false).map((r) => r.name)).toEqual(['ipCode', 'ip']);
    expect(failureRules(attempt, true)).toHaveLength(4);
  });

  it('un login correcto solo borra el contador del usuario', () => {
    expect(successRules(attempt).map((r) => r.name)).toEqual(['user']);
  });

  it('el usuario se separa por clase: "ana" de una clase no afecta a "ana" de otra', async () => {
    const store = createMemoryStore();
    const a = checkRules({ ip: '1.1.1.1', code: 'AAAAAA', username: 'ana' });
    const b = checkRules({ ip: '2.2.2.2', code: 'BBBBBB', username: 'ana' });
    for (let i = 0; i < MAX_FAILURES.user; i++) await recordFailure(store, failureRules({ ip: '1.1.1.1', code: 'AAAAAA', username: 'ana' }, true), T0);
    expect((await findBlocked(store, a, T0))?.rule.name).toBe('user');
    expect(await findBlocked(store, b, T0)).toBeNull();
  });

  it('un atacante desde muchas IPs contra un alumno igual llega al tope por usuario', async () => {
    const store = createMemoryStore();
    for (let i = 0; i < MAX_FAILURES.user; i++) {
      await recordFailure(store, failureRules({ ip: `10.0.0.${i}`, code: 'ABC123', username: 'ana' }, true), T0);
    }
    // Una IP nueva, con la contraseña correcta: ya está bloqueado.
    expect((await findBlocked(store, checkRules({ ip: '99.9.9.9', code: 'ABC123', username: 'ana' }), T0))?.rule.name).toBe('user');
    // Otro alumno de la misma clase no se ve afectado.
    expect(await findBlocked(store, checkRules({ ip: '99.9.9.9', code: 'ABC123', username: 'beto' }), T0)).toBeNull();
  });
});
