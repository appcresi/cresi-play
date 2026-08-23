import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

type AnswerResultModalProps = {
  correct: boolean;
  points: number;
};

const AnswerResultModal = ({ correct, points }: AnswerResultModalProps) => {
  const accent = correct ? '#16A34A' : '#DC2626';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full overflow-hidden">
        <div className="h-2" style={{ backgroundColor: accent }} />
        <div className="p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: correct ? '#F0FDF4' : '#FEF2F2' }}
          >
            {correct ? (
              <IconCircleCheck className="w-9 h-9" style={{ color: accent }} />
            ) : (
              <IconCircleX className="w-9 h-9" style={{ color: accent }} />
            )}
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: accent }}>
            {correct ? '¡Correcto!' : '¡Incorrecto!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            {correct ? `Sumaste ${points} puntos.` : 'No era esa. Seguí, la próxima pregunta ya viene.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnswerResultModal;
