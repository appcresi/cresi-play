import { describe, expect, it } from 'vitest';
import { isLeaderboardEligible, nextWeekReset, publicAlias, safeCharacterImage, weekKey } from './leaderboard';

describe('weekKey', () => {
  it('usa la semana ISO', () => {
    expect(weekKey(new Date('2026-09-23T15:00:00Z'))).toBe('2026-W39');
    // El 1/1/2027 es viernes: pertenece a la última semana de 2026.
    expect(weekKey(new Date('2027-01-01T15:00:00Z'))).toBe('2026-W53');
  });

  it('corta el lunes a las 00:00 de Argentina, no de UTC', () => {
    // Lunes 28/9 01:00 UTC = domingo 27/9 22:00 en Argentina: sigue la semana anterior.
    expect(weekKey(new Date('2026-09-28T01:00:00Z'))).toBe('2026-W39');
    // Lunes 28/9 03:00 UTC = lunes 00:00 en Argentina: semana nueva.
    expect(weekKey(new Date('2026-09-28T03:00:00Z'))).toBe('2026-W40');
  });
});

describe('nextWeekReset', () => {
  it('es el próximo lunes 00:00 de Argentina', () => {
    expect(nextWeekReset(new Date('2026-09-23T15:00:00Z')).toISOString()).toBe('2026-09-28T03:00:00.000Z');
    expect(nextWeekReset(new Date('2026-09-28T03:00:00Z')).toISOString()).toBe('2026-10-05T03:00:00.000Z');
  });
});

describe('publicAlias', () => {
  it('muestra el nombre y la inicial del apellido', () => {
    expect(publicAlias('Juana Pérez')).toBe('Juana P.');
    expect(publicAlias('  Tomi  ')).toBe('Tomi');
  });

  it('recorta nombres largos y saca símbolos', () => {
    expect(publicAlias('Maximilianoooooooooo')).toBe('Maximilianooooo');
    expect(publicAlias('<script>')).toBe('script');
  });

  it('usa un genérico si no queda nada o hay una palabra bloqueada', () => {
    expect(publicAlias('')).toBe('Jugador/a');
    expect(publicAlias(undefined)).toBe('Jugador/a');
    expect(publicAlias('🔥🔥')).toBe('Jugador/a');
    expect(publicAlias('el pel0tudo')).toBe('Jugador/a');
    expect(publicAlias('p u t o')).toBe('Jugador/a');
  });

  it('no bloquea nombres comunes que contienen partes de palabras', () => {
    expect(publicAlias('Penélope')).toBe('Penélope');
    expect(publicAlias('Concepción')).toBe('Concepción');
  });
});

describe('safeCharacterImage', () => {
  it('acepta solo las imágenes de personaje', () => {
    expect(safeCharacterImage('/personaje2.webp')).toBe('/personaje2.webp');
    expect(safeCharacterImage('https://malo.com/x.webp')).toBeNull();
    expect(safeCharacterImage(3)).toBeNull();
  });
});

describe('isLeaderboardEligible', () => {
  it('modo libre (Google o anónimo): sí', () => {
    expect(isLeaderboardEligible({ role: 'student', classroomId: null })).toBe(true);
    expect(isLeaderboardEligible({})).toBe(true);
  });

  it('docentes, alumnos de clase y bloqueados: no', () => {
    expect(isLeaderboardEligible({ role: 'teacher' })).toBe(false);
    expect(isLeaderboardEligible({ classroomId: 'abc' })).toBe(false);
    expect(isLeaderboardEligible({ classStudentClaim: true })).toBe(false);
    expect(isLeaderboardEligible({ blocked: true })).toBe(false);
  });
});
