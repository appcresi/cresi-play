'use client';

import {
  type TriviaAnsweredQuestion,
  type TriviaQuestion,
  type TriviaStatus,
} from '@/types/trivia';
import { useCallback, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getSettings, getTriviaStatus, saveTriviaStatus } from '@/utils/trivia';
import { DEFAULT_TIME_IN_SECONDS } from '@/utils/constants';
import TriviaReview from './TriviaReview';
import Image from 'next/image';
import Swal from 'sweetalert2';

const OPTION_COLORS: { [key in 0 | 1 | 2 | 3]: string } = {
  0: 'bg-[#FF6B6B] hover:bg-red-400',
  1: 'bg-[#4ADE80] hover:bg-green-400',
  2: 'bg-[#FFD93D] hover:bg-yellow-400',
  3: 'bg-blue-500 hover:bg-blue-400',
};

const ComicBurst = ({ text, className }: { text: string; className: string }) => (
  <div className={`absolute transform ${className}`}>
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
            fill="#FF6B6B" stroke="black" strokeWidth="3" />
      <text x="50" y="55" textAnchor="middle" 
            className="font-bold text-white text-sm">
        {text}
      </text>
    </svg>
  </div>
);

const ComicStar = ({ className }: { className: string }) => (
  <div className={`absolute ${className}`}>
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#FFD93D" stroke="black" strokeWidth="2"/>
      <text x="50" y="55" textAnchor="middle" className="text-2xl">⭐</text>
    </svg>
  </div>
);


interface TriviaGameProps {
  id: string;
  name: string;
  items: Array<{ question: TriviaQuestion; options: string[] }>;
}

