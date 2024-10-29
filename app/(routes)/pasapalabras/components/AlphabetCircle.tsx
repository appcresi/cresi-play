import React from 'react';

interface AlphabetCircleProps {
  letters: string[];
  guessedLetters: Set<string>;
  passedLetters: Set<string>;
  isIncorrect: boolean;
  currentLetter: string;
}

const AlphabetCircle: React.FC<AlphabetCircleProps> = ({ letters, guessedLetters, passedLetters, isIncorrect, currentLetter }) => {
  const radius = 140;
  const center = 128;

  return (
    <div className="relative w-64 h-64 mx-auto my-10">
      <div>
        {letters.map((letter, index) => {
          const angle = (index / letters.length) * 2 * Math.PI;
          const x = center + radius * Math.cos(angle) - 20;
          const y = center + radius * Math.sin(angle) - 20;

          const isGuessed = guessedLetters.has(letter);
          const isPassed = passedLetters.has(letter);
          const isCurrent = letter === currentLetter;

          return (
            <div
              key={letter}
              className={`absolute flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-300 
                ${isGuessed ? 'bg-green-500 text-white' : isPassed ? 'bg-gray-500 text-white' : 'bg-violet-500'}
                ${isCurrent && isIncorrect ? 'bg-red-500 text-white' : ''}`}
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlphabetCircle;
