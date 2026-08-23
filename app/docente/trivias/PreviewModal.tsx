'use client';

import { useEffect } from 'react';
import { IconX, IconEye, IconCheck } from '@tabler/icons-react';

interface PreviewQuestion {
  id: string;
  question: string;
  answer: string;
  options: { first: string; second: string; third: string };
}

interface PreviewModalProps {
  isOpen: boolean;
  triviaName: string;
  questions: PreviewQuestion[];
  onClose: () => void;
}

export default function PreviewModal({
  isOpen,
  triviaName,
  questions,
  onClose,
}: PreviewModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-pink-light dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pink-light dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-mint rounded-lg flex items-center justify-center">
              <IconEye size={18} className="text-mint-text" />
            </div>
            <div>
              <h2 id="preview-modal-title" className="text-lg font-bold text-ink dark:text-gray-100">
                Vista previa
              </h2>
              <p className="text-sm text-ink/60 dark:text-gray-400">{triviaName} · {questions.length} preguntas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink/40 dark:text-gray-500 hover:text-ink/70 dark:hover:text-gray-300 hover:bg-pink-light dark:hover:bg-gray-700 rounded-lg transition"
            aria-label="Cerrar vista previa"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Questions list */}
        <div className="overflow-y-auto p-6 space-y-4">
          {questions.map((q, index) => {
            const allOptions = [q.answer, q.options.first, q.options.second, q.options.third];
            return (
              <div key={q.id} className="border border-pink-light dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-cream dark:bg-gray-900/40 px-4 py-3 border-b border-pink-light dark:border-gray-700">
                  <span className="text-xs font-semibold text-ink/40 dark:text-gray-500 uppercase tracking-wider">
                    Pregunta {index + 1}
                  </span>
                  <p className="text-sm font-medium text-ink dark:text-gray-100 mt-1">{q.question}</p>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allOptions.map((option, i) => {
                    const isCorrect = option === q.answer;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                          isCorrect
                            ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                            : 'bg-white dark:bg-gray-900/40 border-pink-light dark:border-gray-700 text-ink/70 dark:text-gray-400'
                        }`}
                      >
                        {isCorrect && (
                          <IconCheck size={14} className="text-green-600 flex-shrink-0" />
                        )}
                        <span>{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pink-light dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-pink-light dark:bg-gray-700 hover:bg-pink dark:hover:bg-gray-600 text-ink dark:text-gray-100 font-semibold rounded-lg transition text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}