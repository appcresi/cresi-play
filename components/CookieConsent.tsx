'use client';

import { useEffect, useState } from 'react';
import Analytics from './Analytics';
import Adsense from './Adsense';

const CONSENT_KEY = 'cresi_cookie_consent';

type Consent = 'accepted' | 'rejected';

function readStoredConsent(): Consent | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Google Analytics y AdSense solo se cargan si hay consentimiento — antes
 * arrancaban siempre, sin avisar ni dar la opción de rechazarlos. Arranca
 * en `null` (nada renderizado) para que coincida con el HTML del servidor;
 * recién en el efecto leemos localStorage y decidimos qué mostrar.
 */
export default function CookieConsent(): JSX.Element {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setHydrated(true);
  }, []);

  const decide = (value: Consent) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Sin localStorage (modo privado, etc.): igual respetamos la
      // elección para esta sesión, solo que se va a volver a preguntar
      // la próxima vez.
    }
    setConsent(value);
  };

  return (
    <>
      {consent === 'accepted' && (
        <>
          <Analytics />
          <Adsense />
        </>
      )}

      {hydrated && consent === null && (
        <div className="fixed bottom-0 inset-x-0 z-[9998] p-3 sm:p-4 flex justify-center pointer-events-none">
          <div
            className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-ink/10 dark:border-gray-700 p-4 sm:p-5
                     flex flex-col sm:flex-row sm:items-center gap-4 pointer-events-auto"
            role="region"
            aria-label="Aviso de cookies"
          >
            <p className="text-xs sm:text-sm text-ink/70 dark:text-gray-400 leading-relaxed flex-1">
              Usamos cookies propias y de terceros (Google Analytics y Google AdSense) para
              entender cómo se usa CrESI y mantenerlo gratuito. Podés aceptarlas o rechazarlas
              — conocé más en nuestra{' '}
              <a
                href="https://cresi.com.ar/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-coral-dark hover:underline"
              >
                política de privacidad
              </a>
              .
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => decide('rejected')}
                className="px-4 py-2 rounded-full border border-ink/15 dark:border-gray-600 text-ink/70 dark:text-gray-300 text-xs sm:text-sm
                         font-semibold hover:bg-cream dark:hover:bg-gray-700 transition-colors"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => decide('accepted')}
                className="px-4 py-2 rounded-full bg-coral hover:bg-coral-dark text-white text-xs sm:text-sm
                         font-semibold transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