export default function TriviaGame({
  id,
  name,
  items,
}: TriviaGameProps): JSX.Element {
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [correctAnswer, setCorrectIndex] = useState<string | undefined>(
    undefined
  );
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(
    () => getSettings()?.time ?? DEFAULT_TIME_IN_SECONDS
  );
  const [answeredQuestions, setAnsweredQuestions] = useState<
    TriviaAnsweredQuestion[]
  >([]);
  const [isNightMode, setIsNightMode] = useState<boolean>(false); // Estado para el modo nocturno

  const settings = getSettings();

  const handleTimeLeft = useCallback(() => {
    setTimeLeft(settings?.time ?? DEFAULT_TIME_IN_SECONDS);
  }, [settings]);

  const handleContinue = useCallback(() => {
    handleTimeLeft();

    if (currentQuestion === items.length - 1) {
      setIsFinished(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, handleTimeLeft, items.length]);

  const handleAnswer = useCallback(
    (answer: string) => {
      setTimeLeft(undefined);
      setCorrectIndex(items[currentQuestion].question.answer);

      if (answer === items[currentQuestion].question.answer) {
        setScore(score + 1);
        Swal.fire({
          icon: "success",
          title: "¡Genial!",
          text: "¡Respuesta correcta!",
          showConfirmButton: false,
          timer: 500
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "¡Respuesta incorrecta!",
          showConfirmButton: false,
          timer: 500
        });
      }

      setTimeout(() => {
        handleContinue();
      }, 1000);

      setAnsweredQuestions([
        ...answeredQuestions,
        {
          question: items[currentQuestion].question.question,
          answer: items[currentQuestion].question.answer,
          resume: items[currentQuestion].question.resume,
          isCorrect: answer === items[currentQuestion].question.answer,
          userAnswer: answer,
        },
      ]);
    },
    [currentQuestion, answeredQuestions, handleContinue, score]
  );

  const handleFinish = useCallback(() => {
    const status = getTriviaStatus(id);

    const actualPercentage = Math.round((score / items.length) * 100);

    const higherPercentage =
      typeof status !== 'undefined' && status.percentage > actualPercentage
        ? status.percentage
        : actualPercentage;

    const updatedTrivia: TriviaStatus = {
      id: status?.id ?? id,
      percentage: higherPercentage,
      completed: higherPercentage >= 80,
    };

    saveTriviaStatus(updatedTrivia);

    toast.success('Se guardó tu progreso.');
  }, [id, score, items.length]);

  useEffect(() => {
    if (!isFinished) {
      if (typeof timeLeft === 'undefined') return;

      if (timeLeft === 0) {
        toast('¡Se acabó el tiempo!', { duration: 2000, icon: '⏰' });

        setTimeout(() => {
          handleContinue();
        }, 2000);
      } else if (timeLeft > 0) {
        const interval = setInterval(() => {
          setTimeLeft((current) => Number(current) - 1);
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [timeLeft, isFinished, handleContinue]);

  const getColor = (timeLeft: number, totalTime: number) => {
    const ratio = timeLeft / totalTime;
    const red = Math.min(255, Math.floor((1 - ratio) * 255));
    const green = Math.min(255, Math.floor(ratio * 255));
    return `rgb(${red}, ${green}, 0)`;
  };

  const getAnsweredColor = (
    questionsAnswered: number,
    totalQuestions: number
  ) => {
    const ratio = questionsAnswered / totalQuestions;
    const red = Math.min(255, Math.floor((1 - ratio) * 255));
    const green = Math.min(255, Math.floor(ratio * 255));
    return `rgb(${red}, ${green}, 0)`;
  };

  const handleFullscreen = () => {
    const element = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      element.requestFullscreen().catch((err) => {
        toast.error(
          `Error al intentar entrar en pantalla completa: ${err.message}`
        );
      });
    }
  };

  // Calculate the number of questions answered
  const questionsAnswered = currentQuestion;
  const progressPercent = (questionsAnswered / items.length) * 100;

  const toggleNightMode = () => {
    setIsNightMode((prev) => !prev);
  };

  if (isFinished) {
    handleFinish();
    return (
      <>
        <Toaster />
        <TriviaReview
          score={score}
          triviaName={name}
          triviaLength={items.length}
          answeredQuestions={answeredQuestions}
        />
      </>
    );
  }

  return (
    <main className={`min-h-screen ${
      isNightMode ? 'bg-gray-800 text-white' : 'bg-[#FFE5E5]'
    } font-bold relative overflow-hidden`}>
      {/* Decorative elements */}
      <ComicStar className="top-10 right-10 animate-bounce delay-100" />
      <ComicStar className="bottom-20 left-10 animate-bounce delay-300" />
      <ComicBurst text="¡WOW!" className="top-10 left-10 animate-pulse" />
      
      <div className="mx-auto px-4 max-w-5xl relative pt-8">
        {/* Timer and Progress Section */}
        <section className="mb-8">
          <div className="bg-white border-4 border-black p-6 rounded-lg 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <div className="flex justify-between items-center">
              {/* Timer */}
              <div className="text-center">
                <p className="text-[#FF6B6B] text-xl mb-2">Tiempo</p>
                <div className="text-4xl font-black text-black">
                  {timeLeft ?? 0}s
                </div>
              </div>
              
              {/* Progress */}
              <div className="text-center">
                <p className="text-[#4ADE80] text-xl mb-2">Progreso</p>
                <div className="text-4xl font-black text-black">
                  {currentQuestion + 1}/{items.length}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Question Section */}
        <section className="mb-8">
          <div className="bg-white border-4 border-black p-8 rounded-lg 
                         shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
            <h1 className="text-4xl font-black text-[#4ADE80] mb-6"
                style={{ textShadow: '3px 3px 0 #000' }}>
              {name}
            </h1>
            
            <p className="text-2xl text-gray-800 leading-relaxed">
              {items[currentQuestion].question.question}
            </p>
          </div>
        </section>

        {/* Options Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items[currentQuestion].options.map((option, index) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={timeLeft === 0 || timeLeft === undefined}
              className={`${OPTION_COLORS[index]} p-6 rounded-lg font-black text-xl
                         border-4 border-black transform hover:scale-105 hover:-rotate-2
                         transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {option}
            </button>
          ))}
        </section>

        {/* Control Buttons */}
        <div className="fixed bottom-6 right-6 flex gap-4">
          <button
            onClick={handleFullscreen}
            className="bg-[#4ADE80] p-4 rounded-full border-4 border-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-110
                     transition-all duration-300"
          >
            <Image src="/full-screen.svg" alt="Pantalla Completa" width={24} height={24} />
          </button>
          
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="bg-[#FFD93D] p-4 rounded-full border-4 border-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-110
                     transition-all duration-300"
          >
            <Image
              src={isNightMode ? '/sun-mode.svg' : '/night-mode.svg'}
              alt={isNightMode ? 'Modo Día' : 'Modo Noche'}
              width={24}
              height={24}
            />
          </button>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
}