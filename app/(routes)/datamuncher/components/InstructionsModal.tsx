import React from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('datamuncher')?.color ?? '#D32F2F';

type InstructionsModalProps = {
  onAccept: () => void;
};

const InstructionsModal = ({ onAccept }: InstructionsModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
        <div className="h-2" style={{ backgroundColor: ACCENT }} />

        <div className="p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}15` }}
          >
            <IconInfoCircle className="w-9 h-9" style={{ color: ACCENT }} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cómo se juega?</h2>

          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Buscá las ❓ del tablero. Cuando choques con una, va a aparecer una pregunta —
            después dirigite hacia la ✅ si la afirmación es verdadera, o hacia la ❌ si es
            falsa. Evitá a los enemigos y sumá puntos comiendo los puntitos del camino.
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

export default InstructionsModal;
