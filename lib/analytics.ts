declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Antes CrESI no tenía ningún evento clave en Analytics — solo lo genérico
 * que manda gtag.js solo (page_view, scroll, etc.), sin nada que diga si
 * alguien realmente se registró, creó una clase o completó una actividad.
 * Este helper es la forma centralizada de mandar esos eventos desde
 * cualquier parte de la app.
 *
 * Es un no-op silencioso si gtag no cargó todavía (SSR, o la persona
 * todavía no aceptó cookies en CookieConsent — Analytics ni se monta en
 * ese caso) — nunca debe romper el flujo real de la app.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
