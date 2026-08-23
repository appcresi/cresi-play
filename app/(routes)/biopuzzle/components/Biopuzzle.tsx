"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  IconArrowsMove,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconRefresh,
} from '@tabler/icons-react';
import { bodySystems, type BodyPart } from '../data/bodySystems';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('biopuzzle');
const ACTIVITY_ID = ACTIVITY?.title ?? 'BioPuzzle';
const ACCENT = ACTIVITY?.color ?? '#7B1FA2';

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
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [sessionScore, setSessionScore] = useState(0);

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
    const data = UserDataManager.loadUserData();
    setUserData(data);
    UserDataManager.visitActivity(ACTIVITY_ID);
  }, []);

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

      setScore((prev) => prev + 1);
      setSessionScore(prev => prev + 50);

      // Cargamos fresco en vez de confiar en el `userData` del closure —
      // evita perder puntos si hay dos drops muy seguidos.
      const updated = UserDataManager.loadUserData();
      updated.game.totalScore += 50;
      UserDataManager.saveUserData(updated);
      setUserData(updated);
    }

    setDraggedItem(null);
    setActiveDropTargetId(null);
  };

  const handleRemoveItem = (id: string) => {
    const part = bodyParts.find(p => p.id === id);
    if (part?.placed) {
      setBodyParts(prevParts =>
        prevParts.map(part =>
          part.id === id
            ? { ...part, currentPosition: undefined, placed: false }
            : part
        )
      );
      setScore(prevScore => prevScore - 1);
      setSessionScore(prev => prev - 50);

      const updated = UserDataManager.loadUserData();
      updated.game.totalScore = Math.max(0, updated.game.totalScore - 50);
      UserDataManager.saveUserData(updated);
      setUserData(updated);
    }
  };

  const resetCurrentGame = () => {
    setBodyParts(currentSystem().parts.map(part => ({ ...part, currentPosition: undefined, placed: false })));
    setScore(0);
    setLevelCompleted(false);
  };

  useEffect(() => {
    if (bodyParts.length > 0 && score === bodyParts.length) {
      setLevelCompleted(true);

      const current = UserDataManager.loadUserData();
      const systemKey = `${ACTIVITY_ID}-${currentSystem().name}`;

      if (!current.progress.completedActivities.includes(systemKey)) {
        current.progress.completedActivities.push(systemKey);
      }
      current.progress.activityScores[systemKey] = score;
      current.progress.activityTimes[systemKey] = new Date().toISOString();

      const wasAlreadyCompleted = current.progress.completedActivities.includes(ACTIVITY_ID);
      if (!wasAlreadyCompleted) {
        current.progress.completedActivities.push(ACTIVITY_ID);
      }
      current.progress.activityScores[ACTIVITY_ID] = Math.max(
        current.progress.activityScores[ACTIVITY_ID] || 0,
        sessionScore
      );
      current.progress.activityTimes[ACTIVITY_ID] = new Date().toISOString();

      UserDataManager.saveUserData(current);
      setUserData(current);
      if (!wasAlreadyCompleted) {
        trackEvent('activity_completed', { activity_id: ACTIVITY_ID });
      }
    } else {
      setLevelCompleted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, bodyParts.length, currentSystem]);

  return (
    <div className="h-screen bg-cream dark:bg-gray-900 overflow-hidden flex flex-col">
      <GameStatusBar
        title="BioPuzzle"
        score={userData.game.totalScore}
        lives={userData.game.totalLives}
        level={currentSystemIndex + 1}
        activityName={ACTIVITY_ID}
      />

      <div className="flex-1 min-h-0 pt-10 px-4 pb-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-3">
          {/* Área principal: tablero + panel lateral, ambos ocupando el alto restante */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Game Board */}
            <div className="lg:col-span-2 min-h-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3">
                <div
                  className="relative w-full h-96 lg:h-[500px] rounded-lg border-2 border-dashed border-gray-200 overflow-hidden"
                  style={{ backgroundColor: `${ACCENT}0A` }}
                  ref={containerRef}
                >
                  {/* Imagen del sistema */}
                  <Image
                    src={currentSystem().imageUrl}
                    alt={currentSystem().name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-contain opacity-80"
                  />

                  {/* Zonas de destino */}
                  {bodyParts.map(part => (
                    <div
                      key={`target-${part.id}`}
                      className={`absolute rounded-lg transition-all duration-200 ${
                        part.placed
                          ? 'border-2 border-green-400 bg-green-50 pointer-events-none'
                          : activeDropTargetId === part.id
                            ? 'border-2 bg-white/60'
                            : 'border-2 border-gray-300 border-dashed hover:bg-white/40'
                      }`}
                      style={{
                        left: `${(part.correctPosition.x / 800) * 100}%`,
                        top: `${(part.correctPosition.y / 800) * 100}%`,
                        width: `${Math.max(60, (80 / 800) * containerSize.width)}px`,
                        height: `${Math.max(30, (35 / 800) * containerSize.height)}px`,
                        transform: 'translate(-50%, -50%)',
                        ...(activeDropTargetId === part.id && !part.placed ? { borderColor: ACCENT } : {}),
                      }}
                      onDragOver={handleDragOver}
                      onDragEnter={() => !part.placed && handleDragEnter(part.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !part.placed && handleDrop(e, part.id)}
                    />
                  ))}

                  {/* Elementos colocados */}
                  {bodyParts.map(part => (
                    part.currentPosition && (
                      <div
                        key={part.id}
                        className={`absolute px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 text-white ${
                          part.placed ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          left: `${(part.currentPosition.x / 800) * 100}%`,
                          top: `${(part.currentPosition.y / 800) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 10,
                        }}
                        onClick={() => handleRemoveItem(part.id)}
                        title="Clic para quitar"
                      >
                        {part.name}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="min-h-0 flex flex-col gap-3 overflow-y-auto">
              {/* Selector de sistema */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={goToPreviousSystem}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                    title="Sistema anterior"
                  >
                    <IconArrowLeft size={18} />
                  </button>

                  <div className="text-center min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">{currentSystem().name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Sistema {currentSystemIndex + 1} de {bodySystems.length}</p>
                  </div>

                  <button
                    onClick={goToNextSystem}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                    title="Siguiente sistema"
                  >
                    <IconArrowRight size={18} />
                  </button>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">Progreso</h3>

                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Completado</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{score} / {bodyParts.length}</span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(score / bodyParts.length) * 100}%`, backgroundColor: ACCENT }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="py-2 bg-green-50 border border-green-100 rounded-lg">
                    <div className="text-base font-semibold text-green-600">{score}</div>
                    <div className="text-[10px] text-green-700">Correctas</div>
                  </div>
                  <div className="py-2 rounded-lg border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
                    <div className="text-base font-semibold" style={{ color: ACCENT }}>{sessionScore}</div>
                    <div className="text-[10px]" style={{ color: ACCENT }}>Puntos</div>
                  </div>
                </div>
              </div>

              {/* Body Parts Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex-1 min-h-0 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5 shrink-0">Partes disponibles</h3>

                <div className="space-y-1.5 overflow-y-auto">
                  {bodyParts.map(part => (
                    !part.placed && (
                      <div
                        key={part.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, part.id)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-move transition-colors group border"
                        style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}
                      >
                        <IconArrowsMove size={14} style={{ color: ACCENT }} className="group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-sm font-medium" style={{ color: ACCENT }}>{part.name}</span>
                      </div>
                    )
                  ))}

                  {bodyParts.every(part => part.placed) && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <IconCheck size={18} className="text-green-600" />
                      <span className="text-green-700 font-medium text-sm">¡Todas las partes ubicadas!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={resetCurrentGame}
                className="shrink-0 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600
                         text-white rounded-full font-medium text-sm transition-colors"
              >
                <IconRefresh size={16} />
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {levelCompleted && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCheck size={28} className="text-green-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                ¡Sistema completado!
              </h3>

              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Has identificado correctamente todas las partes del {currentSystem().name}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">{score}</div>
                  <div className="text-xs text-green-700">Partes correctas</div>
                </div>
                <div className="text-center p-3 rounded-lg border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
                  <div className="text-lg font-semibold" style={{ color: ACCENT }}>{sessionScore}</div>
                  <div className="text-xs" style={{ color: ACCENT }}>Puntos ganados</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goToNextSystem}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  Siguiente sistema
                  <IconArrowRight size={18} />
                </button>

                <button
                  onClick={resetCurrentGame}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Repetir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}