import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ACTIVITIES } from './activities';

// Guardas de código: fallan si alguien vuelve a armar el progreso a mano en
// una pantalla, o si el título de una actividad se desincroniza del
// catálogo (lib/activities.ts). No reemplazan probar el juego, pero cubren
// los dos errores que ya nos pasaron.
const ROOT = join(import.meta.dirname, '..');
const SCAN_DIRS = ['app', 'components', 'hooks', 'context', 'lib'];
const SKIP = new Set(['node_modules', '.next']);
const ALLOWED = new Set(['lib/activityProgress.ts', 'lib/activityProgress.test.ts', 'lib/activityProgress.guard.test.ts', 'lib/userDataManager.test.ts']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)))
  .map((f) => ({ path: relative(ROOT, f).replace(/\\/g, '/'), src: readFileSync(f, 'utf8') }))
  .filter((f) => !ALLOWED.has(f.path));

describe('el progreso se anota solo con recordActivityProgress', () => {
  const forbidden: Array<[string, RegExp]> = [
    ['armar activityScores con spread', /activityScores:\s*\{\s*\.\.\./],
    ['armar activityTimes con spread', /activityTimes:\s*\{\s*\.\.\./],
    ['completedActivities armado a mano (spread, Set o negación)', /completedActivities:\s*(!|Array\.from\(new Set\(\[|\[\s*\.\.\.)/],
    ['completedActivities.push', /completedActivities\.push\(/],
    ['asignar activityScores[...] = ', /activityScores\[[^\]]+\]\s*=[^=]/],
  ];

  for (const [label, re] of forbidden) {
    it(`ninguna pantalla hace: ${label}`, () => {
      const offenders = files.filter((f) => re.test(f.src)).map((f) => f.path);
      expect(offenders).toEqual([]);
    });
  }
});

describe('títulos e ids de actividad coinciden con el catálogo', () => {
  const titles = new Set(ACTIVITIES.map((a) => a.title));
  const ids = new Set(ACTIVITIES.map((a) => a.id));

  it('los títulos de respaldo (ACTIVITY_TITLE / ACTIVITY_ID) existen en el catálogo', () => {
    const re = /const ACTIVITY_(?:TITLE|ID)\s*=\s*(?:ACTIVITY\?\.title\s*\?\?\s*)?(['"])([^'"]+)\1/g;
    const wrong: string[] = [];
    for (const f of files) {
      for (const m of f.src.matchAll(re)) {
        if (!titles.has(m[2])) wrong.push(`${f.path}: "${m[2]}"`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('los getActivityById("...") apuntan a ids que existen', () => {
    const re = /getActivityById\(\s*(['"])([^'"]+)\1\s*\)/g;
    const wrong: string[] = [];
    for (const f of files) {
      for (const m of f.src.matchAll(re)) {
        if (!ids.has(m[2])) wrong.push(`${f.path}: "${m[2]}"`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('el catálogo no repite títulos ni ids', () => {
    expect(titles.size).toBe(ACTIVITIES.length);
    expect(ids.size).toBe(ACTIVITIES.length);
  });
});
