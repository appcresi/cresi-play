"use client";
// pages/crucigrama.tsx
import { palabras } from '../utils/words'; 
import { useState, useEffect } from 'react';

interface Palabra {
  palabra: string;
  definicion: string;
}

const Crucigrama = () => {
  const [selectedWords, setSelectedWords] = useState<Palabra[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    const randomWords = selectRandomWords(10);
    setSelectedWords(randomWords);
    setUserAnswers(Array(randomWords.length).fill(''));
    setLoading(false);
  }, []);

  const selectRandomWords = (count: number) => {
    const allWords = Object.values(palabras).flat();
    const shuffledWords = allWords.sort(() => 0.5 - Math.random());
    return shuffledWords.slice(0, count);
  };

  const handleInputChange = (index: number, value: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = value;
    setUserAnswers(updatedAnswers);
  };

  const checkAnswers = () => {
    const correctAnswers = selectedWords.map(word => word.palabra);
    const updatedResults = userAnswers.map((answer, index) => 
      answer.toLowerCase() === correctAnswers[index].toLowerCase()
    );
    setResults(updatedResults);
  };

  if (loading) {
    return <div className="text-center">Cargando...</div>;
  }

  return (
    <div className="flex flex-col items-center bg-gradient-to-r from-green-400 to-blue-500 min-h-screen py-6 px-4">
      <h1 className="text-3xl font-bold text-white mb-4">Crucigrama</h1>
      <h2 className="mt-4 text-xl text-white">Definiciones:</h2>
      <ul className="mb-4 w-full max-w-md">
        {selectedWords.map((word, index) => (
          <li key={index} className="flex items-center justify-between w-full mb-2 p-2 bg-white rounded-lg shadow-md">
            <span className="text-gray-800">{word.definicion}</span>
            <div className="flex items-center">
              <input
                type="text"
                value={userAnswers[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder={`Letras: ${word.palabra.length}`}
                className="border border-gray-300 rounded p-1 ml-2 w-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {results.length > 0 && (
                <span className="ml-2">
                  {results[index] ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <button
        onClick={checkAnswers}
        className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded p-2 transition-all duration-300 shadow-lg"
      >
        Comprobar Respuestas
      </button>
    </div>
  );
};

export default Crucigrama;
