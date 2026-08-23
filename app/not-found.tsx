"use client";
import React, { useState, useEffect } from 'react';

export default function TatietiGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState({ condom: 0, virus: 0, draws: 0 });
  const [gameMessage, setGameMessage] = useState('Tu turno');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  
  const CONDOM_IMG = '/images/condon.png';
  const VIRUS_IMG = '/images/virus.png';

    const translations = {
    es: {
      title: 'Tateti: Protección vs Riesgos',
      subtitle: 'Aprende sobre salud sexual jugando. El condón protege, el virus representa el riesgo.',
      currentGame: 'Juego Actual',
      yourTurn: 'Tu turno',
      virusThinking: 'Virus pensando...',
      youWon: '¡Ganaste! 🎉',
      virusWon: 'El virus ganó 😢',
      draw: '¡Empate!',
      newGame: '↻ Nueva Partida',
      reset: 'Reiniciar',
      scores: 'Puntuación',
      you: 'Tú (Condón)',
      virus: 'Virus',
      draws: 'Empates',
      education: 'Dato Educativo',
      educationText: 'El condón es la mejor protección contra infecciones de transmisión sexual (ITS) y embarazos no deseados. Usar protección es importante para mantener una sexualidad segura.',
      howToPlay: 'Cómo Jugar',
      step1: 'Eres el condón (protección)',
      step2: 'Haz tres en línea',
      step3: 'El virus intenta ganar',
      step4: '¡Aprende jugando!',
      ctaTitle: '¿Querés jugar más?',
      ctaButton: 'Explorar más juegos',
    },
    en: {
      title: 'Tateti: Protection vs Risks',
      subtitle: 'Learn about sexual health by playing. The condom protects, the virus represents the risk.',
      currentGame: 'Current Game',
      yourTurn: 'Your turn',
      virusThinking: 'Virus thinking...',
      youWon: 'You Won! 🎉',
      virusWon: 'Virus won 😢',
      draw: 'Draw!',
      newGame: '↻ New Game',
      reset: 'Reset',
      scores: 'Score',
      you: 'You (Condom)',
      virus: 'Virus',
      draws: 'Draws',
      education: 'Educational Fact',
      educationText: 'The condom is the best protection against sexually transmitted infections (STIs) and unwanted pregnancies. Using protection is important to maintain safe sexuality.',
      howToPlay: 'How to Play',
      step1: 'You are the condom (protection)',
      step2: 'Get three in a row',
      step3: 'The virus tries to win',
      step4: 'Learn by playing!',
      ctaTitle: 'Want to play more?',
      ctaButton: 'Explore more games',
    },
  };
  const t = translations[language];

  const calculateWinner = (squares: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const makeAIMove = (currentBoard: (string | null)[]): (string | null)[] => {
    const emptySpaces: number[] = [];
        currentBoard.forEach((val, idx) => {
        if (val === null) emptySpaces.push(idx);
        });


    if (emptySpaces.length === 0) return currentBoard;

    for (let space of emptySpaces) {
      const testBoard = [...currentBoard];
      testBoard[space] = 'virus';
      if (calculateWinner(testBoard) === 'virus') {
        return testBoard;
      }
    }

    for (let space of emptySpaces) {
      const testBoard = [...currentBoard];
      testBoard[space] = 'condom';
      if (calculateWinner(testBoard) === 'condom') {
        testBoard[space] = 'virus';
        return testBoard;
      }
    }

    if (currentBoard[4] === null) {
      const testBoard = [...currentBoard];
      testBoard[4] = 'virus';
      return testBoard;
    }

    const corners = [0, 2, 6, 8].filter(idx => currentBoard[idx] === null);
    if (corners.length > 0) {
      const testBoard = [...currentBoard];
      testBoard[corners[Math.floor(Math.random() * corners.length)]] = 'virus';
      return testBoard;
    }

    const testBoard = [...currentBoard];
    testBoard[emptySpaces[Math.floor(Math.random() * emptySpaces.length)]] = 'virus';
    return testBoard;
  };

  useEffect(() => {
    const gameWinner = calculateWinner(board);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner === 'condom') {
        setScores(prev => ({ ...prev, condom: prev.condom + 1 }));
        setGameMessage(t.youWon);
      } else {
        setScores(prev => ({ ...prev, virus: prev.virus + 1 }));
        setGameMessage(t.virusWon);
      }
    } else if (board.every(square => square !== null)) {
      setWinner('draw');
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      setGameMessage(t.draw);
    } else if (!isXNext && !winner) {
      setGameMessage(t.virusThinking);
      const timer = setTimeout(() => {
        const newBoard = makeAIMove(board);
        setBoard(newBoard);
        setIsXNext(true);
        setGameMessage(t.yourTurn);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [board, isXNext, winner, language]);

  const handleClick = (index: number) => {
    if (board[index] || winner || !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = 'condom';
    setBoard(newBoard);
    setIsXNext(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setGameMessage(t.yourTurn);
  };

  const resetScores = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setScores({ condom: 0, virus: 0, draws: 0 });
    setGameMessage(t.yourTurn);
  };

  const renderSquare = (index: number) => {
    const value = board[index];
    return (
      <button
        onClick={() => handleClick(index)}
        className="w-20 h-20 bg-white border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        disabled={!!winner || !isXNext || board[index] !== null}
      >
        {value === 'condom' && <img src={CONDOM_IMG} alt="Condom" className="w-16 h-16 object-cover rounded" />}
        {value === 'virus' && <img src={VIRUS_IMG} alt="Virus" className="w-16 h-16 object-cover rounded" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Selector de idioma */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
            <button
              onClick={() => setLanguage('es')}
              className={`px-4 py-2 rounded font-semibold transition ${
                language === 'es'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Español
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded font-semibold transition ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              English
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal - Tablero */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">{t.currentGame}</h3>

              {/* Mensaje de estado */}
              <div className={`rounded-lg p-4 mb-6 text-center font-semibold text-lg ${
                gameMessage.includes('🎉') ? 'bg-green-100 text-green-800 border-l-4 border-green-600' :
                gameMessage.includes('😢') ? 'bg-red-100 text-red-800 border-l-4 border-red-600' :
                gameMessage.includes(language === 'es' ? 'Empate' : 'Draw') ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600' :
                'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
              }`}>
                {gameMessage}
              </div>

              {/* Tablero */}
              <div className="flex justify-center mb-8">
                <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => (
                    <div key={index}>
                      {renderSquare(index)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de control */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetGame}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition shadow-sm"
                >
                  {t.newGame}
                </button>
                <button
                  onClick={resetScores}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition shadow-sm"
                >
                  {t.reset}
                </button>
              </div>
            </div>
            {/* Call to Action */}
            <div className="mt-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-3">{t.ctaTitle}</h2>
                <p className="text-green-100 mb-6">Descubre más juegos educativos sobre salud sexual y bienestar</p>
                <a
                    href="https://jugar.cresi.com.ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-green-600 font-bold py-3 px-8 rounded-lg hover:bg-green-50 transition shadow-lg hover:shadow-xl"
                >
                    {t.ctaButton} →
                </a>
            </div>
          </div>

          {/* Columna lateral - Estadísticas */}
          <div className="space-y-6">
            {/* Puntuación */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t.scores}</h3>
              
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={CONDOM_IMG} alt="Condom" className="w-8 h-8 rounded" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t.you}</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{scores.condom}</p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4 py-3">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t.draws}</span>
                  <p className="text-3xl font-bold text-yellow-600">{scores.draws}</p>
                </div>

                <div className="border-l-4 border-red-500 pl-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={VIRUS_IMG} alt="Virus" className="w-8 h-8 rounded" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t.virus}</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{scores.virus}</p>
                </div>
              </div>
            </div>

            {/* Información educativa */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">{t.education}</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 pl-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t.educationText}
                </p>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">{t.howToPlay}</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>{t.step1}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>{t.step2}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>{t.step3}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>{t.step4}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}