"use client"
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  IconSearch,
  IconX,
  IconHeart,
  IconTrophy,
  IconMoodHappy,
  IconEdit,
  IconTarget,
  IconCircle,
  IconCalendar,
  IconChevronRight,
} from "@tabler/icons-react";
import UserDataManager from '@/lib/userDataManager';
import ClassroomService from '@/lib/classroomService';
import { useAuth } from '@/context/AuthContext';
import type { UserData } from '@/types/user';
import { ACTIVITIES } from '@/lib/activities';
import { formatAgeCycles } from '@/types/activity';
import { loadStudentUserData } from './loadStudentUserData';
import Header from '@/components/Header';
import { ActivityIcon } from '@/components/ActivityIcon';

const DEFAULT_FEATURES = ACTIVITIES.map((activity) => ({
  ...activity,
  icon: <ActivityIcon iconName={activity.iconName} size={activity.iconSize ?? 20} />,
}));

// Color del botón flotante del buscador — mismo indigo que usamos en
// /buscador y en ClassroomDesk.tsx.
const SEARCH_ACCENT = '#4F46E5';

const EducationalProgressPanel = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [mounted, setMounted] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Actividades habilitadas por el docente para la clase del alumno (si tiene una).
  // `null` = sin restricción, se ven todas.
  const [allowedActivities, setAllowedActivities] = useState<string[] | null>(null);

  useEffect(() => {
    setMounted(true);
    loadUserData();
  }, [user]);

  // Trae la restricción de actividades de la clase, si el alumno pertenece a una.
  useEffect(() => {
    const classroomId = userData.profile.classroomId;
    if (!classroomId) {
      setAllowedActivities(null);
      return;
    }
    ClassroomService.getAllowedActivities(classroomId)
      .then(setAllowedActivities)
      .catch((err) => {
        console.error('❌ Error obteniendo actividades habilitadas por el docente:', err);
        setAllowedActivities(null);
      });
  }, [userData.profile.classroomId]);

  // Pool de actividades que el alumno puede ver, ya filtrado por la
  // restricción del docente (si la hay). Todo lo demás (búsqueda, categorías,
  // estadísticas) parte de acá en vez de DEFAULT_FEATURES.
  const effectiveFeatures = useMemo(() => {
    if (!allowedActivities) return DEFAULT_FEATURES;
    return DEFAULT_FEATURES.filter((f) => allowedActivities.includes(f.id));
  }, [allowedActivities]);

  const loadUserData = async () => {
    const merged = await loadStudentUserData(user);
    setUserData(merged);
    setLoadingDashboard(false);
  };

  const categories = useMemo(() =>
    ['Todos', ...Array.from(new Set(effectiveFeatures.map(f => f.category)))],
    [effectiveFeatures]
  );

  const getVisibleFeatures = () => {
    let filtered = effectiveFeatures;

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(feature => feature.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(feature =>
        feature.title.toLowerCase().includes(term) ||
        feature.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleActivityClick = (activityTitle: string, route: string, e: React.MouseEvent) => {
    e.preventDefault();
    UserDataManager.visitActivity(activityTitle);
    const updatedData = UserDataManager.loadUserData();
    setUserData(updatedData);
    window.location.href = route;
  };

  const getActivityProgress = (activityTitle: string) => {
    return userData.progress.completedActivities.includes(activityTitle);
  };

  const getActivityScore = (activityTitle: string) => {
    return userData.progress.activityScores[activityTitle] || 0;
  };

  const getLastVisitDate = (activityTitle: string) => {
    const lastVisit = userData.progress.lastVisits?.[activityTitle];
    if (!lastVisit) return null;
    return new Date(lastVisit);
  };

  const formatLastVisit = (activityTitle: string) => {
    const lastVisit = getLastVisitDate(activityTitle);
    if (!lastVisit) return "Sin visitar";

    const now = new Date();
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `Hace ${diffMinutes} min`;
    } else {
      return "Ahora mismo";
    }
  };

  const visibleFeatures = getVisibleFeatures();

  if (!mounted || loadingDashboard) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando tu panel...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Tu Progreso</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconCircle size={16} className="text-green-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Completadas</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.progress.completedActivities.length}/{effectiveFeatures.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconTrophy size={16} className="text-yellow-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Puntos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.game.totalScore}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconTarget size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Racha</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.game.streak} días</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconHeart size={16} className="text-red-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Vidas</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.game.totalLives}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userData.progress.completedActivities.length / effectiveFeatures.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {Math.round((userData.progress.completedActivities.length / effectiveFeatures.length) * 100)}% completado
                </p>
              </div>
            </div>

            {/* Mood Card */}
            {userData.mood.lastEntry && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Estado de Ánimo</h3>
                  <button
                    onClick={() => window.location.href = '/moodtracker'}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <IconEdit size={16} />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <IconMoodHappy className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData.mood.lastEntry.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Hoy</p>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
              {/* Buscador */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconSearch size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>

              {/* Categorías */}
              <div className="relative w-full sm:w-44">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <IconChevronRight size={16} className="text-gray-400 dark:text-gray-500 rotate-90" />
                </div>
              </div>
            </div>

            {/* Activities Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {visibleFeatures.length > 0 ? (
                visibleFeatures.map((feature) => {
                  const isCompleted = getActivityProgress(feature.title);
                  const activityScore = getActivityScore(feature.title);

                  return (
                    <article
                      key={feature.id}
                      onClick={(e) => handleActivityClick(feature.title, feature.route, e)}
                      role="button"
                      tabIndex={0}
                      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 group hover:shadow-md cursor-pointer"
                    >
                      {/* Header */}
                      <div
                        className="h-16 md:h-24 rounded-t-lg flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: `${feature.color}15` }}
                      >
                        {feature.image && (
                          <Image
                            src={feature.image}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover opacity-20"
                          />
                        )}

                        {isCompleted && (
                          <div className="absolute top-1 right-1 md:top-2 md:right-2">
                            <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <IconCircle size={12} className="text-white md:hidden" />
                              <IconCircle size={14} className="text-white hidden md:block" />
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-1 left-2 md:bottom-2 md:left-3">
                          <div className={`flex items-center space-x-1 text-[10px] md:text-xs backdrop-blur-sm rounded-full px-1.5 py-0.5 md:px-2 md:py-1 ${
                            getLastVisitDate(feature.title)
                              ? 'text-gray-600 bg-white/80'
                              : 'text-orange-600 bg-orange-50/80'
                          }`}>
                            <IconCalendar size={10} className="md:hidden" />
                            <IconCalendar size={12} className="hidden md:block" />
                            <span className="hidden sm:inline">{formatLastVisit(feature.title)}</span>
                            <span className="sm:hidden">{formatLastVisit(feature.title).replace('Hace ', '')}</span>
                          </div>
                        </div>

                        <div
                          className="w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center relative z-10"
                          style={{ backgroundColor: feature.color }}
                        >
                          <div className="text-white scale-55 md:scale-75">
                            {feature.icon}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-2 md:p-4">
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs md:text-sm group-hover:text-blue-700 transition-colors line-clamp-1">
                            {feature.title}
                          </h3>
                          <IconChevronRight size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                        </div>

                        <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-2 md:mb-3 line-clamp-2">
                          {feature.description}
                        </p>

                        <div className="flex items-center gap-1 mb-1.5 md:mb-2 flex-wrap">
                          <span
                            className="inline-block px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-medium rounded-full truncate"
                            style={{
                              backgroundColor: `${feature.color}15`,
                              color: feature.color
                            }}
                          >
                            {feature.category}
                          </span>
                          <span className="inline-block px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-medium rounded-full truncate bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {formatAgeCycles(feature.ageCycles)}
                          </span>
                        </div>

                        {isCompleted && (
                          <div className="flex items-center space-x-1 md:space-x-2">
                            {activityScore > 0 && (
                              <span className="text-[10px] md:text-xs text-yellow-600 font-medium">
                                {activityScore} pts
                              </span>
                            )}
                            <span className="text-[10px] md:text-xs text-green-600 font-medium hidden sm:inline">
                              Completado
                            </span>
                            <span className="text-[10px] text-green-600 font-medium sm:hidden">
                              ✓
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <IconSearch size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No se encontraron actividades
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Intentá con otros términos de búsqueda o cambiá la categoría.
                    </p>
                    <button
                      onClick={() => {
                        clearSearch();
                        setSelectedCategory('Todos');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Ver todas las actividades
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      </div>

      {/* Botón flotante del buscador — mismo que en ClassroomDesk.tsx, para
          que el buscador tenga un acceso propio en vez de perderse entre
          el resto de las actividades. */}
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

export default EducationalProgressPanel;