"use client"
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconBook,
  IconHeart,
  IconSearch,
  IconX,
  IconTrophy,
  IconFlame,
  IconCircleCheck,
  IconChevronRight,
  IconSchool,
  IconMoodHappy,
  IconCopy,
  IconCheck,
  IconPhoto,
} from "@tabler/icons-react";
import UserDataManager from '@/lib/userDataManager';
import ClassroomService, { Classroom } from '@/lib/classroomService';
import { useAuth } from '@/context/AuthContext';
import type { UserData } from '@/types/user';
import { ACTIVITIES } from '@/lib/activities';
import { loadStudentUserData } from './loadStudentUserData';
import Header from '@/components/Header';
import { TareasStudentTab } from '@/components/student/TareasStudentTab';
import { TareasFeedSummary } from '@/components/tareas/TareasFeedSummary';
import { ProximasEntregasBox } from '@/components/tareas/ProximasEntregasBox';

// Mismo patrón que Features.tsx: el catálogo guarda el nombre del ícono
// como string, acá lo resolvemos a componente.
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconBook,
  IconHeart,
  IconSearch,
  IconPhoto,
};

const ActivityIcon = ({ iconName, size = 18, className }: { iconName: string; size?: number; className?: string }) => {
  const Icon = ICON_MAP[iconName] ?? IconMoodPuzzled;
  return <Icon size={size} className={className} />;
};

// Color del botón flotante del buscador — mismo indigo que usamos en
// /buscador y en la pestaña "Preguntas" del docente.
const SEARCH_ACCENT = '#4F46E5';

type DeskTab = 'novedades' | 'trabajo' | 'boletin';

