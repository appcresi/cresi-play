"use client";

import { Popover, Transition } from "@headlessui/react";
import {
  IconApps,
  IconCards,
  IconUser,
  IconAB2,
  IconHome,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconBooks,
  IconBell,
  IconSettings
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import cresiLogo from "public/cresi-logo.webp";

interface NavigationLink {
  name: string;
  href: string;
}

interface MoodEntry {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  date?: string;
}

interface UserData {
  profile: {
    character: {
      id: number;
      name: string;
      image: string;
    };
    username: string;
    createdAt: string;
    lastLogin: string;
  };
  game: {
    totalScore: number;
    totalLives: number;
    streak: number;
  };
  progress: {
    completedActivities: string[];
    activityScores: { [key: string]: number };
    activityTimes: { [key: string]: string };
    lastVisits: { [key: string]: string };
  };
  mood: {
    history: MoodEntry[];
    lastEntry: MoodEntry | null;
  };
  achievements: Achievement[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

interface SuggestedActivity {
  name: string;
  href: string;
  icon: JSX.Element;
  reason: 'never_visited' | 'long_time_ago';
  lastVisit?: string;
}

const STORAGE_KEY = 'cresi_user_data';

export default function Header(): JSX.Element {
  const pathname = usePathname();
  const [currentSection, setCurrentSection] = useState<string>("CrESI");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [suggestedActivities, setSuggestedActivities] = useState<SuggestedActivity[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Cargar userData
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        calculateSuggestedActivities(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const calculateSuggestedActivities = (data: UserData) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activitySuggestions: SuggestedActivity[] = [];

    applications.forEach(app => {
      // Ignorar "Inicio" y "Perfil"
      if (app.href === '/' || app.href === '/user') return;

      const activityId = app.href.substring(1); // Remove leading '/'
      const lastVisit = data.progress.lastVisits[activityId];

      if (!lastVisit) {
        // Nunca visitada
        activitySuggestions.push({
          name: app.name,
          href: app.href,
          icon: app.icon,
          reason: 'never_visited'
        });
      } else {
        const lastVisitDate = new Date(lastVisit);
        if (lastVisitDate < thirtyDaysAgo) {
          // No visitada en más de 30 días
          activitySuggestions.push({
            name: app.name,
            href: app.href,
            icon: app.icon,
            reason: 'long_time_ago',
            lastVisit: lastVisit
          });
        }
      }
    });

    // Ordenar: primero las nunca visitadas, luego las más antiguas
    activitySuggestions.sort((a, b) => {
      if (a.reason === 'never_visited' && b.reason !== 'never_visited') return -1;
      if (a.reason !== 'never_visited' && b.reason === 'never_visited') return 1;
      
      if (a.reason === 'long_time_ago' && b.reason === 'long_time_ago') {
        const dateA = new Date(a.lastVisit!);
        const dateB = new Date(b.lastVisit!);
        return dateA.getTime() - dateB.getTime();
      }
      
      return 0;
    });

    // Tomar solo las primeras 2
    setSuggestedActivities(activitySuggestions.slice(0, 2));
  };

  useEffect(() => {
    // Encuentra la aplicación correspondiente a la ruta actual
    const currentApp = applications.find(app => 
      pathname === app.href || pathname.startsWith(`${app.href}/`)
    );
    
    // Si encuentra una aplicación, establece su nombre como la sección actual
    if (currentApp) {
      setCurrentSection(currentApp.name);
    } else {
      setCurrentSection("CrESI"); // Valor por defecto
    }
  }, [pathname]);

  useEffect(() => {
    const headerHeight = 64;
    document.body.style.paddingTop = `${headerHeight}px`;

    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, []);

  const getTimeSinceVisit = (lastVisit: string): string => {
    const now = new Date();
    const visitDate = new Date(lastVisit);
    const diffDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 60) return 'Hace más de un mes';
    return 'Hace mucho tiempo';
  };

  return (
    <header className="h-16 px-6 w-full fixed top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="flex justify-between items-center h-full max-w-7xl mx-auto">
        {/* Lado izquierdo - Logo y título */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center gap-3">
              <Image
                src={cresiLogo}
                alt="Logotipo de CrESI"
                width={40}
                height={40}
                className="rounded-lg group-hover:scale-105 transition-transform"
              />
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {currentSection}
                </h1>
                {userData && (
                  <p className="text-xs text-gray-500">
                    Hola, {userData.profile.username}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </div>
        
        {/* Lado derecho - Controles */}
        <div className="flex items-center gap-2">
          {/* Botón de notificaciones */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                  <IconBell className="w-5 h-5 text-gray-600" />
                  {/* Indicador de notificación */}
                  {suggestedActivities.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Popover.Button>

                <Transition
                  as={Fragment}
                  enter="transition duration-200 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-150 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Popover.Panel className="absolute z-[100] right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                      <h3 className="text-sm font-medium text-gray-800 mb-3">Notificaciones</h3>
                      
                      {suggestedActivities.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <IconBell className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">No hay notificaciones</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {suggestedActivities.map((activity, index) => (
                            <Popover.Button
                              key={index}
                              as={Link}
                              href={activity.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600">{activity.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 mb-1">
                                  {activity.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {activity.reason === 'never_visited' 
                                    ? '¡Nueva actividad disponible! Explórala ahora'
                                    : `${getTimeSinceVisit(activity.lastVisit!)} desde tu última visita`
                                  }
                                </p>
                              </div>
                            </Popover.Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {/* Botón de configuración */}
          <Link 
            href="/user"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <IconSettings className="w-5 h-5 text-gray-600" />
          </Link>

          {/* Popover de aplicaciones */}
          <ApplicationsPopover 
            onOpenChange={setIsPopoverOpen}
            userData={userData}
          />

          {/* Avatar del usuario */}
          <Link href="/user">
            {userData?.profile.character.image ? (
              <img
                src={userData.profile.character.image}
                alt={userData.profile.username}
                className="w-8 h-8 rounded-full hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
              />
            ) : (
              <button className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm hover:bg-blue-600 transition-colors">
                {userData?.profile.username.charAt(0).toUpperCase() || 'U'}
              </button>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}

interface Application extends NavigationLink {
  icon: JSX.Element;
  isExternal: boolean;
  category?: string;
}

const applications: Application[] = [
  { name: "Inicio", href: "/", icon: <IconHome />, isExternal: false, category: "Principal" },
  { name: "Perfil", href: "/user", icon: <IconUser />, isExternal: false, category: "Principal" },
  { name: "Trivias", href: "/trivias", icon: <IconCards />, isExternal: false, category: "Juegos" },
  { name: "Pasapalabras", href: "/pasapalabras", icon: <IconAB2 />, isExternal: false, category: "Juegos" },
  { name: "Completa Palabras", href: "/completapalabras", icon: <IconBrandPnpm />, isExternal: false, category: "Juegos" },
  { name: "Simulador Grooming", href: "/simulador", icon: <IconShieldCheck />, isExternal: false, category: "Seguridad" },
  { name: "DataMuncher", href: "/datamuncher", icon: <IconPacman />, isExternal: false, category: "Herramientas" },
  { name: "MoodTracker", href: "/moodtracker", icon: <IconMoodPuzzled />, isExternal: false, category: "Bienestar" },
  { name: "Meme Creator", href: "/memegenerador", icon: <IconMoodTongueWink2 />, isExternal: false, category: "Creatividad" },
  { name: "Literatura", href: "/literatura", icon: <IconBooks />, isExternal: false, category: "Educación" }
];

interface ApplicationsPopoverProps {
  onOpenChange: (isOpen: boolean) => void;
  userData: UserData | null;
}

function ApplicationsPopover({ onOpenChange, userData }: ApplicationsPopoverProps): JSX.Element {
  const categorizedApps = applications.reduce((acc, app) => {
    const category = app.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <Popover className="relative">
      {({ open, close }) => {
        useEffect(() => {
          onOpenChange(open);
        }, [open, onOpenChange]);

        return (
          <>
            <Popover.Button className={`
              p-2 rounded-full hover:bg-gray-100 transition-colors
              ${open ? 'bg-gray-100' : ''}
            `}>
              <IconApps className="w-5 h-5 text-gray-600" />
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition duration-200 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-150 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Popover.Panel className="absolute z-[100] right-0 mt-2 w-80 max-h-[calc(100vh-100px)] overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200">
                <div className="p-4">
                  {/* Header con info del usuario */}
                  {userData && (
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={userData.profile.character.image}
                          alt={userData.profile.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {userData.profile.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userData.game.totalScore} puntos • {userData.game.totalLives} vidas
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Aplicaciones CrESI</h3>
                  
                  {Object.entries(categorizedApps).map(([category, apps]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        {category}
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {apps.map((application) => {
                          // Verificar si la actividad está completada
                          const activityId = application.href.substring(1); // Remove leading '/'
                          const isCompleted = userData?.progress.completedActivities.includes(activityId);
                          
                          return (
                            <Popover.Button
                              key={application.name}
                              as={application.isExternal ? 'a' : Link}
                              href={application.href}
                              target={application.isExternal ? '_blank' : undefined}
                              rel={application.isExternal ? 'noreferrer' : undefined}
                              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group relative"
                              onClick={() => close()}
                            >
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                                <span className="text-blue-600">{application.icon}</span>
                              </div>
                              {isCompleted && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                </div>
                              )}
                              <span className="text-xs text-center text-gray-700 leading-tight">
                                {application.name}
                              </span>
                            </Popover.Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Footer del popover */}
                <div className="border-t border-gray-100 p-3">
                  <Link
                    href="/user"
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium block"
                    onClick={() => close()}
                  >
                    Ver perfil completo
                  </Link>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
}