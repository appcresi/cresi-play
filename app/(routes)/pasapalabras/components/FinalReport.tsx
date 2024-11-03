import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconChevronDown, IconExternalLink } from '@tabler/icons-react'
import { Disclosure, Transition } from '@headlessui/react';

type FinalReportProps = {
  correctWords: { palabra: string; definicion: string }[];
  incorrectWords: { palabra: string; definicion: string }[];
  onPlayAgain: () => void;
  onGoBack: () => void;
};

const FinalReport: React.FC<FinalReportProps> = ({
  correctWords,
  incorrectWords,
  onPlayAgain,
  onGoBack,
}) => {
  const totalWords = 20; // Total number of words
  const correctCount = correctWords.length;
  const incorrectCount = incorrectWords.length;
  const passedWordsCount = totalWords - (correctCount + incorrectCount); // Calculate passed words
  const percentageCorrect = (correctCount / totalWords) * 100; // Calculate percentage of correct answers

  // Data for the pie chart
  const data = [
    { name: 'Correctas', value: correctCount },
    { name: 'Incorrectas', value: incorrectCount },
    { name: 'Pasadas', value: passedWordsCount },
  ];

  // Function to calculate percentage
  const calculatePercentage = (value: number) => {
    return ((value / totalWords) * 100).toFixed(1); // Returns percentage as a string
  };

  // Message based on performance
  const performanceMessage = percentageCorrect > 65 
    ? "¡Felicidades! Has obtenido más del 65% de respuestas correctas. Hay muchas palabras y definiciones para seguir aprendiendo. ¿Jugamos de nuevo?" 
    : "¡Ánimo! Puedes mejorar, sigue practicando. Recuerda que lo importante es seguir practicando. ¿Jugamos de nuevo?";

  return (
    <section className='p-4 lg:mx-auto lg:max-w-5xl'>
    <div className="flex flex-wrap justify-center items-center lg:justify-between">
        <span className='flex flex-col gap-4 lg:max-w-[50%]'>
            <span>
                <h1 className='my-4 text-4xl font-bold'>
                ¡Pasapalabra ESI!
                </h1>

                <p className='max-w-[48ch] text-lg text-gray-600'>
                    {performanceMessage}
                </p>
            </span>
            <button onClick={onPlayAgain} className="w-fit px-4 py-2 flex gap-2 items-center rounded-full font-semibold bg-primary text-white">
            <IconArrowLeft />
            Jugar de Nuevo
            </button>
        </span>

        <div className="mb-1" style={{ height: '300px' }}> {/* Adjusted margin here */}
        <ResponsiveContainer>
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0 && payload[0].value !== undefined) {
                  return (
                    <div className="bg-white border border-gray-300 p-2 rounded shadow-lg">
                      <p>{payload[0].name}: {payload[0].value} ({calculatePercentage(payload[0].value as number)}%)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#10B981', '#ef4444', '#6b7280'][index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-1"> {/* Adjusted margin here */}
        <ul className="list-disc pl-5">
          <li className='list-none'>
            <span className="inline-block w-4 h-4 mr-2 rounded" style={{ backgroundColor: '#10B981' }}></span>
            Correctas: {calculatePercentage(correctCount)}%
          </li>
          <li className='list-none'>
            <span className="inline-block w-4 h-4 mr-2 rounded" style={{ backgroundColor: '#ef4444' }}></span>
            Incorrectas: {calculatePercentage(incorrectCount)}%
          </li>
          <li className='list-none'>
            <span className="inline-block w-4 h-4 mr-2 rounded" style={{ backgroundColor: '#6b7280' }}></span>
            Pasadas: {calculatePercentage(passedWordsCount)}%
          </li>
        </ul>
      </div>

      {/* Only display this section if there are correct words */}
      {correctCount > 0 && (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full p-2 flex items-center justify-between rounded-lg bg-primary-light text-primary-dark mb-1">
                <span className='flex gap-2 items-center'>
                    <IconAlertCircle />
                    <p>Palabras Correctas</p>
                </span>
                <IconChevronDown
                className={`${open ? 'rotate-180 transform' : ''} transition duration-100`}
                />
              </Disclosure.Button>
              <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition ease-in duration-200"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="px-4 pt-2 pb-2 text-gray-600">
                  <ul className="list-disc pl-5">
                    {correctWords.map((word, index) => (
                      <li key={index}>
                        <strong>{word.palabra}</strong>: {word.definicion}
                      </li>
                    ))}
                  </ul>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}

      {/* Only display this section if there are incorrect words */}
      {incorrectCount > 0 && (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full p-2 flex items-center justify-between rounded-lg bg-primary-light text-primary-dark">
                <span className='flex gap-2 items-center'>
                    <IconAlertCircle />
                    <p>Palabras Incorrectas</p>
                </span>
                <IconChevronDown
                className={`${open ? 'rotate-180 transform' : ''} transition duration-100`}
                />
              </Disclosure.Button>
              <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition ease-in duration-200"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="px-4 pt-2 pb-2 text-gray-600">
                  <ul className="list-disc pl-5">
                    {incorrectWords.map((word, index) => (
                      <li key={index}>
                        <strong>{word.palabra}</strong>: {word.definicion}
                      </li>
                    ))}
                  </ul>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}

      <div className="flex justify-between mt-4">
        
        <button onClick={onGoBack} className="w-fit px-4 py-2 flex gap-2 items-center rounded-full font-semibold bg-primary text-white">
          <IconExternalLink />
          Volver
        </button>
      </div>
    </div>
  </section>
  );
};

export default FinalReport;
