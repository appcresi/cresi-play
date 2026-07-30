"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    IconHeart,
    IconTrophy,
    IconHeartPlus,
    IconMoodHappy,
    IconEdit,
    IconTrash,
    IconTarget,
    IconCalendar,
    IconUser,
    IconBook,
    IconBooks,
    IconBriefcase,
    IconNotes,
    IconAlertTriangle,
    IconMedal,
    IconStar,
    IconCards,
    IconAB2,
    IconShieldCheck,
    IconBrandPnpm,
    IconPacman,
    IconMoodPuzzled,
    IconMoodTongueWink2,
    IconCheck,
} from "@tabler/icons-react";
import PurchaseModal from '@/components/PurchaseModal';
import UserDataManager from '@/lib/userDataManager';
import { ACTIVITIES } from '@/lib/activities';
import ClassroomService from '@/lib/classroomService';

// Los títulos reales del catálogo — se usan para filtrar
// `completedActivities`, que además de estos títulos también contiene
// claves internas más finas (una por trivia jugada, por sistema de
// BioPuzzle, por lección puntual, etc.). Sin este filtro, "cuántas
// actividades completaste" queda inflado por esos sub-registros.
// Nota: ya no se calculan acá arriba como constantes de módulo, porque
// ahora dependen de si el alumno tiene una clase con actividades
// restringidas — se calculan adentro del componente (ver `visibleActivities`).

// Mismo mapa ícono-por-nombre que usan Features.tsx / Header.tsx / etc.
const ACTIVITY_ICON_MAP: Record<string, JSX.Element> = {
  IconCards: <IconCards size={18} />,
  IconAB2: <IconAB2 size={18} />,
  IconShieldCheck: <IconShieldCheck size={18} />,
  IconBrandPnpm: <IconBrandPnpm size={18} />,
  IconPacman: <IconPacman size={18} />,
  IconMoodPuzzled: <IconMoodPuzzled size={18} />,
  IconMoodTongueWink2: <IconMoodTongueWink2 size={18} />,
  IconBook: <IconBook size={18} />,
  IconHeart: <IconHeart size={18} />,
};

const AchievementIcon = ({ iconName, className }: { iconName?: string; className: string }) => {
  switch (iconName) {
    case 'Medal': return <IconMedal className={className} />;
    case 'Trophy': return <IconTrophy className={className} />;
    case 'BookOpen': return <IconBook className={className} />;
    case 'Star': return <IconStar className={className} />;
    default: return <IconTrophy className={className} />;
  }
};

