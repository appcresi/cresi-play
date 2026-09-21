import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import {
  SESSION_TTL_SECONDS,
  SessionSecretError,
  createSessionToken,
  loadSessionSecret,
  verifySessionToken,
} from './sessionToken';

const secret = 'a'.repeat(48);
const otherSecret = 'b'.repeat(48);
const NOW = Date.parse('2026-01-01T00:00:00Z');
const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');

describe('createSessionToken / verifySessionToken', () => {
  it('un token recién emitido se verifica y trae el uid', () => {
    const { token } = createSessionToken('uid-1', { secret, now: NOW });
    expect(verifySessionToken(token, { secret, now: NOW })?.uid).toBe('uid-1');
  });

  it('vence a las 2 horas', () => {
    const { token, payload } = createSessionToken('uid-1', { secret, now: NOW });
    expect(payload.exp - payload.iat).toBe(SESSION_TTL_SECONDS);
    expect(verifySessionToken(token, { secret, now: NOW + (SESSION_TTL_SECONDS - 1) * 1000 })).not.toBeNull();
    expect(verifySessionToken(token, { secret, now: NOW + SESSION_TTL_SECONDS * 1000 })).toBeNull();
  });

  it('con otro secreto no verifica', () => {
    const { token } = createSessionToken('uid-1', { secret, now: NOW });
    expect(verifySessionToken(token, { secret: otherSecret, now: NOW })).toBeNull();
  });

  it('si se cambia el uid del payload, la firma ya no coincide', () => {
    const { token } = createSessionToken('uid-1', { secret, now: NOW });
    const [h, , s] = token.split('.');
    const forged = `${h}.${b64({ uid: 'admin', iat: NOW / 1000, exp: NOW / 1000 + 9999 })}.${s}`;
    expect(verifySessionToken(forged, { secret, now: NOW })).toBeNull();
  });

  it('rechaza alg "none" y otros encabezados aunque la firma sea la del secreto', () => {
    const payload = b64({ uid: 'x', iat: NOW / 1000, exp: NOW / 1000 + 100 });
    const noneHeader = b64({ alg: 'none', typ: 'JWT' });
    expect(verifySessionToken(`${noneHeader}.${payload}.`, { secret, now: NOW })).toBeNull();
    const sig = createHmac('sha256', secret).update(`${noneHeader}.${payload}`).digest('base64url');
    expect(verifySessionToken(`${noneHeader}.${payload}.${sig}`, { secret, now: NOW })).toBeNull();
  });

  it('un payload bien firmado pero sin uid o sin fechas no sirve', () => {
    const sign = (body: string, h = b64({ alg: 'HS256', typ: 'JWT' })) =>
      `${h}.${body}.${createHmac('sha256', secret).update(`${h}.${body}`).digest('base64url')}`;
    expect(verifySessionToken(sign(b64({ iat: 1, exp: 9e12 })), { secret, now: NOW })).toBeNull();
    expect(verifySessionToken(sign(b64({ uid: '', iat: 1, exp: 9e12 })), { secret, now: NOW })).toBeNull();
    expect(verifySessionToken(sign(b64({ uid: 'x' })), { secret, now: NOW })).toBeNull();
  });

  it('basura, vacío y formatos raros devuelven null sin lanzar', () => {
    for (const bad of [undefined, null, '', 'abc', 'a.b', 'a.b.c.d', '...', 'x.y.z']) {
      expect(verifySessionToken(bad as string, { secret, now: NOW })).toBeNull();
    }
  });

  it('dos tokens del mismo usuario en momentos distintos son distintos', () => {
    const a = createSessionToken('u', { secret, now: NOW }).token;
    const b = createSessionToken('u', { secret, now: NOW + 1000 }).token;
    expect(a).not.toBe(b);
  });
});

describe('loadSessionSecret', () => {
  it('acepta un secreto largo', () => {
    expect(loadSessionSecret(secret)).toBe(secret);
  });

  it('falla claro si falta o es corto', () => {
    expect(() => loadSessionSecret(undefined)).toThrow(SessionSecretError);
    expect(() => loadSessionSecret('')).toThrow(SessionSecretError);
    expect(() => loadSessionSecret('corto')).toThrow(/al menos 32/);
  });
});
