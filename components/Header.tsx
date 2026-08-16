"use client";

import { Popover, Transition } from "@headlessui/react";
import {
  IconApps,
  IconUser,
  IconHome,
  IconBell,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ACTIVITIES } from "@/lib/activities";
import ClassroomService from "@/lib/classroomService";
import { ActivityIcon } from "@/components/ActivityIcon";

import cresiLogo from "@/public/cresi-logo.webp";

interface NavigationLink {
  name: string;
  href: string;
}


interface SuggestedActivity {
  name: string;
  href: string;
  icon: JSX.Element;
  reason: 'never_visited' | 'long_time_ago';
  lastVisit?: string;
}

export default function Header(): JSX.Element | null {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout, refreshProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>("CrESI");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [suggestedActivities, setSuggestedActivities] = useState<SuggestedActivity[]>([]);
  // Restricción de actividades de la clase del alumno (si tiene una).
  // `null` = sin restricción, se ven todas — mismo criterio que Features.tsx.
  const [allowedActivities, setAllowedActivities] = useState<string[] | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // El perfil ya lo trae useAuth() (centralizado, sin polling ni listeners
  // propios). Acá solo recalculamos las sugerencias cuando cambia.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Red de seguridad: justo después de loguearse, /unirse y /clase/[codigo]
  // escriben localStorage y navegan a /escritorio casi al mismo tiempo. El
  // evento 'cresi-session-updated' ya cubre esto, pero por si esa carrera
  // se da justo antes de que el listener del contexto quede armado, forzamos
  // una relectura apenas cambia la ruta.
  useEffect(() => {
    refreshProfile();
  }, [pathname, refreshProfile]);

  // Si el alumno tiene clase, traemos qué actividades habilitó el docente.
  useEffect(() => {
    const classroomId = profile?.profile?.classroomId;
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
  }, [profile?.profile?.classroomId]);

  const applications = useMemo(() => buildApplications(allowedActivities), [allowedActivities]);

  useEffect(() => {
    if (profile) {
      calculateSuggestedActivities(profile);
    } else {
      setSuggestedActivities([]);
    }
  }, [profile, applications]);

  const calculateSuggestedActivities = (data: NonNullable<typeof profile>) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activitySuggestions: SuggestedActivity[] = [];

    applications.forEach(app => {
      if (app.href === '/' || app.href === '/user') return;

      const activityId = app.href.substring(1);
      const lastVisit = data.progress?.lastVisits?.[activityId];

      if (!lastVisit) {
        activitySuggestions.push({
          name: app.name,
          href: app.href,
          icon: app.icon,
          reason: 'never_visited'
        });
      } else {
        const lastVisitDate = new Date(lastVisit);
        if (lastVisitDate < thirtyDaysAgo) {
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

    setSuggestedActivities(activitySuggestions.slice(0, 2));
  };

  useEffect(() => {
    const currentApp = applications.find(app => 
      pathname === app.href || pathname.startsWith(`${app.href}/`)
    );
    
    if (currentApp) {
      setCurrentSection(currentApp.name);
    } else {
      setCurrentSection("CrESI");
    }
  }, [pathname]);

  // El header entero se oculta hasta que sepamos que hay sesión — así la
  // landing de bienvenida (sin loguearse todavía) no muestra accesos a
  // "Aplicaciones"/"Configuración" que no tienen sentido sin usuario.
  // Este header es para alumnos. Los docentes tienen el suyo propio
  // (TeacherHeader, en app/docente/layout.tsx) con sus propias acciones.
  const showHeader = mounted && !!profile?.profile && profile.profile.role !== 'teacher';
  // Nunca pasamos "" a src: algunos perfiles (docentes, o alumnos legacy sin
  // avatar elegido) tienen character.image vacío. Un src="" hace que el
  // navegador re-pida la página entera, no solo que la imagen falle.
  const avatarSrc = profile?.profile?.character?.image || '/logocresi.svg';

  useEffect(() => {
    document.body.style.paddingTop = showHeader ? '64px' : '0px';
    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [showHeader]);

  // Si la imagen del avatar no carga (URL rota o vencida), mostramos el
  // logo de CrESI en su lugar en vez de dejar el ícono roto del navegador.
  // `onerror = null` evita un loop infinito si el propio fallback también fallara.
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/logocresi.svg';
  };

  const getTimeSinceVisit = (lastVisit: string): string => {
    const now = new Date();
    const visitDate = new Date(lastVisit);
    const diffDays = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 60) return 'Hace más de un mes';
    return 'Hace mucho tiempo';
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();

      // Redirigir a inicio
      router.push('/');

      // Recargar página completamente después de un pequeño delay
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  if (!showHeader) {
    return null;
  }

  const categorizedApps = applications.reduce((acc, app) => {
    const category = app.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(app);
    return acc;
  }, {} as Record<string, typeof applications>);

  return (
    <header className="h-16 px-6 w-full fixed top-0 z-50 bg-cream shadow-sm">
      <nav className="flex justify-between items-center h-full max-w-7xl mx-auto">
        {/* Lado izquierdo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src={cresiLogo}
              alt="Logotipo de CrESI"
              width={40}
              height={40}
              className="rounded-lg group-hover:scale-105 transition-transform"
            />

            <div className="hidden sm:block">
              <h1 className="text-xl font-medium text-ink group-hover:text-coral transition-colors">
                {currentSection}
              </h1>
              {profile && (
                <p className="text-xs text-ink/60">
                  Hola, {profile.profile.username}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button className="p-2 rounded-full hover:bg-pink-light transition-colors relative">
                  <IconBell className="w-5 h-5 text-ink/70" />
                  {suggestedActivities.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full"></span>
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
                  <Popover.Panel className="absolute z-[100] right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-pink-light overflow-hidden">
                    <div className="p-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                      <h3 className="text-sm font-medium text-ink mb-3">Notificaciones</h3>

                      {suggestedActivities.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-pink-light rounded-full flex items-center justify-center mx-auto mb-3">
                            <IconBell className="w-6 h-6 text-coral" />
                          </div>
                          <p className="text-sm text-ink/60">No hay notificaciones</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {suggestedActivities.map((activity, index) => (
                            <Link
                              key={index}
                              href={activity.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-cream transition-colors w-full text-left"
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-mint rounded-lg flex items-center justify-center">
                                <span className="text-mint-text">{activity.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink mb-1">
                                  {activity.name}
                                </p>
                                <p className="text-xs text-ink/60">
                                  {activity.reason === 'never_visited'
                                    ? '¡Nueva actividad disponible! Explórala ahora'
                                    : `${getTimeSinceVisit(activity.lastVisit!)} desde tu última visita`
                                  }
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {/* Configuración */}
          <Link
            href="/user"
            className="p-2 rounded-full hover:bg-pink-light transition-colors"
          >
            <IconSettings className="w-5 h-5 text-ink/70" />
          </Link>

          {/* Aplicaciones */}
          <Popover className="relative">
            {({ open, close }) => (
              <>
                <Popover.Button className={`p-2 rounded-full hover:bg-pink-light transition-colors ${open ? 'bg-pink-light' : ''}`}>
                  <IconApps className="w-5 h-5 text-ink/70" />
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
                  <Popover.Panel className="absolute z-[100] right-0 mt-2 w-80 max-h-[calc(100vh-100px)] overflow-y-auto bg-white rounded-xl shadow-xl border border-pink-light">
                    <div className="p-4">
                      {profile && (
                        <div className="mb-4 pb-4 border-b border-pink-light">
                          <div className="flex items-center gap-3">
                            <Image
                              src={avatarSrc}
                              alt={profile.profile.username}
                              onError={handleAvatarError}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {profile.profile.username}
                              </p>
                              <p className="text-xs text-ink/60">
                                {profile.game.totalScore} puntos • {profile.game.totalLives} vidas
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <h3 className="text-sm font-medium text-ink/60 mb-3">Aplicaciones CrESI</h3>

                      {Object.entries(categorizedApps).map(([category, apps]) => (
                        <div key={category} className="mb-4 last:mb-0">
                          <h4 className="text-xs font-medium text-ink/40 uppercase tracking-wide mb-2">
                            {category}
                          </h4>

                          <div className="grid grid-cols-3 gap-2">
                            {apps.map((application) => {
                              const activityId = application.href.substring(1);
                              const isCompleted = profile?.progress.completedActivities.includes(activityId);

                              return (
                                <Link
                                  key={application.name}
                                  href={application.href}
                                  className="flex flex-col items-center p-3 rounded-lg hover:bg-cream transition-colors group relative"
                                  onClick={() => close()}
                                >
                                  <div className="w-10 h-10 bg-mint rounded-lg flex items-center justify-center mb-2 group-hover:bg-mint-light transition-colors">
                                    <span className="text-mint-text">{application.icon}</span>
                                  </div>
                                  {isCompleted && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-mint-accent rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                      </svg>
                                    </div>
                                  )}
                                  <span className="text-xs text-center text-ink/80 leading-tight">
                                    {application.name}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-pink-light p-3">
                      <Link
                        href="/user"
                        className="w-full text-left text-sm text-coral-dark hover:text-coral font-medium block"
                        onClick={() => close()}
                      >
                        Ver perfil completo
                      </Link>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {/* Avatar con Popover de Logout */}
          {profile && (
            <Popover className="relative">
              {({ open, close }) => (
                <>
                  <Popover.Button className="p-0 rounded-full hover:ring-2 hover:ring-coral transition-all">
                    <Image
                      src={avatarSrc}
                      alt={profile.profile.username}
                      onError={handleAvatarError}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full cursor-pointer object-cover"
                    />
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
                    <Popover.Panel className="absolute z-[100] right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-pink-light overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-pink-light">
                          <Image
                            src={avatarSrc}
                            alt={profile.profile.username}
                            onError={handleAvatarError}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {profile.profile.username}
                            </p>
                            <p className="text-xs text-ink/60">
                              {profile.game.totalScore} puntos
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <Link
                            href="/user"
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-ink/80 rounded-lg hover:bg-cream transition-colors"
                            onClick={() => close()}
                          >
                            <IconUser className="w-4 h-4 text-ink/60" />
                            <span>Ver perfil</span>
                          </Link>
                        </div>

                        <div className="border-t border-pink-light pt-4 mt-4">
                          <button
                            onClick={() => {
                              close();
                              handleLogout();
                            }}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-coral-dark rounded-lg hover:bg-pink-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <IconLogout className="w-4 h-4" />
                            <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
                          </button>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          )}
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

/**
 * Antes esto era un array hardcodeado, separado del catálogo único
 * (lib/activities.ts) — por eso el menú de apps del header ni sabía que
 * existía una restricción por clase, y de paso le faltaban 7 de las 15
 * actividades reales. Ahora sale del mismo catálogo que todo lo demás, y
 * respeta `allowedActivities` si el alumno tiene una clase con restricción.
 */
function buildApplications(allowedActivities: string[] | null): Application[] {
  const base: Application[] = [
    { name: "Inicio", href: "/", icon: <IconHome />, isExternal: false, category: "Principal" },
    { name: "Perfil", href: "/user", icon: <IconUser />, isExternal: false, category: "Principal" },
  ];

  const activityApps: Application[] = ACTIVITIES
    .filter((a) => !allowedActivities || allowedActivities.includes(a.id))
    .map((a) => ({
      name: a.title,
      href: a.route,
      icon: <ActivityIcon iconName={a.iconName} />,
      isExternal: false,
      category: a.category,
    }));

  return [...base, ...activityApps];
}