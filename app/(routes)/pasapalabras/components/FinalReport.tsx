import React, { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, ChevronDown, RotateCcw, ExternalLink } from 'lucide-react';

interface Word {
  palabra: string;
  definicion: string;
}

interface FinalReportProps {
  correctWords: Word[];
  incorrectWords: Word[];
  onPlayAgain: () => void;
  onGoBack: () => void;
}

const FinalReport: React.FC<FinalReportProps> = ({ 
  correctWords, 
  incorrectWords, 
  onPlayAgain, 
  onGoBack 
}) => {
  const [expandedSection, setExpandedSection] = useState<'correct' | 'incorrect' | null>(null);
  
  const totalWords = 20;
  const correctCount = correctWords.length;
  const incorrectCount = incorrectWords.length;
  const passedWordsCount = totalWords - (correctCount + incorrectCount);
  const percentageCorrect = (correctCount / totalWords) * 100;

  const data = [
    { name: 'Correctas', value: correctCount },
    { name: 'Incorrectas', value: incorrectCount },
    { name: 'Pasadas', value: passedWordsCount },
  ];

  const calculatePercentage = (value: number) => {
    return ((value / totalWords) * 100).toFixed(1);
  };

  const performanceMessage = percentageCorrect > 65 
    ? "¡Felicidades! Has obtenido más del 65% de respuestas correctas. Hay muchas palabras y definiciones para seguir aprendiendo. ¿Jugamos de nuevo?" 
    : "¡Ánimo! Puedes mejorar, sigue practicando. Recuerda que lo importante es seguir practicando. ¿Jugamos de nuevo?";

  return (
    <section className="p-8 lg:mx-auto lg:max-w-5xl">
      <div className="flex flex-wrap justify-center items-center gap-8 lg:justify-between">
        <div className="flex flex-col gap-6 lg:max-w-[50%]">
          <div className="bg-yellow-200 p-6 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <h1 className="text-4xl font-bold mb-4">¡Pasapalabra ESI!</h1>
            <p className="text-lg">{performanceMessage}</p>
          </div>

          <button 
            onClick={onPlayAgain}
            className="w-fit px-6 py-3 flex gap-2 items-center rounded-full font-bold bg-blue-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <RotateCcw size={20} />
            Jugar de Nuevo
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <div style={{ height: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-white border-2 border-black p-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="font-bold">{payload[0].name}: {payload[0].value} ({calculatePercentage(payload[0].value as number)}%)</p>
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
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10B981', '#ef4444', '#6b7280'][index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 space-y-2 font-bold">
            {[
              { color: '#10B981', label: 'Correctas', value: correctCount },
              { color: '#ef4444', label: 'Incorrectas', value: incorrectCount },
              { color: '#6b7280', label: 'Pasadas', value: passedWordsCount }
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded border-2 border-black" style={{ backgroundColor: item.color }}></span>
                {item.label}: {calculatePercentage(item.value)}%
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {correctCount > 0 && (
          <div className="bg-green-100 rounded-xl border-2 border-black">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'correct' ? null : 'correct')}
              className="w-full p-4 flex items-center justify-between font-bold"
            >
              <span className="flex gap-2 items-center">
                <AlertCircle size={20} />
                <p>Palabras Correctas</p>
              </span>
              <ChevronDown 
                size={20} 
                className={`${expandedSection === 'correct' ? 'rotate-180' : ''} transition-transform`} 
              />
            </button>
            {expandedSection === 'correct' && (
              <div className="p-4 border-t-2 border-black bg-white">
                <ul className="space-y-2">
                  {correctWords.map((word, index) => (
                    <li key={index} className="transform hover:-translate-y-1 transition-transform">
                      <strong>{word.palabra}</strong>: {word.definicion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {incorrectCount > 0 && (
          <div className="bg-red-100 rounded-xl border-2 border-black">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'incorrect' ? null : 'incorrect')}
              className="w-full p-4 flex items-center justify-between font-bold"
            >
              <span className="flex gap-2 items-center">
                <AlertCircle size={20} />
                <p>Palabras Incorrectas</p>
              </span>
              <ChevronDown 
                size={20} 
                className={`${expandedSection === 'incorrect' ? 'rotate-180' : ''} transition-transform`} 
              />
            </button>
            {expandedSection === 'incorrect' && (
              <div className="p-4 border-t-2 border-black bg-white">
                <ul className="space-y-2">
                  {incorrectWords.map((word, index) => (
                    <li key={index} className="transform hover:-translate-y-1 transition-transform">
                      <strong>{word.palabra}</strong>: {word.definicion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={onGoBack}
          className="mt-8 px-6 py-3 flex gap-2 items-center rounded-full font-bold bg-blue-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          <ExternalLink size={20} />
          Volver
        </button>
      </div>
    </section>
  );
};

export default FinalReport;