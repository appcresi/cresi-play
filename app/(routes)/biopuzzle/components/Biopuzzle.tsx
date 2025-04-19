"use client";

import { useState, useEffect, useCallback } from 'react';
import { Move, ArrowLeft, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { bodySystems, type BodyPart, type BodySystem } from '../data/bodySystems';

interface DraggedItem {
  id: string;
}

export default function AnatomiaApp() {
  const [currentSystemIndex, setCurrentSystemIndex] = useState(0);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [activeDropTargetId, setActiveDropTargetId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const currentSystem = useCallback(() => bodySystems[currentSystemIndex], [currentSystemIndex]);

  useEffect(() => {
    const system = currentSystem();
    setBodyParts(system.parts.map(part => ({ ...part, currentPosition: undefined, placed: false })));
    setScore(0);
    setLevelCompleted(false);
  }, [currentSystem]);

  const goToPreviousSystem = () => {
    setCurrentSystemIndex(prev => (prev > 0 ? prev - 1 : bodySystems.length - 1));
  };

  const goToNextSystem = () => {
    setCurrentSystemIndex(prev => (prev < bodySystems.length - 1 ? prev + 1 : 0));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem({ id });
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (targetId: string) => {
    setActiveDropTargetId(targetId);
  };

  const handleDragLeave = () => {
    setActiveDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const droppedItemId = draggedItem.id;

    const targetPart = bodyParts.find(part => part.id === targetId);

    if (targetPart && droppedItemId === targetId) {
      setBodyParts(prevParts =>
        prevParts.map(part =>
          part.id === droppedItemId
            ? { ...part, currentPosition: { ...part.correctPosition }, placed: true }
            : part
        )
      );

      setScore(prevScore => prevScore + 1);
    }

    setDraggedItem(null);
    setActiveDropTargetId(null);
  };

  const handleRemoveItem = (id: string) => {
    setBodyParts(prevParts =>
      prevParts.map(part =>
        part.id === id
          ? { ...part, currentPosition: undefined, placed: false }
          : part
      )
    );
    setScore(prevScore => prevScore - 1);
  };

  const resetCurrentGame = () => {
    setBodyParts(currentSystem().parts.map(part => ({ ...part, currentPosition: undefined, placed: false })));
    setScore(0);
    setLevelCompleted(false);
  };

  useEffect(() => {
    if (bodyParts.length > 0 && score === bodyParts.length) {
      setLevelCompleted(true);
    } else {
      setLevelCompleted(false);
    }
  }, [score, bodyParts.length]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-yellow-50">
      <main className="w-full max-w-6xl mx-auto p-4 flex-grow">
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Zona de la imagen con recuadros */}
          <div className="bg-white rounded-lg shadow-lg p-4 lg:w-3/5 flex flex-col border-4 border-black transform -rotate-1">
            <div
              className="relative w-full h-80 md:h-[480px] border-4 border-black rounded-lg overflow-hidden flex-grow"
              style={{ background: '#f0f9ff' }}
              ref={containerRef}
            >
              {/* Imagen del sistema actual - TAMAÑO REDUCIDO */}
              <img
                src={currentSystem().imageUrl}
                alt={currentSystem().name}
                className="absolute top-0 left-0 w-full h-full object-contain"
              />

              {/* Recuadros guía - AHORA SON ZONAS DE DESTINO */}
              {bodyParts.map(part => (
                <div
                  key={`target-${part.id}`}
                  className={`absolute rounded-md ${
                    part.placed
                      ? 'border-4 border-green-500 pointer-events-none'
                      : activeDropTargetId === part.id
                        ? 'border-4 border-blue-500 bg-blue-100 bg-opacity-50'
                        : 'border-4 border-red-400 border-dashed hover:bg-red-100 hover:bg-opacity-30'
                  }`}
                  style={{
                    left: `${(part.correctPosition.x / 800) * 100}%`,
                    top: `${(part.correctPosition.y / 800) * 100}%`,
                    /* Ajuste dinámico basado en el tamaño del contenedor */
                    width: `${(80 / 800) * 100 * (containerSize.width / 800)}%`,
                    height: `${(35 / 800) * 100 * (containerSize.height / 480)}%`,
                    transform: 'translate(-50%, -50%)',
                    minWidth: '60px',
                    minHeight: '28px',
                    /* Asegurar que el tamaño no sea cero si el contenedor es muy pequeño */
                    maxWidth: '15vw',
                    maxHeight: '7vw',
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={() => !part.placed && handleDragEnter(part.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => !part.placed && handleDrop(e, part.id)}
                />
              ))}

              {/* Elementos posicionados */}
              {bodyParts.map(part => (
                part.currentPosition && (
                  <div
                    key={part.id}
                    className={`absolute px-2 py-1 rounded-md text-xs md:text-sm font-bold border-2 border-black ${
                      part.placed
                        ? 'bg-green-300 text-black transform rotate-2 cursor-pointer hover:brightness-90'
                        : 'bg-red-300 text-black transform -rotate-2 cursor-pointer hover:brightness-90'
                    }`}
                    style={{
                      left: `${(part.currentPosition.x / 800) * 100}%`,
                      top: `${(part.currentPosition.y / 800) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '2px 2px 0 rgba(0,0,0,0.8)',
                      zIndex: 10,
                    }}
                    onClick={() => handleRemoveItem(part.id)}
                    title="Haz clic para quitar y reposicionar"
                  >
                    {part.name}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="bg-white rounded-lg shadow-lg p-5 lg:w-2/5 border-4 border-black transform rotate-1">
            <h2 className="text-3xl font-extrabold text-red-600 text-center uppercase">
              {currentSystem().name}
            </h2>
            {/* Progreso */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg md:text-xl font-bold bg-yellow-300 px-2 py-1 rounded-lg border-2 border-black shadow-md transform -rotate-3">
                  {score} / {bodyParts.length}
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-4 md:h-6 border-2 border-black">
                <div
                  className="bg-red-500 h-3 md:h-5 rounded-full"
                  style={{
                    width: `${(score / bodyParts.length) * 100}%`,
                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 10px, transparent 10px, transparent 20px)',
                  }}
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex flex-wrap gap-1 md:gap-2">
                {bodyParts.map(part => (
                  !part.placed && (
                    <div
                      key={part.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, part.id)}
                      className="bg-blue-200 px-2 py-1 rounded cursor-move flex items-center gap-1 hover:bg-blue-300 transition-transform hover:scale-105 border-2 border-black shadow-md text-xs md:text-sm"
                    >
                      <Move size={16} className="text-blue-800" />
                      <span className="text-blue-900 font-bold">{part.name}</span>
                    </div>
                  )
                ))}

                {bodyParts.every(part => part.placed) && (
                  <p className="text-green-600 font-bold flex items-center gap-1 text-sm md:text-lg">
                    <Check size={24} />
                    ¡GENIAL! ¡Todas ubicadas!
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetCurrentGame}
                className="flex-1 flex items-center justify-center gap-1 bg-orange-400 hover:bg-orange-500 text-black py-2 px-2 rounded-lg transition-transform hover:scale-105 border-2 md:border-3 border-black font-bold shadow-md text-xs md:text-sm"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={goToPreviousSystem}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-400 hover:bg-blue-500 text-black py-2 px-2 rounded-lg transition-transform hover:scale-105 border-2 md:border-3 border-black font-bold shadow-md text-xs md:text-sm"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={goToNextSystem}
                className="flex-1 flex items-center justify-center gap-1 bg-green-400 hover:bg-green-500 text-black py-2 px-2 rounded-lg transition-transform hover:scale-105 border-2 md:border-3 border-black font-bold shadow-md text-xs md:text-sm"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
      {levelCompleted && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-yellow-200 p-6 md:p-8 rounded-xl max-w-md w-full border-4 md:border-6 border-black transform rotate-2"
            style={{
              boxShadow: '6px 6px 0 rgba(0,0,0,0.8)',
              backgroundImage: 'radial-gradient(circle, yellow 10%, #fef08a 70%)',
            }}
          >
            <div className="flex justify-center mb-2 md:mb-4">
              <div className="bg-red-500 p-4 md:p-6 rounded-full border-2 md:border-4 border-black">
                <Check size={50} className="text-white" />
              </div>
            </div>
            <h3 className="text-xl md:text-3xl font-extrabold text-red-600 mb-2 md:mb-4 text-center uppercase">
              ¡NIVEL COMPLETADO!
            </h3>
            <p className="mb-4 md:mb-6 text-center text-black font-bold text-sm md:text-lg">
              ¡Has identificado correctamente todas las partes del {currentSystem().name}!
            </p>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <button
                onClick={goToNextSystem}
                className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-transform hover:scale-105 flex items-center justify-center gap-1 font-bold border-2 md:border-3 border-black shadow-md text-xs md:text-sm"
              >
                <span className="hidden md:inline">¡SIGUIENTE!</span>
                <span className="inline md:hidden">Siguiente</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={resetCurrentGame}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-transform hover:scale-105 font-bold border-2 md:border-3 border-black shadow-md text-xs md:text-sm"
              >
                REPETIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}