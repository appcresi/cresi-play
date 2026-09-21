import { describe, expect, it } from 'vitest';
import { randomBytes } from 'crypto';
import {
  PasswordKeyError,
  decryptPassword,
  encryptPassword,
  isEncrypted,
  loadKey,
  passwordsMatch,
  readStoredPassword,
} from './passwordCrypto';

const key = randomBytes(32);
const otherKey = randomBytes(32);

describe('encryptPassword / decryptPassword', () => {
  it('descifra lo que cifró', () => {
    expect(decryptPassword(encryptPassword('gato123', key), key)).toBe('gato123');
  });

  it('soporta acentos, espacios y emojis', () => {
    const plain = 'contraseña con ñ 🐱';
    expect(decryptPassword(encryptPassword(plain, key), key)).toBe(plain);
  });

  it('cifrar dos veces lo mismo da resultados distintos (IV aleatorio)', () => {
    expect(encryptPassword('igual', key)).not.toBe(encryptPassword('igual', key));
  });

  it('no deja la contraseña legible en el valor guardado', () => {
    expect(encryptPassword('gato123', key)).not.toContain('gato123');
  });

  it('con otra clave no descifra', () => {
    expect(() => decryptPassword(encryptPassword('gato123', key), otherKey)).toThrow();
  });

  it('si alguien altera el valor guardado, falla en vez de devolver basura', () => {
    const [v, iv, tag, data] = encryptPassword('gato123', key).split('.');
    const tampered = [v, iv, tag, Buffer.from('otra-cosa').toString('base64url')].join('.');
    expect(() => decryptPassword(tampered, key)).toThrow();
    expect(data).toBeTruthy();
  });

  it('rechaza formatos desconocidos', () => {
    expect(() => decryptPassword('v9.a.b.c', key)).toThrow();
    expect(() => decryptPassword('texto plano', key)).toThrow();
  });
});

describe('isEncrypted', () => {
  it('distingue lo cifrado del texto plano', () => {
    expect(isEncrypted(encryptPassword('x', key))).toBe(true);
    expect(isEncrypted('gato123')).toBe(false);
    expect(isEncrypted(undefined)).toBe(false);
    expect(isEncrypted(42)).toBe(false);
  });
});

describe('loadKey', () => {
  it('acepta 32 bytes en base64', () => {
    expect(loadKey(key.toString('base64'))).toEqual(key);
  });

  it('falla claro si falta o tiene mal el largo', () => {
    expect(() => loadKey(undefined)).toThrow(PasswordKeyError);
    expect(() => loadKey('')).toThrow(PasswordKeyError);
    expect(() => loadKey(randomBytes(16).toString('base64'))).toThrow(/32 bytes/);
  });
});

describe('passwordsMatch', () => {
  it('compara igualdad exacta', () => {
    expect(passwordsMatch('gato123', 'gato123')).toBe(true);
    expect(passwordsMatch('gato123', 'gato124')).toBe(false);
    expect(passwordsMatch('gato123', 'gato1234')).toBe(false);
    expect(passwordsMatch('', 'a')).toBe(false);
  });
});

describe('readStoredPassword', () => {
  it('lee el formato cifrado', () => {
    expect(readStoredPassword({ passwordEnc: encryptPassword('gato123', key) }, () => key)).toEqual({ password: 'gato123', legacy: false });
  });

  it('lee el formato viejo en texto plano y avisa que es legacy', () => {
    expect(readStoredPassword({ password: 'gato123' }, () => key)).toEqual({ password: 'gato123', legacy: true });
  });

  it('un documento viejo NO necesita la clave (sigue funcionando sin configurarla)', () => {
    const noKey = () => { throw new PasswordKeyError('sin clave'); };
    expect(readStoredPassword({ password: 'gato123' }, noKey)).toEqual({ password: 'gato123', legacy: true });
  });

  it('un documento cifrado sin clave falla en vez de devolver vacío', () => {
    const noKey = () => { throw new PasswordKeyError('sin clave'); };
    expect(() => readStoredPassword({ passwordEnc: encryptPassword('x', key) }, noKey)).toThrow(PasswordKeyError);
  });

  it('prefiere el cifrado si hay ambos', () => {
    expect(readStoredPassword({ password: 'vieja', passwordEnc: encryptPassword('nueva', key) }, () => key)?.password).toBe('nueva');
  });

  it('devuelve null si no hay contraseña', () => {
    expect(readStoredPassword({}, () => key)).toBeNull();
    expect(readStoredPassword({ password: '' }, () => key)).toBeNull();
  });
});
