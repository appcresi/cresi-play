import React, { useState, useEffect } from 'react';
import { IconTrophy, IconHeart, IconHeartFilled, IconStarFilled } from '@tabler/icons-react';

interface GameStatusProps {
  title?: string;
  score?: number;
  lives?: number;
  level?: number;
}

const GameStatusBar = ({
  title = "Super Game",
  score = 0,
  lives = 3,
  level = 1
}: GameStatusProps) => {
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const [prevScore, setPrevScore] = useState(score);

  useEffect(() => {
    if (score !== prevScore) {
      setIsScoreAnimating(true);
      setPrevScore(score);
      const timer = setTimeout(() => setIsScoreAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [score, prevScore]);

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Título del juego */}
        <div className="flex items-center space-x-2">
          <IconTrophy 
            size={32} 
            className="text-yellow-400 animate-pulse" 
            stroke={1.5}
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>

        {/* Contenedor central */}
        <div className="flex items-center space-x-8">
          {/* Puntuación */}
          <div className="flex flex-col items-center">
            <div className="text-sm text-purple-200">Score</div>
            <div className={`text-2xl font-bold ${isScoreAnimating ? 'animate-bounce text-yellow-300' : 'text-white'}`}>
              {score.toLocaleString()}
            </div>
          </div>

          {/* Nivel */}
          <div className="flex items-center space-x-2">
            <IconStarFilled 
              size={24} 
              className="text-yellow-400"
              stroke={1.5}
            />
            <div>
              <div className="text-sm text-purple-200">Level</div>
              <div className="text-xl font-bold">{level}</div>
            </div>
          </div>

          {/* Vidas */}
          <div className="flex items-center space-x-1">
            {[...Array(3)].map((_, i) => (
              i < lives ? (
                <IconHeartFilled
                  key={i}
                  size={24}
                  className="text-red-500 transition-all duration-300 transform hover:scale-110"
                  stroke={1.5}
                />
              ) : (
                <IconHeart
                  key={i}
                  size={24}
                  className="text-gray-600 transition-all duration-300 transform scale-90 opacity-50"
                  stroke={1.5}
                />
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatusBar;