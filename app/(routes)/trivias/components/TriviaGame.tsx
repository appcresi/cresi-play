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

const OPTION_COLORS: Record<number, string> = {
  0: 'bg-red-500 hover:bg-red-400',
  1: 'bg-blue-500 hover:bg-blue-400',
  2: 'bg-yellow-500 hover:bg-yellow-400',
  3: 'bg-green-500 hover:bg-green-400',
};

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

      if (answer === items[currentQuestion].question.answer) {
        setScore(score + 1);
        toast.success('¡Respuesta correcta!', { duration: 1000 });
      } else {
        toast.error('¡Respuesta incorrecta!', { duration: 1000 });
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
    <>
      <main
        className={`px-4 min-h-screen flex flex-col justify-center ${
          isNightMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
        } lg:gap-8 lg:justify-center`}
      >
        {/* Combined Time Remaining and Questions Answered */}
        <div className='flex justify-center gap-10 mb-4'>
          {/* Time Remaining */}
          <div className='flex flex-col items-center'>
            <p className='font-medium text-lg'>Tiempo</p>
            <div className='relative w-16 h-16'>
              <svg className='absolute inset-0' viewBox='0 0 24 24'>
                <circle
                  className='text-gray-300'
                  strokeWidth='4'
                  stroke='currentColor'
                  fill='none'
                  cx='12'
                  cy='12'
                  r='10'
                />
                <circle
                  className='text-current'
                  strokeWidth='4'
                  strokeLinecap='round'
                  strokeDasharray='62.83185307179586'
                  strokeDashoffset={
                    (62.83185307179586 * (timeLeft ?? 0)) /
                    (settings?.time ?? DEFAULT_TIME_IN_SECONDS)
                  }
                  stroke={getColor(
                    timeLeft ?? 0,
                    settings?.time ?? DEFAULT_TIME_IN_SECONDS
                  )}
                  fill='none'
                  cx='12'
                  cy='12'
                  r='10'
                  style={{
                    transition: 'stroke-dashoffset 1s linear, stroke 1s linear',
                  }}
                />
              </svg>
              <div className='flex items-center justify-center absolute inset-0 text-2xl font-semibold'>
                {timeLeft ?? 0}
              </div>
            </div>
          </div>

          {/* Questions Answered (without circle) */}
          <div className='flex flex-col items-center'>
            <p className='font-medium text-lg'>Preguntas</p>
            <div className='relative w-16 h-16 flex items-center justify-center'>
              <div className='text-lg font-semibold'>
                {questionsAnswered + 1}/{items.length}
              </div>
            </div>
          </div>
        </div>

        {/* Trivia Name */}
        <div className='flex justify-center mb-6'>
          <h1 className='text-3xl font-bold'>{name}</h1>
        </div>

        {/* Current Question */}
        <div className='flex flex-col items-center'>
          <p className='my-4 text-3xl font-semibold lg:text-4xl text-center'>
            {items[currentQuestion].question.question}
          </p>
          <div className='flex flex-col gap-2 justify-center lg:min-w-full lg:grid lg:grid-cols-2'>
            {items[currentQuestion].options.map((option, index) => (
              <button
                type='button'
                key={option}
                aria-details={`Opción ${index}: ${option}`}
                disabled={timeLeft === 0 || timeLeft === undefined}
                onClick={() => {
                  handleAnswer(option);
                }}
                className={`w-full py-3 px-4 rounded-md shadow-md text-lg transition duration-300 ease-in-out ${OPTION_COLORS[index]} lg:min-h-[6em] lg:min-w-[12em] disabled:bg-gray-300 disabled:text-gray-800`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Fullscreen Button (hidden on mobile) */}
        <button
          type='button'
          onClick={handleFullscreen}
          className='hidden lg:block fixed bottom-2 left-4 py-1 px-2  bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-400 transition duration-300 z-50'
        >
          <Image
            src='/full-screen.svg'
            alt='Pantalla Completa'
            width={18}
            height={12}
          />
        </button>

        {/* Floating Night Mode Button (top-right) */}
        <button
          type='button'
          onClick={toggleNightMode}
          className='fixed bottom-2 right-4 py-1 px-2 bg-gray-900 rounded-lg shadow-md hover:bg-gray-700 transition duration-300 z-50'
        >
          {isNightMode ? (
            <Image
              src='/sun-mode.svg'
              alt='Pantalla Completa'
              width={18}
              height={12}
            />
          ) : (
            <Image
              src='/night-mode.svg'
              alt='Pantalla Completa'
              width={18}
              height={12}
            />
          )}
        </button>
      </main>

      <Toaster />
    </>
  );
}
