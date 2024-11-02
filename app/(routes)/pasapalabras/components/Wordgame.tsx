"use client";
import { useEffect, useState } from 'react';
import { palabras } from '../utils/words';
import AlphabetCircle from './AlphabetCircle';
import DefinitionDisplay from './DefinitionDisplay';
import InputField from './InputField';
import ScoreCounter from './ScoreCounter';
import ProgressBar from './ProgressBar';
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
  const [usedWords, setUsedWords] = useState<{ palabra: string; definicion: string }[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(30); // Timer state
  const [timerActive, setTimerActive] = useState(false); // Timer control state

  const maxWords = 20;

  const getNextWord = () => {
    const currentLetter = letters[currentLetterIndex];
    const wordsForLetter = palabras[currentLetter];
    const unusedWords = wordsForLetter.filter(word => !usedWords.some(uw => uw.palabra === word.palabra));

    if (unusedWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedWords.length);
      setCurrentWord(unusedWords[randomIndex]);
      setUsedWords(prev => [...prev, unusedWords[randomIndex]]);
      resetTimer(); // Reset timer when getting a new word
    } else {
      moveToNextLetter();
    }
  };

  const resetTimer = () => {
    setTimeLeft(30);
    setTimerActive(true);
  };

  const moveToNextLetter = () => {
    setCurrentLetterIndex((prevIndex) => (prevIndex + 1) % letters.length);
    setIsIncorrect(false);
    setProgress((prev) => prev + 1);
    resetTimer(); // Reset timer when moving to next letter
  };

  const [incorrectLetters, setIncorrectLetters] = useState<Set<string>>(new Set());

// Modificar handleSubmit para actualizar incorrectLetters en caso de error
const handleSubmit = (value: string) => {
  if (!currentWord) return;
  if (currentWord && value.toLowerCase() === currentWord.palabra.toLowerCase()) {
    setGuessedLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
    setScore((prev) => prev + 1);
    toast.success('¡Correcto!');
    moveToNextLetter();
  } else {
    toast.error('Incorrecto. Intenta de nuevo.');
    setIncorrectLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
    setIsIncorrect(true);
    
    // Mueve a la siguiente letra después de un breve retraso
    setTimeout(() => {
      moveToNextLetter();
    }, 1000); // Espera 1 segundo antes de mover a la siguiente letra
  }

  if (progress + 1 === maxWords) {
    handleGameEnd();
  }
};


  const handlePass = () => {
    const currentLetter = letters[currentLetterIndex];
    setPassedLetters((prev) => new Set(prev).add(currentLetter));
    moveToNextLetter();
    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handleHelp = () => {
    if (currentWord) {
      const scrambledLetters = currentWord.palabra.split('').sort(() => Math.random() - 0.5).join('-');
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
    setGuessedLetters(new Set()); // Limpia las letras adivinadas
    setPassedLetters(new Set());  // Limpia las letras pasadas
    setIncorrectLetters(new Set()); // Limpia las letras incorrectas
    setScore(0);
    setProgress(0);
    setIsIncorrect(false);
    setUsedWords([]);
    resetTimer(); // Reinicia el temporizador
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

  // Timer logic
  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      handlePass(); // Automatically pass if time runs out
      setTimerActive(false); // Stop timer
    }
  }, [timerActive, timeLeft]);

  return (
    <main className={`px-4 h-screen flex flex-col justify-center ${isNightMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'} gap-8 overflow-hidden relative`}>
      <div className="flex flex-row gap-4 items-center justify-center">
        <ScoreCounter score={score} />
        <ProgressBar progress={progress} total={maxWords} />
        {/* Timer Display */}
        <div className="flex flex-col items-center">
          <p className="font-medium text-lg">Tiempo</p>
          <div className="relative w-16 h-16">
            <svg className="absolute inset-0" viewBox="0 0 24 24">
              <circle className="text-gray-300" strokeWidth="4" stroke="currentColor" fill="none" cx="12" cy="12" r="10" />
              <circle
                className="text-current"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="62.83185307179586"
                strokeDashoffset={62.83185307179586 * (timeLeft / 30)} // Calculate the dash offset
                stroke={timeLeft > 20 ? "green" : timeLeft > 10 ? "orange" : "red"}
                fill="none"
                cx="12"
                cy="12"
                r="10"
                style={{
                  transition: 'stroke-dashoffset 1s linear, stroke 1s linear',
                }}
              />
            </svg>
            <div className="flex items-center justify-center absolute inset-0 text-2xl font-semibold">
              {timeLeft}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center p-6 border-2 border-violet-600 rounded-lg mt-4">
        {currentWord && <DefinitionDisplay definition={currentWord.definicion} />}
      </div>

      <section className="flex flex-col gap-8 items-center pt-8 pb-8 text-center overflow-y-auto">
        <div className="relative flex justify-center items-center">
          <AlphabetCircle 
            letters={letters} 
            guessedLetters={guessedLetters} 
            passedLetters={passedLetters} 
            incorrectLetters={incorrectLetters} 
            currentLetter={letters[currentLetterIndex]} 
          />

          <div className="absolute inset-0 flex justify-center items-center">
            {currentWord && <InputField onSubmit={handleSubmit} onPass={handlePass} onHelp={handleHelp} />}
          </div>
        </div>

        <Toaster />

        <button onClick={toggleNightMode} className='fixed bottom-4 right-4 py-2 px-3 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300 z-50'>
          <Image src={isNightMode ? '/sun-mode.svg' : '/night-mode.svg'} alt="Modo" width={20} height={20} />
        </button>
        <button onClick={handleFullscreen} className='hidden lg:block fixed bottom-4 left-4 py-2 px-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-400 transition duration-300 z-50'>
          <Image src='/full-screen.svg' alt='Pantalla Completa' width={20} height={20} />
        </button>
      </section>
    </main>

  );
};

export default Home;
