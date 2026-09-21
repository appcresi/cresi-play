// lib/cspReport.ts
//
// Lectura de los informes de violación de la política de seguridad de
// contenido (CSP) que manda el navegador a /api/csp-report. Pura, para poder
// probarla sin levantar Next.
//
// El navegador manda dos formatos según la versión:
//   - clásico (`report-uri`):  { "csp-report": { "violated-directive", "blocked-uri", "document-uri" } }
//   - Reporting API:           [ { type: "csp-violation", body: { effectiveDirective, blockedURL, documentURL } } ]
//
// Por privacidad NO se guarda la URL completa: del recurso bloqueado solo el
// origen (o una palabra clave como "inline" / "eval"), y de la página solo la
// ruta, sin parámetros — pueden traer códigos de clase, etc.

export interface CspViolation {
  /** Directiva violada, sin el valor: "script-src", "connect-src"… */
  directive: string;
  /** Origen bloqueado, o "inline" / "eval" / "data" / "blob" / "(desconocido)". */
  blocked: string;
  /** Ruta de la página donde pasó (sin dominio ni parámetros). */
  page: string;
}

const MAX_FIELD = 120;
const clip = (value: string) => value.slice(0, MAX_FIELD);

function blockedLabel(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return '(desconocido)';
  if (['inline', 'eval', 'data', 'blob', 'self', 'wasm-eval', 'trusted-types-policy'].includes(raw)) return raw;
  if (raw.startsWith('data:')) return 'data';
  if (raw.startsWith('blob:')) return 'blob';
  try {
    return clip(new URL(raw).origin);
  } catch {
    return clip(raw.split(/[?#]/)[0]);
  }
}

function pageLabel(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return '(desconocida)';
  try {
    return clip(new URL(raw).pathname);
  } catch {
    return '(desconocida)';
  }
}

function directiveLabel(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return '(desconocida)';
  return clip(raw.trim().split(/\s+/)[0]);
}

export function parseCspReport(body: unknown): CspViolation[] {
  const out: CspViolation[] = [];

  const legacy = (body as { 'csp-report'?: Record<string, unknown> } | null)?.['csp-report'];
  if (legacy && typeof legacy === 'object') {
    out.push({
      directive: directiveLabel(legacy['effective-directive'] ?? legacy['violated-directive']),
      blocked: blockedLabel(legacy['blocked-uri']),
      page: pageLabel(legacy['document-uri']),
    });
    return out;
  }

  if (Array.isArray(body)) {
    for (const item of body.slice(0, 20)) {
      const report = item as { type?: unknown; body?: Record<string, unknown> } | null;
      if (report?.type !== 'csp-violation' || !report.body || typeof report.body !== 'object') continue;
      out.push({
        directive: directiveLabel(report.body.effectiveDirective ?? report.body.violatedDirective),
        blocked: blockedLabel(report.body.blockedURL),
        page: pageLabel(report.body.documentURL),
      });
    }
  }
  return out;
}

export const describeViolation = (v: CspViolation): string => `${v.directive} bloqueó ${v.blocked} en ${v.page}`;

/**
 * Recuerda las violaciones ya vistas para registrar cada combinación UNA vez:
 * una sola página con un recurso bloqueado manda un informe por carga, y sin
 * esto el log de producción se llenaría de la misma línea.
 */
export function createDedupe(limit = 500) {
  const seen = new Set<string>();
  return (v: CspViolation): boolean => {
    const key = `${v.directive}|${v.blocked}|${v.page}`;
    if (seen.has(key)) return false;
    if (seen.size >= limit) seen.clear(); // tope de memoria: mejor repetir una línea que crecer sin fin
    seen.add(key);
    return true;
  };
}
