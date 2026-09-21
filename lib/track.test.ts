import { describe, expect, it } from 'vitest';
import { MAX_QUESTION_INDEX, TRACK_LIMITS, collectionFor, limitRuleFor, parseTrackEvent } from './track';
import { createMemoryStore, findBlocked, recordFailure } from './rateLimit';

describe('parseTrackEvent', () => {
  it('acepta cada tipo de evento con sus campos', () => {
    expect(parseTrackEvent({ kind: 'trivia-play', id: 'abc-123' })).toEqual({ kind: 'trivia-play', id: 'abc-123' });
    expect(parseTrackEvent({ kind: 'lesson-complete', id: 'l_1' })).toEqual({ kind: 'lesson-complete', id: 'l_1' });
    expect(parseTrackEvent({ kind: 'download', collection: 'resources', id: 'r1' })).toEqual({ kind: 'download', collection: 'resources', id: 'r1' });
    expect(parseTrackEvent({ kind: 'question-stat', id: 't1', index: 3, correct: false })).toEqual({ kind: 'question-stat', id: 't1', index: 3, correct: false });
  });

  it('descarta los campos que no conoce (no se cuelan datos)', () => {
    expect(parseTrackEvent({ kind: 'trivia-play', id: 'a', playCount: 9999, author: 'CRESI' })).toEqual({ kind: 'trivia-play', id: 'a' });
  });

  it('rechaza tipos desconocidos, cuerpos raros y vacíos', () => {
    for (const bad of [null, undefined, 'x', 5, [], {}, { kind: 'otro', id: 'a' }, { id: 'a' }, { kind: 'trivia-play' }]) {
      expect(parseTrackEvent(bad)).toBeNull();
    }
  });

  it('rechaza ids que no son ids de documento (rutas, comodines, larguísimos, tipos raros)', () => {
    for (const id of ['../users/x', 'a/b', 'a b', '', 'x'.repeat(129), 'a.b', 'a*', 5, null, { $ne: 1 }, ['a']]) {
      expect(parseTrackEvent({ kind: 'trivia-play', id })).toBeNull();
    }
  });

  it('una descarga solo puede ser de resources o infografias (no de users, etc.)', () => {
    expect(parseTrackEvent({ kind: 'download', collection: 'users', id: 'a' })).toBeNull();
    expect(parseTrackEvent({ kind: 'download', collection: 'trivia', id: 'a' })).toBeNull();
    expect(parseTrackEvent({ kind: 'download', id: 'a' })).toBeNull();
  });

  it('question-stat: índice entero entre 0 y el máximo, y "correct" booleano', () => {
    const ok = { kind: 'question-stat', id: 't', correct: true };
    expect(parseTrackEvent({ ...ok, index: 0 })).not.toBeNull();
    expect(parseTrackEvent({ ...ok, index: MAX_QUESTION_INDEX })).not.toBeNull();
    for (const index of [-1, MAX_QUESTION_INDEX + 1, 1.5, '3', null, NaN, Infinity, undefined]) {
      expect(parseTrackEvent({ ...ok, index })).toBeNull();
    }
    expect(parseTrackEvent({ kind: 'question-stat', id: 't', index: 1, correct: 'yes' })).toBeNull();
    expect(parseTrackEvent({ kind: 'question-stat', id: 't', index: 1 })).toBeNull();
  });
});

describe('collectionFor', () => {
  it('cada evento va a su colección', () => {
    expect(collectionFor({ kind: 'trivia-play', id: 'a' })).toBe('trivia');
    expect(collectionFor({ kind: 'question-stat', id: 'a', index: 0, correct: true })).toBe('trivia');
    expect(collectionFor({ kind: 'lesson-complete', id: 'a' })).toBe('lecciones');
    expect(collectionFor({ kind: 'download', collection: 'infografias', id: 'a' })).toBe('infografias');
  });
});

describe('límites', () => {
  it('son altos: un curso entero tras la misma IP no se corta', () => {
    expect(TRACK_LIMITS['trivia-play'].max).toBeGreaterThanOrEqual(40);
    expect(TRACK_LIMITS['question-stat'].max).toBeGreaterThanOrEqual(40 * 20);
  });

  it('la clave separa por tipo, elemento e IP', () => {
    const a = limitRuleFor({ kind: 'trivia-play', id: 'a' }, '1.1.1.1').key;
    expect(limitRuleFor({ kind: 'trivia-play', id: 'b' }, '1.1.1.1').key).not.toBe(a);
    expect(limitRuleFor({ kind: 'trivia-play', id: 'a' }, '2.2.2.2').key).not.toBe(a);
    expect(limitRuleFor({ kind: 'lesson-complete', id: 'a' }, '1.1.1.1').key).not.toBe(a);
  });

  it('un bucle desde una IP se corta en el tope y otra IP no se ve afectada', async () => {
    const store = createMemoryStore();
    const event = { kind: 'download', collection: 'resources', id: 'r1' } as const;
    const rule = limitRuleFor(event, '9.9.9.9');
    let allowed = 0;
    for (let i = 0; i < rule.max + 50; i++) {
      if (await findBlocked(store, [rule], 1000)) continue;
      await recordFailure(store, [rule], 1000);
      allowed++;
    }
    expect(allowed).toBe(rule.max);
    expect(await findBlocked(store, [limitRuleFor(event, '8.8.8.8')], 1000)).toBeNull();
  });
});
