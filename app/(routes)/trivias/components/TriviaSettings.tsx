'use client';

import type { GameSettings } from '../types/settings';
import { Dialog, Transition } from '@headlessui/react';
import { IconSettings } from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import { getSettings, saveSettings } from '@/utils/trivia';

export default function TriviaSettings(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const settings = getSettings();
  const [selectedTime, setSelectedTime] = useState<number>(
    settings?.time ?? 60
  );

  function handleChangeSettings({ time }: Partial<GameSettings>): void {
    setSelectedTime(time ?? selectedTime); // Actualizar el estado con el tiempo seleccionado
    saveSettings({ time: time ?? selectedTime });
  }

  return (
    <>
      <button
        type='button'
        onClick={() => {
          setIsOpen(true);
        }}
        className='px-8 py-8 mx-auto flex items-center gap-2 rounded-full font-semibold text-4xl bg-primary text-white'
      >
        <IconSettings />
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as='div'
          open={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          className='relative z-10'
        >
          <Transition.Child
            as={Fragment}
            enter='transition ease-out duration-300'
            enterFrom='transform opacity-0'
            enterTo='transform opacity-100'
            leave='transition ease-in duration-200'
            leaveFrom='transform opacity-100'
            leaveTo='transform opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='min-h-full flex items-center justify-center'>
              <Transition.Child
                as={Fragment}
                enter='transition ease-out duration-300'
                enterFrom='transform opacity-0 scale-95'
                enterTo='transform opacity-100 scale-100'
                leave='transition ease-in duration-200'
                leaveFrom='transform opacity-100 scale-100'
                leaveTo='transform opacity-0 scale-95'
              >
                <Dialog.Panel className='p-4 max-w-[95%] rounded-lg bg-white'>
                  <Dialog.Title as='h3' className='mb-4 text-xl font-semibold'>
                    Configuración del juego
                  </Dialog.Title>

                  <span className='flex gap-2 items-center'>
                    <p>Tiempo de juego</p>
                    <select
                      value={selectedTime} // Establecer el valor del select
                      onChange={(e) => {
                        handleChangeSettings({ time: Number(e.target.value) });
                      }}
                    >
                      {[10, 15, 30, 45, 60, 90, 120].map((time) => (
                        <option value={time} key={time}>
                          {time} segundos
                        </option>
                      ))}
                    </select>
                  </span>

                  <span className='mt-4 flex items-center'>
                    <p className='text-sm text-gray-600'>
                      Los cambios se aplican automáticamente.
                    </p>

                    <button
                      type='button'
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      className='px-4 py-2 flex items-center gap-1 rounded-full font-semibold bg-primary-light text-primary-dark'
                    >
                      Cerrar
                    </button>
                  </span>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
