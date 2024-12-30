'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconSettings } from '@tabler/icons-react';
import type { GameSettings } from '../types/settings';
import { getSettings, saveSettings } from '@/utils/trivia';

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
        className="p-4 flex items-center justify-center text-4xl text-white 
                 transition-transform duration-300 hover:scale-110"
      >
        <IconSettings />
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
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
                                      bg-white border-4 border-black rounded-lg 
                                      shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                                      p-6 transition-all">
                  {/* Title with comic style */}
                  <Dialog.Title 
                    className="text-3xl font-black text-[#4ADE80] mb-6"
                    style={{ textShadow: '2px 2px 0 #000' }}
                  >
                    ¡Configuración!
                  </Dialog.Title>

                  {/* Time selection */}
                  <div className="mb-8">
                    <label className="flex flex-col gap-4">
                      <span className="text-xl font-bold text-[#FF6B6B]">
                        Tiempo de juego
                      </span>
                      <select
                        value={selectedTime}
                        onChange={(e) => handleChangeSettings({ time: Number(e.target.value) })}
                        className="w-full p-3 text-lg font-bold bg-white border-4 border-black rounded-lg
                                 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                 focus:outline-none focus:ring-2 focus:ring-[#4ADE80]
                                 transform transition-transform hover:scale-105"
                      >
                        {[15, 30, 45, 60, 90, 120].map((time) => (
                          <option value={time} key={time}>
                            {time} segundos
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-8">
                    <p className="text-sm font-bold text-gray-600">
                      ¡Los cambios se aplican automáticamente! 🚀
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="bg-[#4ADE80] px-6 py-2 rounded-full font-black text-white
                               border-4 border-black transform hover:scale-105 hover:-rotate-2 
                               transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      ¡LISTO!
                    </button>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 w-16 h-16">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
                            fill="#FFD93D" stroke="black" strokeWidth="3" />
                    </svg>
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