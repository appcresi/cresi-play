"use client";
import { useEffect, useState } from 'react';
import { palabras } from '../utils/words';
import AlphabetCircle from './AlphabetCircle';
import DefinitionDisplay from './DefinitionDisplay';
import InputField from './InputField';
import ScoreCounter from './ScoreCounter';
import ProgressBar from './ProgressBar';
import toast, { Toaster } from 'react-hot-toast';
import FinalReport from './FinalReport'; // Importa el nuevo componente
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
  const [incorrectLetters, setIncorrectLetters] = useState<Set<string>>(new Set());
  const [showFinalReport, setShowFinalReport] = useState(false); // Estado para mostrar el informe final
  const [correctWords, setCorrectWords] = useState<{ palabra: string; definicion: string }[]>([]); // Palabras correctas
  const [incorrectWords, setIncorrectWords] = useState<{ palabra: string; definicion: string }[]>([]); // Palabras incorrectas
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
  };



  const handleSubmit = (value: string) => {
    if (!currentWord) return;
    const cleanedInput = value.replace(/\s+/g, '').toLowerCase();
    
    if (cleanedInput === currentWord.palabra.toLowerCase()) {
      setGuessedLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setScore((prev) => prev + 1);
      setCorrectWords((prev) => [...prev, currentWord]); // Agregar palabra correcta
      toast.success('¡Correcto!');
      moveToNextLetter();
    } else {
      toast.error('Incorrecto. Intenta de nuevo.');
      setIncorrectLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setIncorrectWords((prev) => [...prev, currentWord]); // Agregar palabra incorrecta
      setIsIncorrect(true);
      
      setTimeout(() => {
        moveToNextLetter();
      }, 1000);
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
    setShowFinalReport(true); // Muestra el informe final
  };

  const resetGame = () => {
    setCurrentLetterIndex(0);
    setGuessedLetters(new Set());
    setPassedLetters(new Set());
    setIncorrectLetters(new Set());
    setScore(0);
    setProgress(0);
    setIsIncorrect(false);
    setUsedWords([]);
    setShowFinalReport(false);
    getNextWord(); // Get the first word for the new game
    resetTimer(); // Reinicia el temporizador
  };

  const handlePlayAgain = () => {
    resetGame();
    setShowFinalReport(false); // Oculta el informe final al reiniciar
  };

  const handleGoBack = () => {
    window.location.href = '/'; // Lógica para volver a la página anterior
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
    <main className={`px-2 min-h-screen flex flex-col justify-center ${isNightMode ? 'bg-gray-800 text-white' : 'text-black'} gap-4`}>
      {/* Si el juego ha terminado, muestra el informe final */}
      {showFinalReport ? (
        <FinalReport 
          correctWords={correctWords}
          incorrectWords={incorrectWords}
          onPlayAgain={handlePlayAgain}
          onGoBack={handleGoBack}
        />
      ) : (
        <>
          <div className="flex flex-row gap-10 items-center justify-center">
            <ScoreCounter score={score} />
            <ProgressBar progress={progress} total={maxWords} />
          </div>

          <div className="text-center p-2 sm:p-1 border-2 border-violet-600 rounded-lg mt-1 mb-2">
            {currentWord && <DefinitionDisplay definition={currentWord.definicion} />}
          </div>

          <section className="flex flex-col gap-4 items-center pt-4 pb-4 text-center">
            <div className="relative flex justify-center items-center">
              {/* Timer circle wrapper */}
              <div className="absolute w-56 h-56 sm:w-48 sm:h-48 md:w-56 md:h-56 flex justify-center items-center">
                <svg className="absolute inset-0" viewBox="0 0 80 80">
                  <circle className="text-gray-300" strokeWidth="4" stroke="currentColor" fill="none" cx="40" cy="40" r="34" />
                  <circle
                    className="text-current"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="213.628"
                    strokeDashoffset={213.628 * (timeLeft / 30)}
                    stroke={timeLeft > 20 ? "green" : timeLeft > 10 ? "orange" : "red"}
                    fill="none"
                    cx="40"
                    cy="40"
                    r="34"
                    style={{
                      transition: 'stroke-dashoffset 1s linear, stroke 1s linear',
                    }}
                  />
                </svg>
                <div className="absolute bottom-4 flex items-center justify-center text-xl sm:text-lg md:text-2xl font-semibold">
                  {timeLeft}
                </div>
              </div>

              {/* Alphabet circle inside the timer circle */}
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
          </section>
        </>
      )}

      <button onClick={toggleNightMode} className='fixed bottom-4 right-4 py-1 px-2 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-700 transition duration-300 z-50'>
        <Image src={isNightMode ? '/sun-mode.svg' : '/night-mode.svg'} alt="Modo" width={20} height={20} />
      </button>
      <button onClick={handleFullscreen} className='hidden lg:block fixed bottom-4 left-4 py-1 px-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-400 transition duration-300 z-50'>
        <Image src='/full-screen.svg' alt='Pantalla Completa' width={20} height={20} />
      </button>
    </main>


  );
};

export default Home;
