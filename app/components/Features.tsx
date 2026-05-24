"use client"
import React, { useState, useEffect, useMemo } from 'react';
import {
  IconCards,
  IconAB2,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconSearch,
  IconX,
  IconHeart,
  IconTrophy,
  IconMoodHappy,
  IconEdit,
  IconTarget,
  IconCircle,
  IconCalendar,
  IconBook,
  IconChevronRight,
  IconPlus,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconSettings,
  IconRotate,
  IconMoodPuzzled
} from "@tabler/icons-react";
import UserDataManager from '@/lib/userDataManager';
import UserDataSync from '@/lib/userDataSync';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_FEATURES = [
  {
    id: "trivias",
    title: "Trivias",
    description: "Poné a prueba tus conocimientos jugando trivias sobre salud, derechos, diversidad y mucho más.",
    icon: <IconCards size={20} />,
    route: "/trivias",
    color: "#1976D2",
    image: "/trivia.svg",
    priority: true,
    category: "Evaluación",
    dueDate: ""
  },
  {
    id: "pasapalabras",
    title: "Pasapalabras",
    description: "Jugá con las letras del abecedario y descubrí palabras claves a partir de sus definiciones.",
    icon: <IconAB2 size={20} />,
    route: "/pasapalabras",
    color: "#388E3C",
    image: "/pasapalabras.svg",
    priority: true,
    category: "Ejercicios",
    dueDate: ""
  },
  {
    id: "simulador",
    title: "Simulador Grooming",
    description: "Practicá cómo reaccionar ante mensajes sospechosos y aprendé a cuidarte en las redes sociales.",
    icon: <IconShieldCheck size={20} />,
    route: "/simulador",
    color: "#F57C00",
    image: "/simulador.svg",
    priority: true,
    category: "Seguridad",
    dueDate: ""
  },
  {
    id: "completa",
    title: "Completa Palabras",
    description: "Completá frases con las palabras correctas y descubrí conceptos sobre sexualidad, cuidado y derechos.",
    icon: <IconBrandPnpm size={20} />,
    route: "/completapalabras",
    color: "#7B1FA2",
    image: "/completa.svg",
    category: "Ejercicios",
    dueDate: ""
  },
  {
    id: "datamuncher",
    title: "DataMuncher",
    description: "Recorré el laberinto, respondé preguntas y esquivá bacterias para sumar puntos así ganar el juego.",
    icon: <IconPacman size={20} />,
    route: "/datamuncher",
    color: "#D32F2F",
    image: "/datamuncher.svg",
    category: "Juegos Educativos",
    dueDate: ""
  },
  {
    id: "moodtracker",
    title: "MoodTracker",
    description: "Reflexioná sobre cómo te sentís, registrá tus emociones y aprendé a expresar tu estado de ánimo.",
    icon: <IconMoodPuzzled size={20} />,
    route: "/moodtracker",
    color: "#0288D1",
    image: "/moodtracker.svg",
    category: "Bienestar",
    dueDate: ""
  },
  {
    id: "meme",
    title: "Meme Generator",
    description: "Creá memes originales con mensajes reflexivos y compartilos con tus amistades.",
    icon: <IconMoodTongueWink2 size={20} />,
    route: "/memegenerador",
    color: "#689F38",
    image: "/meme.svg",
    category: "Creatividad",
    dueDate: ""
  },
  {
    id: "literatura",
    title: "Literatura",
    description: "Leé cuentos breves y relatos que invitan a reflexionar sobre vínculos, derechos y emociones.",
    icon: <IconBook size={20} />,
    route: "/literatura",
    color: "#F57C00",
    image: "/literatura.svg",
    category: "Lectura",
    dueDate: ""
  },
  {
    id: "biopuzzle",
    title: "BioPuzzle",
    description: "Completá el rompecabezas de la biología humana y aprendé sobre el cuerpo humano de forma divertida.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/biopuzzle",
    color: "#7B1FA2",
    image: "/biopluzzle.svg",
    category: "Lectura",
    dueDate: ""
  },
  {
    id: "condon",
    title: "Prevención",
    description: "Todo sobre el preservativo, el único método que reduce la posibilidad de contraer un ITS.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/condon",
    color: "#D32F2F",
    image: "/condon.svg",
    category: "Lectura",
    dueDate: ""
  },
  {
    id: "lecciones",
    title: "Lecciones",
    description: "Poné a prueba tus conocimientos jugando trivias sobre salud, derechos, diversidad y mucho más.",
    icon: <IconCards size={20} />,
    route: "/lecciones",
    color: "#1976D2",
    image: "/trivia.svg",
    priority: true,
    category: "Lectura",
    dueDate: ""
  },
  {
    id: "saludmental",
    title: "Salud Mental Test",
    description: "Evaluá tu estado emocional y recibí orientación sobre bienestar mental con nuestro test interactivo.",
    icon: <IconHeart size={20} />,
    route: "/saludmental",
    color: "#388E3C",
    image: "/saludmental.svg",
    priority: true,
    category: "Ejercicios",
    dueDate: ""
  },
  {
    id: "vocacion",
    title: "Test Vocacional",
    description: "Descubrí carreras y profesiones que se alinean con tus intereses y habilidades mediante nuestro test vocacional.",
    icon: <IconBrandPnpm size={20} />,
    route: "/vocacion",
    color: "#388E3C",
    image: "/vocacion.svg",
    priority: true,
    category: "Ejercicios",
    dueDate: ""
  },
  {
    id: "amor",
    title: "Amor Sin Violencia",
    description: "Aprendé a detectar señales de violencias en tus relaciones de pareja o amistades.",
    icon: <IconHeart size={20} />,
    route: "/amor",
    color: "#F57C00",
    image: "/completa.svg",
    category: "Ejercicios",
    dueDate: ""
  },
  {
    id: "impostor",
    title: "Impostor",
    description: "Descubrí quién es el impostor mientras aprendés sobre el sexualidad, cuerpo humano y la biología.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/impostor",
    color: "#7B1FA2",
    image: "/biopluzzle.svg",
    category: "Juegos Educativos",
    dueDate: ""
  }
];


