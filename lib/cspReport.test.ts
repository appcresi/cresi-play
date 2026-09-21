import { describe, expect, it } from 'vitest';
import { createDedupe, describeViolation, parseCspReport } from './cspReport';

describe('parseCspReport', () => {
  it('lee el formato clásico (report-uri)', () => {
    const out = parseCspReport({
      'csp-report': {
        'document-uri': 'https://jugar.cresi.com.ar/clase/ABC123?token=secreto',
        'violated-directive': 'script-src-elem',
        'effective-directive': 'script-src-elem',
        'blocked-uri': 'https://malo.example.com/x.js?y=1',
      },
    });
    expect(out).toEqual([{ directive: 'script-src-elem', blocked: 'https://malo.example.com', page: '/clase/ABC123' }]);
  });

  it('lee el formato de la Reporting API (varios informes)', () => {
    const out = parseCspReport([
      { type: 'csp-violation', body: { effectiveDirective: 'img-src', blockedURL: 'https://cdn.example.com/a.png', documentURL: 'https://x.com/docente/trivias' } },
      { type: 'deprecation', body: {} },
      { type: 'csp-violation', body: { effectiveDirective: 'connect-src', blockedURL: 'inline', documentURL: 'https://x.com/' } },
    ]);
    expect(out).toEqual([
      { directive: 'img-src', blocked: 'https://cdn.example.com', page: '/docente/trivias' },
      { directive: 'connect-src', blocked: 'inline', page: '/' },
    ]);
  });

  it('NO guarda parámetros ni la URL completa (pueden traer códigos o tokens)', () => {
    const [v] = parseCspReport({ 'csp-report': { 'document-uri': 'https://x.com/clase/SECRETO?u=ana&p=1234', 'violated-directive': 'img-src', 'blocked-uri': 'https://a.com/p/token123?k=v' } });
    const text = JSON.stringify(v);
    expect(text).not.toContain('SECRETO'.toLowerCase() + '=');
    expect(text).not.toContain('1234');
    expect(text).not.toContain('token123');
    expect(text).not.toContain('u=ana');
  });

  it('palabras clave (inline, eval, data, blob) se conservan', () => {
    const blocked = (uri: string) => parseCspReport({ 'csp-report': { 'blocked-uri': uri, 'violated-directive': 'script-src', 'document-uri': 'https://x.com/' } })[0].blocked;
    expect(blocked('inline')).toBe('inline');
    expect(blocked('eval')).toBe('eval');
    expect(blocked('data:image/png;base64,AAAA')).toBe('data');
    expect(blocked('blob:https://x.com/uuid')).toBe('blob');
  });

  it('acorta campos larguísimos', () => {
    const [v] = parseCspReport({ 'csp-report': { 'violated-directive': 'x'.repeat(5000), 'blocked-uri': 'https://' + 'a'.repeat(5000) + '.com', 'document-uri': 'https://x.com/' + 'p'.repeat(5000) } });
    expect(v.directive.length).toBeLessThanOrEqual(120);
    expect(v.blocked.length).toBeLessThanOrEqual(120);
    expect(v.page.length).toBeLessThanOrEqual(120);
  });

  it('con basura devuelve una lista vacía, sin lanzar', () => {
    for (const bad of [null, undefined, 'texto', 42, {}, [], [null], [{}], { 'csp-report': 'x' }]) {
      expect(() => parseCspReport(bad)).not.toThrow();
    }
    expect(parseCspReport({})).toEqual([]);
    expect(parseCspReport([null, { type: 'csp-violation' }])).toEqual([]);
  });

  it('limita a 20 informes por pedido', () => {
    const many = Array.from({ length: 100 }, () => ({ type: 'csp-violation', body: { effectiveDirective: 'img-src', blockedURL: 'https://a.com/x', documentURL: 'https://x.com/' } }));
    expect(parseCspReport(many)).toHaveLength(20);
  });
});

describe('createDedupe', () => {
  const v = { directive: 'img-src', blocked: 'https://a.com', page: '/' };

  it('deja pasar la primera vez y no las repetidas', () => {
    const isNew = createDedupe();
    expect(isNew(v)).toBe(true);
    expect(isNew(v)).toBe(false);
    expect(isNew({ ...v, page: '/otra' })).toBe(true);
  });

  it('con el tope lleno se reinicia en vez de crecer sin fin', () => {
    const isNew = createDedupe(3);
    for (let i = 0; i < 3; i++) isNew({ ...v, blocked: `https://a${i}.com` });
    expect(isNew({ ...v, blocked: 'https://a0.com' })).toBe(false);
    expect(isNew({ ...v, blocked: 'https://nuevo.com' })).toBe(true); // llena: reinicia
    expect(isNew({ ...v, blocked: 'https://a0.com' })).toBe(true);    // ya se había olvidado
  });
});

describe('describeViolation', () => {
  it('arma una línea legible', () => {
    expect(describeViolation({ directive: 'script-src', blocked: 'inline', page: '/x' })).toBe('script-src bloqueó inline en /x');
  });
});
