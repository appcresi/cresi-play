// components/GameBoard.tsx
"use client"
import React from 'react';
import GameCell from './GameCell';
import { Position, Effect, Level, Question, AnswerOption } from '../types/types';
import { GRID_SIZE } from '../types/constants';

type GameBoardProps = {
  player: Position;
  ghosts: Position[];
  dots: boolean[][];
  quizItems: Position[];
  currentLevel: Level;
  direction: string;
  effect: Effect;
  currentQuestion: Question | null;
  answerOptions: AnswerOption[];
};

const GameBoard = ({ 
  player, 
  ghosts, 
  dots, 
  quizItems, 
  currentLevel, 
  direction, 
  effect,
  currentQuestion,
  answerOptions 
}: GameBoardProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Pregunta actual - Card estilo Classroom */}
      {currentQuestion ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
              ?
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-gray-800 mb-2">Pregunta actual</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.question}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium flex-shrink-0">
              ℹ
            </div>
            <div className="flex-1">
              <h2 className="text-base font-medium text-gray-800 mb-2">Instrucciones</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Busca las ❓ y luego dirígete hacia la ✅ si es Verdadera o hacia la ❌ si es Falsa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tablero de juego - Card estilo Classroom */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          {effect.text && (
            <div
              className="absolute text-yellow-500 font-bold text-2xl transform -translate-x-1/2 -translate-y-1/2 rotate-12 animate-bounce z-10"
              style={{
                left: `${(effect.x * 32) + 16}px`,
                top: `${(effect.y * 32) + 16}px`,
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {effect.text}
            </div>
          )}

          <div className={`grid gap-0 bg-gradient-to-br ${currentLevel.boardBackground} p-4 rounded-lg border border-gray-300`}>
            {Array.from({ length: GRID_SIZE }).map((_, y) => (
              <div key={y} className="flex">
                {Array.from({ length: GRID_SIZE }).map((_, x) => {
                  const isWall = currentLevel.walls.some(([wx, wy]) => wx === x && wy === y);
                  const isPlayer = player.x === x && player.y === y;
                  const isGhost = ghosts.some(ghost => ghost.x === x && ghost.y === y);
                  const ghostIndex = ghosts.findIndex(ghost => ghost.x === x && ghost.y === y);
                  const isQuiz = quizItems.some(item => item.x === x && item.y === y);
                  const isDot = dots[y][x];
                  const answerOption = answerOptions.find(opt => opt.position.x === x && opt.position.y === y);
                  
                  return (
                    <GameCell
                      key={`${x}-${y}`}
                      x={x}
                      y={y}
                      isWall={isWall}
                      isPlayer={isPlayer}
                      isGhost={isGhost}
                      ghostIndex={ghostIndex}
                      isQuiz={isQuiz}
                      isDot={isDot}
                      direction={direction}
                      answerOption={answerOption}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;