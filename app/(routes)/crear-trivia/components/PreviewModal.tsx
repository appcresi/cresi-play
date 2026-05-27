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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconEye size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 id="preview-modal-title" className="text-lg font-bold text-gray-900">
                Vista previa
              </h2>
              <p className="text-sm text-gray-500">{triviaName} · {questions.length} preguntas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
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
              <div key={q.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Pregunta {index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{q.question}</p>
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
                            : 'bg-white border-gray-200 text-gray-600'
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
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}