const UserProfile: React.FC = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // null = sin clase, o sin restricción (se ven las 15). Si tiene clase
  // con restricción, acá quedan solo los IDs habilitados por el docente.
  const [allowedActivityIds, setAllowedActivityIds] = useState<string[] | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);

    const classroomId = data.profile.classroomId;
    if (classroomId) {
      ClassroomService.getAllowedActivities(classroomId)
        .then(setAllowedActivityIds)
        .catch((err) => {
          console.error('Error obteniendo actividades habilitadas por el docente:', err);
          setAllowedActivityIds(null);
        });
    } else {
      setAllowedActivityIds(null);
    }
  };

  /**
   * Antes esto era `completedActivities.length / 10` — un número fijo que
   * no reflejaba el catálogo real (15 actividades), y encima
   * `completedActivities` mezcla títulos de actividad con un montón de
   * claves internas (una trivia puntual, un sistema de BioPuzzle, una
   * lección puntual...). Filtramos primero para quedarnos solo con las
   * que son actividades reales del catálogo.
   *
   * Además, si el alumno entró con código de clase y su docente
   * restringió qué actividades puede ver, el total y el % tienen que
   * calcularse sobre esas actividades habilitadas, no sobre las 15 del
   * catálogo completo — mostrar "3/15" cuando en realidad solo tiene 8
   * disponibles es engañoso.
   */
  const visibleActivities = allowedActivityIds
    ? ACTIVITIES.filter((a) => allowedActivityIds.includes(a.id))
    : ACTIVITIES;
  const visibleActivityTitles = new Set(visibleActivities.map((a) => a.title));
  const totalVisibleActivities = visibleActivities.length;

  const completedCatalogActivities = Array.from(
    new Set(userData.progress.completedActivities.filter((id) => visibleActivityTitles.has(id)))
  );
  const programPercentage = totalVisibleActivities > 0
    ? Math.min(Math.round((completedCatalogActivities.length / totalVisibleActivities) * 100), 100)
    : 0;

  const averageScore = completedCatalogActivities.length > 0
    ? Math.round(userData.game.totalScore / completedCatalogActivities.length)
    : 0;

  const unlockedAchievements = userData.achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const lessonEntries = Object.entries(userData.progress.lessonProgress ?? {});
  const storyEntries = Object.entries(userData.progress.storyProgress ?? {});
  const vocationalResults = userData.progress.vocationalTest?.results;
  const topVocationalAreas = vocationalResults
    ? Object.values(vocationalResults).sort((a, b) => b.total - a.total).slice(0, 2)
    : [];

  const handleDeleteHistory = () => {
    const resetData = UserDataManager.resetGameData();
    setUserData(resetData);
    setShowResetConfirm(false);
  };

  const handlePurchaseLife = () => {
    loadUserData();
    setIsPurchaseModalOpen(false);
  };

  const handleUpdateMood = () => {
    router.push('/moodtracker');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUsingApp = () => {
    const created = new Date(userData.profile.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-40 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="20" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10 pb-10">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {userData.profile.character.image ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    <Image
                      src={`/${userData.profile.character.image.replace(/^\/+/, '')}`}
                      alt={userData.profile.character.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                    <IconUser size={40} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  {userData.profile.username || 'Estudiante'}
                </h1>
                <p className="text-base text-gray-500 mb-3">
                  {userData.profile.character.name || 'Sin personaje seleccionado'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <IconCalendar size={16} />
                    Miembro desde {formatDate(userData.profile.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconTarget size={16} />
                    {getDaysUsingApp()} días activo
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleUpdateMood}
                  className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors text-sm font-semibold border border-gray-300 hover:border-indigo-300"
                >
                  Actualizar estado
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Game Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconTrophy size={20} className="text-amber-500" />
              Estadísticas de juego
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <IconHeart size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vidas</p>
                    <p className="text-xs text-gray-500">Disponibles</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-gray-900">{userData.game.totalLives}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <IconTrophy size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Puntos</p>
                    <p className="text-xs text-gray-500">Total acumulado</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-gray-900">{userData.game.totalScore}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <IconTarget size={20} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Racha</p>
                    <p className="text-xs text-gray-500">Días consecutivos</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-gray-900">{userData.game.streak}</span>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconEdit size={20} className="text-green-500" />
              Progreso académico
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Actividades completadas</span>
                  <span className="text-sm text-gray-500">{completedCatalogActivities.length} / {totalVisibleActivities}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${programPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {programPercentage}% del programa
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promedio por actividad</span>
                  <span className="text-lg font-semibold text-gray-900">{averageScore}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Logros desbloqueados</span>
                <span className="text-lg font-semibold text-gray-900">
                  {unlockedAchievements.length}
                </span>
              </div>
            </div>
          </div>

          {/* Mood & Activity Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconMoodHappy size={20} className="text-purple-500" />
              Estado y actividad
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <IconMoodHappy size={24} className="text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estado actual</p>
                    <p className="text-lg font-semibold text-purple-700">
                      {userData.mood.lastEntry?.label || 'Sin registro'}
                    </p>
                  </div>
                </div>
                {userData.mood.lastEntry && (
                  <p className="text-xs text-gray-600">
                    Registrado {new Date(userData.mood.lastEntry.date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Registros de humor: {userData.mood.history.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actividades — antes solo se veía un número ("5/15"), sin
            saber cuáles. Ahora se ve la lista completa, marcando qué
            actividades ya completaste (incluye Amor Sin Violencia y
            Salud Mental Test, que antes no aparecían en ningún lado). */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IconTarget size={20} className="text-indigo-500" />
            Actividades ({completedCatalogActivities.length}/{totalVisibleActivities})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {visibleActivities.map((activity) => {
              const isDone = completedCatalogActivities.includes(activity.title);
              return (
                <div
                  key={activity.id}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors ${
                    isDone
                      ? 'border-transparent'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                  style={isDone ? { backgroundColor: `${activity.color}0D`, borderColor: `${activity.color}30` } : undefined}
                >
                  {isDone && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <IconCheck size={10} className="text-white" />
                    </div>
                  )}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isDone ? activity.color : '#E5E7EB', color: isDone ? 'white' : '#9CA3AF' }}
                  >
                    {ACTIVITY_ICON_MAP[activity.iconName] ?? <IconMoodPuzzled size={18} />}
                  </div>
                  <p className={`text-xs font-medium leading-tight ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {activity.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nuevas secciones — antes estos datos ya se guardaban, pero no
            se mostraban en ningún lado del perfil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Lecciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconBook size={20} className="text-blue-500" />
              Lecciones
            </h3>
            {lessonEntries.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no empezaste ninguna lección.</p>
            ) : (
              <div className="space-y-3">
                {lessonEntries.map(([title, entry]) => (
                  <div key={title}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{title}</span>
                      <span className="text-xs text-gray-500">{entry.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cuentos (Literatura) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconBooks size={20} className="text-orange-500" />
              Cuentos leídos
            </h3>
            {storyEntries.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no empezaste ningún cuento.</p>
            ) : (
              <div className="space-y-3">
                {storyEntries.map(([title, entry]) => (
                  <div key={title}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate pr-2">{title}</span>
                      <span className="text-xs text-gray-500 shrink-0">{entry.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test vocacional */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconBriefcase size={20} className="text-green-600" />
              Test vocacional
            </h3>
            {topVocationalAreas.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no hiciste el test vocacional.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Tus áreas de mayor interés:</p>
                {topVocationalAreas.map((area, i) => (
                  <div key={area.name} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">
                      {i === 0 ? '🥇' : '🥈'} {area.name}
                    </span>
                    <span className="text-xs font-semibold text-green-700">{area.total} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconNotes size={20} className="text-amber-600" />
              Mis notas
            </h3>
            {userData.notes.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no escribiste ninguna nota en las lecciones.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">
                  {userData.notes.length} nota{userData.notes.length !== 1 ? 's' : ''} en total
                </p>
                {userData.notes.slice(-3).reverse().map((note) => (
                  <div key={note.id} className="p-2.5 bg-amber-50 rounded-lg">
                    <p className="text-xs text-gray-700 line-clamp-2">{note.text}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{note.lessonTitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconMedal size={20} className="text-yellow-500" />
              Logros desbloqueados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unlockedAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <AchievementIcon iconName={achievement.iconName} className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{achievement.name}</p>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                    {achievement.date && (
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(achievement.date)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Acciones rápidas</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              disabled={userData.game.totalLives >= 3 || userData.game.totalScore < 200}
              className={`flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm transition-all ${
                userData.game.totalLives >= 3 || userData.game.totalScore < 200
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
              }`}
            >
              <IconHeartPlus size={18} />
              Comprar vida (200 puntos)
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold text-sm transition-all"
            >
              <IconTrash size={18} />
              Reiniciar progreso
            </button>
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 text-sm font-bold">!</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">Información importante</h4>
                <p className="text-sm text-amber-700">
                  Al reiniciar el progreso se mantendrá tu perfil, pero se eliminarán todos los datos de juegos, actividades, estados de ánimo, logros, lecciones, cuentos y notas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchase={handlePurchaseLife}
      />

      {/* Reset confirmation modal — antes era un Swal.fire nativo */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <IconAlertTriangle size={28} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">¿Reiniciar progreso?</h2>
                <p className="text-gray-500 text-sm">
                  Se borrará todo tu progreso de juegos, actividades, estados de ánimo, logros, lecciones, cuentos y notas. Tu perfil se mantiene intacto. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteHistory}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                >
                  <IconTrash size={17} />
                  Sí, reiniciar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;