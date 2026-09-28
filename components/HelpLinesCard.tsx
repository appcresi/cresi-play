// "¿Necesitás hablar con alguien?": deriva a las líneas de ayuda y al
// contacto de cresi.com.ar. Va en las actividades que tocan temas
// sensibles (salud mental, ánimo, vínculos, situaciones de riesgo).
import { IconArrowRight, IconHeartHandshake } from '@tabler/icons-react';
import { CONTACT_URL, HELPLINES_URL } from '@/lib/cresiWeb';

export default function HelpLinesCard({
  intro = 'Si algo de esto te pasa o te preocupa, no tenés que resolverlo sola ni solo.',
  className = '',
}: {
  intro?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-5 text-left ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
          <IconHeartHandshake className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">¿Necesitás hablar con alguien?</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            {intro} Hablá con un adulto de confianza o comunicate con una línea de ayuda gratuita.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a
              href={HELPLINES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1"
            >
              Ver líneas de ayuda <IconArrowRight className="w-4 h-4" />
            </a>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              Escribirnos <IconArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