const ClassroomDesk = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<DeskTab>('novedades');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const merged = await loadStudentUserData(user);
      setUserData(merged);

      const classroomId = merged.profile.classroomId;
      if (classroomId) {
        try {
          const c = await ClassroomService.getClassroomById(classroomId);
          setClassroom(c);
        } catch (err) {
          console.error('❌ Error cargando la clase:', err);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  // Actividades que el docente habilitó para esta clase. Si por algún
  // motivo todavía no cargó la clase, no mostramos nada (mejor que mostrar
  // de más por un instante).
  const activities = useMemo(() => {
    if (!classroom) return [];
    if (!classroom.allowedActivities) return ACTIVITIES;
    return ACTIVITIES.filter((a) => classroom.allowedActivities!.includes(a.id));
  }, [classroom]);

  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;
    const term = searchTerm.toLowerCase();
    return activities.filter(
      (a) => a.title.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)
    );
  }, [activities, searchTerm]);

  const isCompleted = (title: string) => userData.progress.completedActivities.includes(title);
  const getScore = (title: string) => userData.progress.activityScores[title] || 0;

  const completedCount = activities.filter((a) => isCompleted(a.title)).length;
  const progressPercent = activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0;
  const completedActivitiesList = useMemo(
    () => activities.filter((a) => isCompleted(a.title)),
    [activities, userData.progress.completedActivities]
  );

  const handleActivityClick = (activityTitle: string, route: string) => {
    UserDataManager.visitActivity(activityTitle);
    window.location.href = route;
  };

  const handleCopyCode = () => {
    if (!classroom?.code) return;
    const shareUrl = `${window.location.origin}/clase/${classroom.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  if (!mounted || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando tu aula...</p>
          </div>
        </div>
      </>
    );
  }

  const bannerColor = classroom?.color ?? '#4F46E5';

  const TABS: { key: DeskTab; label: string }[] = [
    { key: 'novedades', label: 'Novedades' },
    { key: 'trabajo', label: 'Trabajo en clase' },
    { key: 'boletin', label: 'Boletín' },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Banner de la clase */}
        <div className="w-full py-10 px-5" style={{ backgroundColor: bannerColor }}>
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <IconSchool className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-medium mb-0.5">Tu aula</p>
              <h1 className="text-white text-2xl font-bold truncate">
                {classroom?.name ?? 'Mi clase'}
              </h1>
            </div>
          </div>
        </div>

        {/* Solapas, estilo Classroom */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-5 flex gap-6 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 py-6 pb-24">
          {/* ── Novedades ── */}
          {tab === 'novedades' && (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
              {/* Columna chica: código de la clase — mismo lugar que en el panel del docente */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Código de tu clase</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Para volver a entrar desde otro dispositivo.
                  </p>
                  {classroom?.code && (
                    <button
                      onClick={handleCopyCode}
                      title="Copiar link de tu clase"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100
                               rounded-lg text-sm font-mono font-bold tracking-widest text-gray-800 transition-colors"
                    >
                      {classroom.code}
                      {copiedCode
                        ? <IconCheck className="w-4 h-4 text-green-600" />
                        : <IconCopy className="w-4 h-4 text-gray-400" />}
                    </button>
                  )}
                  {copiedCode && (
                    <p className="text-[11px] text-green-600 mt-1.5">Link copiado ✓</p>
                  )}
                </div>

                {classroom && <ProximasEntregasBox classroomId={classroom.id} />}
              </div>

              {/* Columna grande: tareas, resumen y humor */}
              <div className="space-y-4">
                {classroom && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Tareas</h3>
                    <TareasFeedSummary classroomId={classroom.id} emptyLabel="Tu docente todavía no asignó ninguna tarea." />
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Hola, {userData.profile.username} 👋
                      </p>
                      <p className="text-xs text-gray-500">
                        {completedCount}/{activities.length} actividades completadas
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <IconTrophy className="w-4 h-4" />
                        <span className="text-sm font-bold">{userData.game.totalScore}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <IconFlame className="w-4 h-4" />
                        <span className="text-sm font-bold">{userData.game.streak}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%`, backgroundColor: bannerColor }}
                    />
                  </div>
                </div>

                {userData.mood.lastEntry && (
                  <button
                    onClick={() => (window.location.href = '/moodtracker')}
                    className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100
                             px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <IconMoodHappy className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">Cómo te sentís hoy</p>
                      <p className="text-xs text-gray-500">Último registro: {userData.mood.lastEntry.label}</p>
                    </div>
                    <IconChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Trabajo en clase ── */}
          {tab === 'trabajo' && (
            <div className="space-y-5">
              {classroom && <TareasStudentTab classroomId={classroom.id} studentUid={user?.uid ?? ''} />}

              {/* Buscador de actividades (solo si hay varias) */}
              {activities.length > 5 && (
                <div className="relative mb-5 max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconSearch size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar en tu aula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm bg-white
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <IconX size={16} />
                    </button>
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">Actividades de la clase</h2>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No se encontraron actividades.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredActivities.map((activity) => {
                      const done = isCompleted(activity.title);
                      const score = getScore(activity.title);
                      return (
                        <li key={activity.id}>
                          <button
                            onClick={() => handleActivityClick(activity.title, activity.route)}
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: activity.color }}
                            >
                              <ActivityIcon iconName={activity.iconName} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800 text-sm truncate">{activity.title}</p>
                                <span
                                  className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ backgroundColor: `${activity.color}15`, color: activity.color }}
                                >
                                  {activity.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{activity.description}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {done ? (
                                <div className="flex items-center gap-1.5 text-green-600">
                                  {score > 0 && <span className="text-xs font-medium">{score} pts</span>}
                                  <IconCircleCheck className="w-5 h-5" />
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 hidden sm:inline">Empezar</span>
                              )}
                              <IconChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Boletín ── */}
          {tab === 'boletin' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Tu progreso general</p>
                    <p className="text-xs text-gray-500">
                      {completedCount}/{activities.length} actividades completadas
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <IconTrophy className="w-4 h-4" />
                    <span className="text-sm font-bold">{userData.game.totalScore} pts</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, backgroundColor: bannerColor }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">Actividades completadas</h2>
                </div>

                {completedActivitiesList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    Todavía no completaste ninguna actividad — van a aparecer acá apenas termines la primera.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {completedActivitiesList.map((activity) => (
                      <li key={activity.id} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: activity.color }}
                          >
                            <ActivityIcon iconName={activity.iconName} size={16} />
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{activity.title}</p>
                        </div>
                        <span className="text-sm font-bold text-yellow-600 shrink-0">
                          {getScore(activity.title)} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante del buscador — antes el buscador se perdía en medio
          de todo lo demás, así que ahora tiene su propio acceso, siempre
          visible, con un pulso sutil para llamar la atención. */}
      <Link
        href="/buscador"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg
                 hover:scale-110 transition-transform"
        style={{ backgroundColor: SEARCH_ACCENT }}
        title="Buscador de preguntas"
        aria-label="Ir al buscador de preguntas"
      >
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: SEARCH_ACCENT }}
        />
        <IconSearch className="w-6 h-6 text-white relative z-10" />
      </Link>
    </>
  );
};

export default ClassroomDesk;