interface MoodRecord {
  date: string;
  mood: number;
  label: string;
  intensity: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  date?: string;
}

interface UserData {
  profile: {
    character: { id: number; name: string; image: string };
    username: string;
    createdAt: string;
    lastLogin: string;
  };
  game: { totalScore: number; totalLives: number; streak: number };
  progress: {
    completedActivities: string[];
    activityScores: { [key: string]: number };
    activityTimes: { [key: string]: string };
    lastVisits: { [key: string]: string };
  };
  mood: { history: MoodRecord[]; lastEntry: MoodRecord | null };
  achievements: Achievement[];
  settings: { notifications: boolean; theme: 'light' | 'dark'; language: 'es' | 'en' };
  dashboard: { visibleActivities: string[]; activityOrder: string[] };
}


const EducationalProgressPanel = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [hiddenActivities, setHiddenActivities] = useState<string[]>([]);
  const [orderedActivities, setOrderedActivities] = useState<string[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    console.log('📥 Cargando datos del usuario...');
    const localData = UserDataManager.loadUserData();

    if (user && !user.isAnonymous) {
      console.log('🔄 Usuario registrado - cargando configuración desde Firestore...');

      try {
        const firestoreData = await UserDataSync.loadFromFirestore();

        if (firestoreData) {
          console.log('✅ Datos cargados desde Firestore');

          // FIX: comparar lastLogin — quien sea más reciente tiene prioridad
          const firestoreTime = new Date(firestoreData.profile?.lastLogin ?? 0).getTime();
          const localTime = new Date(localData.profile?.lastLogin ?? 0).getTime();
          const localIsNewer = localTime > firestoreTime;

          if (localIsNewer) {
            console.log('⚠️ localStorage más reciente que Firestore — priorizando localStorage');
            console.log('   Local lastLogin:', localData.profile.lastLogin);
            console.log('   Firestore lastLogin:', firestoreData.profile.lastLogin);

            // localStorage gana en game/progress/mood/achievements
            // Firestore gana solo en dashboard si localStorage no lo tiene
            const defaultDashboard = {
              visibleActivities: DEFAULT_FEATURES.map(f => f.id),
              activityOrder: DEFAULT_FEATURES.map(f => f.id)
            };
            const mergedData: UserData = {
              ...firestoreData,
              ...localData,
              dashboard: (localData.dashboard?.visibleActivities?.length ?? 0) > 0
                ? localData.dashboard
                : (firestoreData.dashboard ?? defaultDashboard)
            };

            if (!mergedData.dashboard || mergedData.dashboard.visibleActivities.length === 0) {
              mergedData.dashboard = defaultDashboard;
            }

            setUserData(mergedData);
            // Subir localStorage a Firestore para que quede sincronizado
            UserDataManager.saveUserData(mergedData);

            setHiddenActivities(
              DEFAULT_FEATURES.map(f => f.id).filter(
                id => !mergedData.dashboard.visibleActivities.includes(id)
              )
            );
            setOrderedActivities(mergedData.dashboard.activityOrder);

          } else {
            console.log('✅ Firestore más reciente — usando datos de Firestore');

            const mergedData = {
              ...localData,
              ...firestoreData,
              dashboard: firestoreData.dashboard || localData.dashboard
            };

            if (!mergedData.dashboard || mergedData.dashboard.visibleActivities.length === 0) {
              console.log('⚠️ Dashboard vacío detectado, inicializando con todas las actividades');
              mergedData.dashboard = {
                visibleActivities: DEFAULT_FEATURES.map(f => f.id),
                activityOrder: DEFAULT_FEATURES.map(f => f.id)
              };
            }

            setUserData(mergedData);
            UserDataManager.saveUserData(mergedData);

            if (mergedData.dashboard) {
              setHiddenActivities(
                DEFAULT_FEATURES.map(f => f.id).filter(
                  id => !mergedData.dashboard.visibleActivities.includes(id)
                )
              );
              setOrderedActivities(mergedData.dashboard.activityOrder);
            }
          }

        } else {
          console.log('⚠️ No hay datos en Firestore, usando localStorage');

          if (!localData.dashboard || localData.dashboard.visibleActivities.length === 0) {
            console.log('⚠️ Dashboard vacío en localStorage, inicializando con todas las actividades');
            localData.dashboard = {
              visibleActivities: DEFAULT_FEATURES.map(f => f.id),
              activityOrder: DEFAULT_FEATURES.map(f => f.id)
            };
          }

          setUserData(localData);
          setHiddenActivities(
            DEFAULT_FEATURES.map(f => f.id).filter(
              id => !localData.dashboard.visibleActivities.includes(id)
            )
          );
          setOrderedActivities(localData.dashboard.activityOrder);
        }
      } catch (error) {
        console.error('❌ Error cargando de Firestore:', error);

        if (!localData.dashboard || localData.dashboard.visibleActivities.length === 0) {
          localData.dashboard = {
            visibleActivities: DEFAULT_FEATURES.map(f => f.id),
            activityOrder: DEFAULT_FEATURES.map(f => f.id)
          };
        }

        setUserData(localData);
        setHiddenActivities(
          DEFAULT_FEATURES.map(f => f.id).filter(
            id => !localData.dashboard.visibleActivities.includes(id)
          )
        );
        setOrderedActivities(localData.dashboard.activityOrder);
      }
    } else {
      console.log('👤 Usuario anónimo - usando solo localStorage');

      if (!localData.dashboard || localData.dashboard.visibleActivities.length === 0) {
        localData.dashboard = {
          visibleActivities: DEFAULT_FEATURES.map(f => f.id),
          activityOrder: DEFAULT_FEATURES.map(f => f.id)
        };
      }

      setUserData(localData);
      setHiddenActivities(
        DEFAULT_FEATURES.map(f => f.id).filter(
          id => !localData.dashboard.visibleActivities.includes(id)
        )
      );
      setOrderedActivities(localData.dashboard.activityOrder);
    }

    setLoadingDashboard(false);
  };

  const categories = useMemo(() =>
    ['Todos', ...Array.from(new Set(DEFAULT_FEATURES.map(f => f.category)))],
    []
  );

  const getVisibleFeatures = () => {
    const dashboard = userData.dashboard || {
      visibleActivities: DEFAULT_FEATURES.map(f => f.id),
      activityOrder: DEFAULT_FEATURES.map(f => f.id)
    };

    const features = DEFAULT_FEATURES
      .filter(f => dashboard.visibleActivities.includes(f.id))
      .sort((a, b) => {
        const aIndex = dashboard.activityOrder.indexOf(a.id);
        const bIndex = dashboard.activityOrder.indexOf(b.id);
        return aIndex - bIndex;
      });

    let filtered = features;

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

  const getFilteredHiddenFeatures = () => {
    let hidden = getHiddenFeatures();

    if (selectedCategory !== 'Todos') {
      hidden = hidden.filter(feature => feature.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      hidden = hidden.filter(feature =>
        feature.title.toLowerCase().includes(term) ||
        feature.description.toLowerCase().includes(term)
      );
    }

    return hidden;
  };

  const getHiddenFeatures = () => {
    return DEFAULT_FEATURES.filter(f => hiddenActivities.includes(f.id));
  };

  const toggleActivityVisibility = (activityId: string) => {
    const newHidden = hiddenActivities.includes(activityId)
      ? hiddenActivities.filter(id => id !== activityId)
      : [...hiddenActivities, activityId];

    const newVisible = DEFAULT_FEATURES.map(f => f.id).filter(
      id => !newHidden.includes(id)
    );

    setHiddenActivities(newHidden);
    const updatedData = UserDataManager.updateDashboardVisibility(newVisible);

    if (!updatedData.dashboard) {
      updatedData.dashboard = {
        visibleActivities: newVisible,
        activityOrder: DEFAULT_FEATURES.map(f => f.id)
      };
    }

    setUserData(updatedData);
  };

  const handleDragStart = (e: React.DragEvent, activityId: string) => {
    setDraggedItem(activityId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...orderedActivities];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setOrderedActivities(newOrder);
    const updatedData = UserDataManager.updateActivityOrder(newOrder);

    if (!updatedData.dashboard) {
      updatedData.dashboard = {
        visibleActivities: DEFAULT_FEATURES.map(f => f.id),
        activityOrder: newOrder
      };
    }

    setUserData(updatedData);
    setDraggedItem(null);
  };

  const resetDashboard = () => {
    if (confirm('¿Estás seguro de que querés resetear el panel a su estado original?')) {
      const updatedData = UserDataManager.resetDashboard();
      setUserData(updatedData);
      setHiddenActivities([]);
      setOrderedActivities(DEFAULT_FEATURES.map(f => f.id));
      setEditMode(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleActivityClick = (activityTitle: string, route: string, e: React.MouseEvent) => {
    if (editMode) return;
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
  const hiddenFeatures = getHiddenFeatures();
  const filteredHiddenFeatures = getFilteredHiddenFeatures();

  if (!mounted || loadingDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header con botones de control */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Tu Progreso</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconCircle size={16} className="text-green-600" />
                    <span className="text-sm text-gray-700">Completadas</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.progress.completedActivities.length}/{DEFAULT_FEATURES.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconTrophy size={16} className="text-yellow-500" />
                    <span className="text-sm text-gray-700">Puntos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.game.totalScore}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconTarget size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Racha</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.game.streak} días</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconHeart size={16} className="text-red-500" />
                    <span className="text-sm text-gray-700">Vidas</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.game.totalLives}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userData.progress.completedActivities.length / DEFAULT_FEATURES.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((userData.progress.completedActivities.length / DEFAULT_FEATURES.length) * 100)}% completado
                </p>
              </div>
            </div>

            {/* Mood Card */}
            {userData.mood.lastEntry && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Estado de Ánimo</h3>
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
                    <p className="text-sm font-medium text-gray-900">{userData.mood.lastEntry.label}</p>
                    <p className="text-xs text-gray-500">Hoy</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Button */}
            {editMode && (
              <button
                onClick={resetDashboard}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
              >
                <IconRotate size={16} />
                <span>Resetear Panel</span>
              </button>
            )}
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
              {/* Buscador */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconSearch size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                  className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <IconChevronRight size={16} className="text-gray-400 rotate-90" />
                </div>
              </div>

              {/* Botón Personalizar */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  editMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <IconSettings size={18} />
                <span>{editMode ? 'Guardado' : 'Personalizar'}</span>
              </button>
            </div>

            {/* Mode Indicator */}
            {editMode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center space-x-2">
                <IconGripVertical size={16} />
                <span>Modo edición: Arrastra las tarjetas para reordenarlas o haz clic en la X para ocultarlas</span>
              </div>
            )}

            {/* Activities Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {visibleFeatures.length > 0 || (editMode && filteredHiddenFeatures.length > 0) ? (
                <>
                  {/* Visible Features */}
                  {visibleFeatures.map((feature) => {
                    const isCompleted = getActivityProgress(feature.title);
                    const activityScore = getActivityScore(feature.title);

                    return (
                      <article
                        key={feature.id}
                        draggable={editMode}
                        onDragStart={(e) => handleDragStart(e, feature.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, feature.id)}
                        onClick={(e) => handleActivityClick(feature.title, feature.route, e)}
                        role="button"
                        tabIndex={0}
                        className={`relative bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 group ${
                          editMode ? 'cursor-grab active:cursor-grabbing hover:shadow-lg' : 'hover:shadow-md cursor-pointer'
                        } ${draggedItem === feature.id ? 'opacity-50 scale-95' : ''}`}
                      >
                        {/* Drag Handle */}
                        {editMode && (
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700">
                              <IconGripVertical size={16} />
                            </div>
                          </div>
                        )}

                        {/* Hide Button */}
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActivityVisibility(feature.id);
                            }}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            title="Ocultar actividad"
                          >
                            <div className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700">
                              <IconX size={16} />
                            </div>
                          </button>
                        )}

                        {/* Header */}
                        <div
                          className="h-16 md:h-24 rounded-t-lg flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: `${feature.color}15` }}
                        >
                          {feature.image && (
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{ backgroundImage: `url('${feature.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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
                            <h3 className="font-medium text-gray-900 text-xs md:text-sm group-hover:text-blue-700 transition-colors line-clamp-1">
                              {feature.title}
                            </h3>
                            {!editMode && <IconChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />}
                          </div>

                          <p className="text-[10px] md:text-xs text-gray-600 mb-2 md:mb-3 line-clamp-2">
                            {feature.description}
                          </p>

                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="inline-block px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-medium rounded-full truncate"
                              style={{
                                backgroundColor: `${feature.color}15`,
                                color: feature.color
                              }}
                            >
                              {feature.category}
                            </span>

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
                        </div>
                      </article>
                    );
                  })}

                  {/* Hidden Features (only in edit mode) */}
                  {editMode && hiddenFeatures.map((feature) => (
                    <article
                      key={feature.id}
                      onClick={(e) => {
                        if (editMode) {
                          e.preventDefault();
                          toggleActivityVisibility(feature.id);
                        }
                      }}
                      className="relative bg-white rounded-lg shadow-sm border border-gray-300 transition-all duration-200 group cursor-pointer opacity-40 hover:opacity-60"
                    >
                      {/* Show Button (Plus) */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/5 group-hover:bg-black/10 transition-colors z-20">
                        <div className="bg-green-600 text-white p-3 rounded-full shadow-lg group-hover:bg-green-700">
                          <IconPlus size={24} />
                        </div>
                      </div>

                      {/* Header */}
                      <div
                        className="h-16 md:h-24 rounded-t-lg flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: `${feature.color}15` }}
                      >
                        {feature.image && (
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: `url('${feature.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          />
                        )}

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
                          <h3 className="font-medium text-gray-900 text-xs md:text-sm line-clamp-1">
                            {feature.title}
                          </h3>
                        </div>

                        <p className="text-[10px] md:text-xs text-gray-600 mb-2 md:mb-3 line-clamp-2">
                          {feature.description}
                        </p>

                        <span
                          className="inline-block px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${feature.color}15`,
                            color: feature.color
                          }}
                        >
                          {feature.category}
                        </span>
                      </div>
                    </article>
                  ))}
                </>
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <IconSearch size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron actividades
                    </h3>
                    <p className="text-gray-500 mb-4">
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
  );
};

export default EducationalProgressPanel;