import { describe, expect, it } from 'vitest';
import { toPlain } from './plain';

describe('toPlain', () => {
  it('deja intactos los valores simples', () => {
    expect(toPlain({ a: 'x', b: 1, c: true, d: null })).toEqual({ a: 'x', b: 1, c: true, d: null });
  });

  it('convierte Timestamps (cualquier objeto con toDate) a ISO', () => {
    const ts = { toDate: () => new Date('2026-01-02T03:04:05.000Z') };
    expect(toPlain({ created: ts })).toEqual({ created: '2026-01-02T03:04:05.000Z' });
  });

  it('convierte Date a ISO', () => {
    expect(toPlain(new Date('2026-01-02T00:00:00Z'))).toBe('2026-01-02T00:00:00.000Z');
  });

  it('recorre objetos y arreglos anidados (preguntas de una trivia)', () => {
    const input = { questions: [{ question: 'q', options: { first: 'a' }, when: { toDate: () => new Date(0) } }] };
    expect(toPlain(input)).toEqual({ questions: [{ question: 'q', options: { first: 'a' }, when: '1970-01-01T00:00:00.000Z' }] });
  });

  it('descarta undefined en objetos y lo vuelve null en arreglos', () => {
    expect(toPlain({ a: undefined, b: 1 })).toEqual({ b: 1 });
    expect(toPlain([undefined, 2])).toEqual([null, 2]);
  });

  it('NaN e Infinity no son JSON válido: pasan a null', () => {
    expect(toPlain({ a: NaN, b: Infinity })).toEqual({ a: null, b: null });
  });

  it('funciones y símbolos no viajan', () => {
    expect(toPlain({ f: () => 1, s: Symbol('x') })).toEqual({ f: null, s: null });
  });

  it('el resultado sobrevive a JSON.stringify sin cambios', () => {
    const out = toPlain({ a: [1, { b: 'c' }], t: { toDate: () => new Date(1) } });
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });
});
