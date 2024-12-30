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
    <div className="fixed top-0 left-0 right-0  p-2">
      <div className="relative mx-auto max-w-7xl">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg transform hover:rotate-0 transition-all duration-300">
          <div className="flex items-center justify-between">
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
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' 
            }}
          >
            <span className="text-[#4ADE80]">{title}</span>
          </h1>
        </div>

            {/* Stats Container */}
            <div className="flex items-center space-x-2">
              {/* Score */}
              <div className="bg-[#FF6B6B] border-2 text-center border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all">
                <div className="text-sm font-bold text-white lg:text-xs">Score</div>
                <div className={`text-2xl font-black lg:text-xl ${isScoreAnimating ? 'animate-bounce text-[#FFD93D]' : 'text-white'}`}>
                  {score.toLocaleString()}
                </div>
              </div>

              {/* Level */}
              <div className="bg-[#4ADE80] border-2 border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all flex items-center space-x-2">
                <IconStarFilled 
                  size={24} 
                  className="text-[#FFD93D] lg:size-[20px] hidden md:block"
                  stroke={2}
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-white lg:text-xs">Level</div>
                  <div className="text-xl font-black text-white lg:text-lg">{level}</div>
                </div>
              </div>

              {/* Lives */}
              <div className="flex items-center space-x-1 bg-white border-2 border-black rounded-lg px-4 py-2 lg:px-3 lg:py-1 lg:scale-90 transform hover:scale-105 transition-all">
                {[...Array(3)].map((_, i) => (
                  i < lives ? (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatusBar;