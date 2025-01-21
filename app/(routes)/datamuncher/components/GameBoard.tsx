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
  // Crear un array de filas para el grid
  const rows = Array.from({ length: GRID_SIZE });
  const cols = Array.from({ length: GRID_SIZE });

  return (
    <div className="w-full max-w-md mx-auto px-2">
      {/* Pregunta actual */}
      {currentQuestion ? (
        <div className="text-center bg-white/90 p-3 rounded-lg shadow-lg mb-2">
          <p className="font-bold text-purple-600">{currentQuestion.question}</p>
        </div>
      ) : (
        <div className="text-center bg-white/90 p-3 rounded-lg shadow-lg mb-2">
          <p className="font-bold text-purple-600">
            Busca las ❓, y luego la ✅ si es Verdadera la pregunta o hacia si es ❌ Falsa
          </p>
        </div>
      )}
      
      <div className="relative">
        <div 
          className={`bg-gradient-to-br ${currentLevel.boardBackground} p-2 rounded-xl border-4 border-yellow-400 shadow-2xl`}
        >
          {effect.text && (
            <div
              className="absolute text-yellow-300 font-bold text-xl transform -translate-x-1/2 -translate-y-1/2 rotate-12 animate-bounce"
              style={{
                left: `${(effect.x * 100) / GRID_SIZE}%`,
                top: `${(effect.y * 100) / GRID_SIZE}%`,
                textShadow: '2px 2px 0px #000',
                zIndex: 10
              }}
            >
              {effect.text}
            </div>
          )}

          <div className="grid" style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gap: '1px'
          }}>
            {rows.map((_, y) => (
              cols.map((_, x) => {
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
              })
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;