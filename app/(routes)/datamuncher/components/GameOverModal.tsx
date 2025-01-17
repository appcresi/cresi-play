import React from 'react';

type GameOverModalProps = {
  score: number;
  onRestart: () => void;
  isComplete: boolean;
};

const GameOverModal = ({ score, onRestart, isComplete }: GameOverModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="text-center">
        <h2 className="text-6xl font-bold text-yellow-300 mb-6 animate-bounce">
          {isComplete ? '¡VICTORIA TOTAL! 🎉' : '¡GAME OVER! 💀'}
        </h2>
        <p className="text-3xl text-white mb-8">
          Puntuación Final: {score}
        </p>
        <button 
          onClick={onRestart}
          className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 
                   text-black text-2xl font-bold rounded-lg transform hover:scale-105 
                   transition-transform shadow-lg hover:shadow-xl border-2 border-black"
          style={{ fontFamily: 'comic sans ms, cursive' }}
        >
          ¡JUGAR DE NUEVO!
        </button>
      </div>
    </div>
  );
};

export default  GameOverModal;