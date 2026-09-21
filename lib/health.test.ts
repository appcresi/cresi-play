import { describe, expect, it } from 'vitest';
import { randomBytes } from 'crypto';
import { checkAdminEnv, checkCertificateSecret, checkConfig, checkPasswordKey, checkSessionSecret, summarize } from './health';

const goodEnv = {
  FIREBASE_ADMIN_PROJECT_ID: 'proyecto',
  FIREBASE_ADMIN_CLIENT_EMAIL: 'x@proyecto.iam.gserviceaccount.com',
  FIREBASE_ADMIN_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
  SESSION_SECRET: randomBytes(48).toString('base64'),
  PENDING_PASSWORD_KEY: randomBytes(32).toString('base64'),
  JWT_SECRET: 'algo',
};

describe('checkConfig', () => {
  it('con todo bien, todo ok', () => {
    expect(checkConfig(goodEnv)).toEqual({ adminEnv: 'ok', sessionSecret: 'ok', passwordKey: 'ok', certificateSecret: 'ok' });
    expect(summarize(checkConfig(goodEnv))).toEqual({ ok: true, failing: [] });
  });

  it('sin nada, todo falla y summarize lista qué', () => {
    const result = summarize(checkConfig({}));
    expect(result.ok).toBe(false);
    expect(result.failing.sort()).toEqual(['adminEnv', 'certificateSecret', 'passwordKey', 'sessionSecret']);
  });
});

describe('checkAdminEnv', () => {
  it('falla si falta cualquiera de las tres', () => {
    for (const k of ['FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY']) {
      expect(checkAdminEnv({ ...goodEnv, [k]: undefined })).toBe('fail');
      expect(checkAdminEnv({ ...goodEnv, [k]: '' })).toBe('fail');
    }
  });

  it('falla si la clave no parece una clave PEM (pegada mal)', () => {
    expect(checkAdminEnv({ ...goodEnv, FIREBASE_ADMIN_PRIVATE_KEY: 'esto no es una clave' })).toBe('fail');
  });
});

describe('secretos', () => {
  it('SESSION_SECRET corto o ausente falla', () => {
    expect(checkSessionSecret({ SESSION_SECRET: 'corto' })).toBe('fail');
    expect(checkSessionSecret({})).toBe('fail');
    expect(checkSessionSecret(goodEnv)).toBe('ok');
  });

  it('PENDING_PASSWORD_KEY con largo incorrecto falla', () => {
    expect(checkPasswordKey({ PENDING_PASSWORD_KEY: randomBytes(16).toString('base64') })).toBe('fail');
    expect(checkPasswordKey({})).toBe('fail');
    expect(checkPasswordKey(goodEnv)).toBe('ok');
  });

  it('JWT_SECRET ausente falla', () => {
    expect(checkCertificateSecret({})).toBe('fail');
    expect(checkCertificateSecret(goodEnv)).toBe('ok');
  });
});

describe('no filtra valores', () => {
  it('el resultado solo contiene ok/fail', () => {
    const json = JSON.stringify(checkConfig(goodEnv));
    for (const secret of [goodEnv.SESSION_SECRET, goodEnv.PENDING_PASSWORD_KEY, goodEnv.JWT_SECRET, 'BEGIN PRIVATE KEY']) {
      expect(json).not.toContain(secret);
    }
  });
});
