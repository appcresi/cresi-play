"use client"
import React, { useState, useEffect } from 'react';
import { IconTrophy, IconHeart, IconHeartFilled, IconStarFilled, IconClock, IconCheckbox } from '@tabler/icons-react';

interface GameStatusProps {
  title?: string;
  score?: number;
  lives?: number;
  level?: number;
  timeLeft?: number;
  currentQuestion?: number;
  totalQuestions?: number;
}

const SCORE_STORAGE_KEY = 'totalGameScore';
const LIVES_STORAGE_KEY = 'totalGameLives';

const GameStatusBar = ({
  title = "Super Game",
  score = 0,
  lives = 3,
  level = 1,
  timeLeft,
  currentQuestion,
  totalQuestions
}: GameStatusProps) => {
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [totalLives, setTotalLives] = useState(3);

  // Add storage event listener to detect changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      const savedScore = localStorage.getItem(SCORE_STORAGE_KEY);
      const savedLives = localStorage.getItem(LIVES_STORAGE_KEY);
      
      if (savedScore) {
        const parsedScore = parseInt(savedScore);
        setTotalScore(parsedScore);
        
        if (parsedScore !== totalScore) {
          setIsScoreAnimating(true);
          const timer = setTimeout(() => setIsScoreAnimating(false), 500);
          return () => clearTimeout(timer);
        }
      }
      
      if (savedLives) {
        setTotalLives(parseInt(savedLives));
      }
    };

    // Initial load
    handleStorageChange();

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [totalScore]);

  // Sync prop changes with localStorage
  useEffect(() => {
    if (score !== totalScore) {
      const newTotalScore = score;
      setTotalScore(newTotalScore);
      localStorage.setItem(SCORE_STORAGE_KEY, newTotalScore.toString());
      
      setIsScoreAnimating(true);
      const timer = setTimeout(() => setIsScoreAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [score]);

  // Sync lives prop changes with localStorage
  useEffect(() => {
    if (lives !== totalLives) {
      const newTotalLives = Math.max(0, Math.min(3, lives));
      setTotalLives(newTotalLives);
      localStorage.setItem(LIVES_STORAGE_KEY, newTotalLives.toString());
    }
  }, [lives]);

  return (
    <div className="fixed top-0 left-0 right-0 p-2">
      <div className="relative mx-auto max-w-7xl">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg transform hover:rotate-0 transition-all duration-300">
          <div className="flex sm:flex-wrap items-center justify-between">
            {/* Game Title */}
            <div className="flex items-center space-x-3">
              <IconTrophy
                size={32}
                className="text-[#FFD93D] animate-bounce hidden md:block"
                stroke={2}
              />
              <h1
                className="hidden md:block text-2xl font-black"
                style={{
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                }}
              >
                <span className="text-[#4ADE80]">{title}</span>
              </h1>
            </div>

            {/* Stats Container */}
            <div className="flex items-center space-x-2 h-[50px]">
              {/* Questions Counter */}
              {typeof currentQuestion === 'number' && (
                <div className="h-full bg-purple-500 border-2 border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all flex items-center space-x-2">
                  <IconCheckbox
                    size={24}
                    className="text-white lg:size-[20px] hidden md:block"
                    stroke={2}
                  />
                  <div className="text-center">
                    <div className="text-xs font-bold text-white lg:text-sm hidden md:block">Preguntas</div>
                    <div className="text-sm font-black text-white lg:text-lg">
                      {currentQuestion}/{totalQuestions}
                    </div>
                  </div>
                </div>
              )}

              {/* Current Game Score */}
              <div className="h-full bg-[#FF6B6B] border-2 text-center border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all flex flex-col justify-center">
                <div className="text-xs font-bold text-white lg:text-sm">Puntos</div>
                <div
                  className={`text-sm font-black text-white lg:text-lg ${
                    isScoreAnimating ? 'animate-bounce text-[#FFD93D]' : 'text-white'
                  }`}
                >
                  {totalScore.toLocaleString()}
                </div>
              </div>

              {/* Timer */}
              {typeof timeLeft === 'number' && (
                <div className="h-full bg-[#FFD93D] border-2 border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all flex items-center space-x-2">
                  <IconClock
                    size={24}
                    className="text-black lg:size-[20px] hidden md:block"
                    stroke={2}
                  />
                  <div className="text-center">
                    <div className="text-xs font-bold text-white lg:text-sm hidden md:block">Tiempo</div>
                    <div
                      className={`text-sm font-black text-white lg:text-lg ${
                        timeLeft <= 5 ? 'text-[#FF6B6B] animate-pulse' : 'text-black'
                      }`}
                    >
                      {timeLeft}s
                    </div>
                  </div>
                </div>
              )}

              {/* Level */}
              <div className="h-full bg-[#4ADE80] border-2 border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all flex items-center space-x-2 hidden sm:flex">
                <IconStarFilled
                  size={24}
                  className="text-[#FFD93D] lg:size-[20px] transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                  stroke={2}
                />
                <div className="text-center">
                  <div className="text-xs font-bold text-white lg:text-sm">Level</div>
                  <div className="text-sm font-black text-white lg:text-lg">{level}</div>
                </div>
              </div>

              {/* Lives */}
              <div className="h-full flex items-center space-x-1 bg-white border-2 border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all">
                {/* Small screens: Show lives as a number */}
                <div className="sm:hidden text-center">
                  <div className="text-xs font-bold text-black lg:text-sm">Vidas</div>
                  <div className="text-sm font-black text-black lg:text-lg">{totalLives}</div>
                </div>
                {/* Medium+ screens: Show hearts */}
                <div className="hidden sm:flex space-x-1">
                  {[...Array(3)].map((_, i) =>
                    i < totalLives ? (
                      <IconHeartFilled
                        key={i}
                        size={24}
                        className="text-[#FF6B6B] lg:size-[20px] transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                        stroke={2}
                      />
                    ) : (
                      <IconHeart
                        key={i}
                        size={24}
                        className="text-gray-300 lg:size-[20px] transition-all duration-300 transform scale-90 opacity-50"
                        stroke={2}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatusBar;