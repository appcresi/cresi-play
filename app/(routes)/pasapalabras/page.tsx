"use client";
import { useEffect, useState } from 'react';
import { palabras } from './utils/words';
import AlphabetCircle from './components/AlphabetCircle';
import DefinitionDisplay from './components/DefinitionDisplay';
import InputField from './components/InputField';
import ScoreCounter from './components/ScoreCounter';
import ProgressBar from './components/ProgressBar';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

type LetterKey = keyof typeof palabras;
const letters = Object.keys(palabras) as LetterKey[];

const Home = () => {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<{ palabra: string; definicion: string } | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [passedLetters, setPassedLetters] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  
  // Array para almacenar las palabras ya jugadas
  const [usedWords, setUsedWords] = useState<{ palabra: string; definicion: string }[]>([]);

  const maxWords = 20;

  // Función para obtener la siguiente palabra
  const getNextWord = () => {
    const currentLetter = letters[currentLetterIndex];
    const wordsForLetter = palabras[currentLetter];

    // Filtrar las palabras que ya han sido usadas
    const unusedWords = wordsForLetter.filter(word => !usedWords.some(uw => uw.palabra === word.palabra));

    if (unusedWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedWords.length);
      setCurrentWord(unusedWords[randomIndex]);
      setUsedWords(prev => [...prev, unusedWords[randomIndex]]); // Agregar palabra usada
    } else {
      moveToNextLetter();
    }
  };

  const moveToNextLetter = () => {
    setCurrentLetterIndex((prevIndex) => (prevIndex + 1) % letters.length);
    setIsIncorrect(false);
  };

  const handleSubmit = (value: string) => {
    if (currentWord && value.toLowerCase() === currentWord.palabra.toLowerCase()) {
      setGuessedLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setScore((prev) => prev + 1);
      toast.success('¡Correcto!');
      moveToNextLetter();
    } else {
      toast.error('Incorrecto. Intenta de nuevo.');
      setIsIncorrect(true);
    }
    setProgress((prev) => prev + 1);

    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handlePass = () => {
    const currentLetter = letters[currentLetterIndex];
    setPassedLetters((prev) => new Set(prev).add(currentLetter));
    moveToNextLetter();
    setProgress((prev) => prev + 1);

    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handleHelp = () => {
    if (currentWord) {
      const scrambledLetters = currentWord.palabra
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('-');
      toast.success(`Pista: La palabra tiene ${currentWord.palabra.length} letras: ${scrambledLetters}`);
    }
  };

  const handleGameEnd = () => {
    const playAgain = window.confirm('¡Has completado las 20 palabras! ¿Quieres jugar otra vez?');
    if (playAgain) {
      resetGame();
    } else {
      window.location.href = '/';
    }
  };

  const resetGame = () => {
    setCurrentLetterIndex(0);
    setGuessedLetters(new Set());
    setPassedLetters(new Set());
    setScore(0);
    setProgress(0);
    setIsIncorrect(false);
    setUsedWords([]); // Reiniciar el array de palabras usadas
    getNextWord();
  };

  const toggleNightMode = () => {
    setIsNightMode((prev) => !prev);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al intentar activar el modo de pantalla completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    getNextWord();
  }, [currentLetterIndex]);

  return (
    <main
        className={`px-4 min-h-screen flex flex-col justify-center ${
          isNightMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
        } lg:gap-8 lg:justify-center`}
      >
      <section className='flex flex-col gap-4 justify-center items-center pt-8 pb-1 text-center'>
        <div className="relative flex justify-center items-center">
          <AlphabetCircle 
            letters={letters} 
            guessedLetters={guessedLetters} 
            passedLetters={passedLetters}
            isIncorrect={isIncorrect} 
            currentLetter={letters[currentLetterIndex]} 
          />
          {currentWord && <DefinitionDisplay definition={currentWord.definicion} />}
        </div>
        {currentWord && <InputField onSubmit={handleSubmit} onPass={handlePass} onHelp={handleHelp} />}
        <ScoreCounter score={score} />
        <ProgressBar progress={progress} total={maxWords} />
        <Toaster />

        {/* Floating Night Mode Button (bottom-right) */}
        <button
          type='button'
          onClick={toggleNightMode}
          className='fixed bottom-2 right-4 py-1 px-2 bg-gray-900 rounded-lg shadow-md hover:bg-gray-700 transition duration-300 z-50'
        >
          {isNightMode ? (
            <Image
              src='/sun-mode.svg'
              alt='Modo Diurno'
              width={18}
              height={12}
            />
          ) : (
            <Image
              src='/night-mode.svg'
              alt='Modo Nocturno'
              width={18}
              height={12}
            />
          )}
        </button>

        {/* Floating Fullscreen Button (hidden on mobile) */}
        <button
          type='button'
          onClick={handleFullscreen}
          className='hidden lg:block fixed bottom-2 left-4 py-1 px-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-400 transition duration-300 z-50'
        >
          <Image
            src='/full-screen.svg'
            alt='Pantalla Completa'
            width={18}
            height={12}
          />
        </button>
      </section>
    </main>
  );
};

export default Home;
