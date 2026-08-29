'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowRight, IconTrophy } from '@tabler/icons-react';

interface CertificateRequestFormProps {
  /** Color de acento de la actividad (trivias, lecciones, literatura...) —
   *  cada una tiene el suyo, así el formulario se ve integrado en cualquier
   *  pantalla de resultados donde se use. */
  accent: string;
  /** Texto del label arriba del input — por defecto sirve para trivias y
   *  lecciones (llevan puntaje); literatura pasa uno propio ("certificado
   *  de lectura") porque no hay % que mostrar. */
  ctaLabel?: string;
  /** Arma el body que se manda a POST /api/certificado, ya con el nombre
   *  ingresado. Cada feature (trivia/lección/cuento) manda campos
   *  distintos — el servidor es quien decide qué hacer con `kind`. */
  buildPayload: (name: string) => Record<string, unknown>;
}

export default function CertificateRequestForm({ accent, ctaLabel = 'Obtén tu certificado de finalización', buildPayload }: CertificateRequestFormProps): JSX.Element {
  const [name, setName] = useState<string>();
  const router = useRouter();

  const handleName = (e: React.ChangeEvent<HTMLInputElement>): void => { setName(e.target.value.trim()); };

  const handlePrepareCertificate = (): void => {
    if (name === undefined || name.length === 0) return;

    fetch('/api/certificado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(name))
    })
      .then(async (response) => {
        await response.json().then((value) => {
          router.push(`/trivias/certificado?token=${String(value.token)}`);
        });
      })
      .catch((error) => { console.error(error); });
  };

  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: `${accent}0D`, borderColor: `${accent}30` }}>
      <label className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <IconTrophy size={18} style={{ color: accent }} />
          {ctaLabel}
        </span>

        <input
          onChange={handleName}
          className="px-4 py-2 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': accent } as React.CSSProperties}
          placeholder="Ingresa tu nombre completo"
        />
      </label>

      {(typeof name !== 'undefined' && name.length > 0) && (
        <button
          type="button"
          onClick={handlePrepareCertificate}
          className="mt-3 px-5 py-2 flex items-center gap-2 font-semibold text-sm rounded-full text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: accent }}
        >
          Descargar certificado
          <IconArrowRight size={18} />
        </button>
      )}
    </div>
  );
}
