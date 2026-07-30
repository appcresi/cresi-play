'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconSettings, IconClock, IconX } from '@tabler/icons-react';
import type { GameSettings } from '../types/settings';
import { getSettings, saveSettings } from '@/utils/trivia';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('trivias')?.color ?? '#1976D2';

export default function TriviaSettings(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const settings = getSettings();
  const [selectedTime, setSelectedTime] = useState<number>(
    settings?.time ?? 60
  );

  function handleChangeSettings({ time }: Partial<GameSettings>): void {
    setSelectedTime(time ?? selectedTime);
    saveSettings({ time: time ?? selectedTime });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center text-white transition-colors duration-200"
        aria-label="Configuración"
      >
        <IconSettings size={20} />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden 
                                      bg-white rounded-xl shadow-xl border border-gray-100
                                      transition-all">
                  {/* Header */}
                  <div className="px-6 py-4" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="text-lg font-bold text-white flex items-center gap-2">
                        <IconSettings size={22} />
                        Configuración
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                        aria-label="Cerrar"
                      >
                        <IconX size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Time selection */}
                    <div className="mb-6">
                      <label className="flex flex-col gap-3">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <IconClock size={18} style={{ color: ACCENT }} />
                          Tiempo por pregunta
                        </span>
                        <select
                          value={selectedTime}
                          onChange={(e) => handleChangeSettings({ time: Number(e.target.value) })}
                          className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl
                                   focus:outline-none focus:ring-2 focus:border-transparent
                                   transition-all cursor-pointer hover:border-gray-400"
                          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                        >
                          {[15, 30, 45, 60, 90, 120].map((time) => (
                            <option value={time} key={time}>
                              {time} segundos
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        💡 Este tiempo se aplicará a todas las preguntas de la trivia
                      </p>
                    </div>

                    {/* Info box */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${ACCENT}0D`, border: `1px solid ${ACCENT}30` }}>
                      <p className="text-sm" style={{ color: ACCENT }}>
                        ✓ Los cambios se guardan automáticamente
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-2 text-white rounded-full font-semibold
                               hover:opacity-90 transition-colors focus:outline-none 
                               focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Cerrar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}