import React from 'react';
import { IconHelp } from '@tabler/icons-react';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('datamuncher')?.color ?? '#D32F2F';

type QuestionModalProps = {
  question: string;
  onAccept: () => void;
};

// Aparece al chocar con una ❓ — antes la pregunta se mostraba en una
// tarjeta chica arriba del tablero mientras el juego seguía corriendo
// (el tiempo bajaba y los enemigos se movían igual). Ahora frena todo
// (ver `showQuestion` en DataMuncher.tsx, que ya pausaba el timer y los
// fantasmas pero nunca se activaba) hasta que se confirma haber leído la
// pregunta con "Aceptar" — recién ahí se puede ir a buscar la ✅ o la ❌.
const QuestionModal = ({ question, onAccept }: QuestionModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full overflow-hidden">
        <div className="h-2" style={{ backgroundColor: ACCENT }} />

        <div className="p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}15` }}
          >
            <IconHelp className="w-9 h-9" style={{ color: ACCENT }} />
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            ¿Verdadero o falso?
          </h2>

          <p className="text-gray-900 dark:text-gray-100 text-lg font-medium mb-6 leading-relaxed">
            {question}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Después de aceptar, dirigite hacia la ✅ si es verdadera o hacia la ❌ si es falsa.
          </p>

          <button
            onClick={onAccept}
            className="w-full text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: ACCENT }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
