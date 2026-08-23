"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebaseAuth';
import { IconClock } from '@tabler/icons-react';

// ─────────────────────────────────────────────────────────────────────
// Configuración — cambiá estos dos números si querés otro tiempo.
// Pensado sobre todo para computadoras compartidas (aula de informática):
// si alguien se va sin cerrar sesión, la sesión se cierra sola.
const INACTIVITY_TIMEOUT_MINUTES = 10;
const WARNING_SECONDS_BEFORE_LOGOUT = 60;
// ─────────────────────────────────────────────────────────────────────

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

export default function InactivityGuard(): JSX.Element | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS_BEFORE_LOGOUT);

  // Refs en vez de solo estado: los timers necesitan verse entre renders
  // sin volver a registrar los listeners de actividad cada vez.
  const warnTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const showWarningRef = useRef(false);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    setShowWarning(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión por inactividad:', err);
    }
    router.push('/');
  }, [clearTimers, router]);

  const resetTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    setSecondsLeft(WARNING_SECONDS_BEFORE_LOGOUT);

    const warningDelayMs =
      INACTIVITY_TIMEOUT_MINUTES * 60 * 1000 - WARNING_SECONDS_BEFORE_LOGOUT * 1000;

    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      let remaining = WARNING_SECONDS_BEFORE_LOGOUT;
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
        if (remaining <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      }, 1000);
    }, warningDelayMs);

    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);
  }, [clearTimers, handleLogout]);

  // Solo nos importa si hay una sesión activa.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    resetTimers();

    // Mientras se está mostrando el aviso, un movimiento incidental del
    // mouse (o algo rozándolo) NO lo cierra solo — hace falta el clic
    // explícito en "Seguir usando". Es a propósito: si alguien ya se fue,
    // no queremos que la sesión se mantenga viva por accidente.
    const handleActivity = () => {
      if (!showWarningRef.current) {
        resetTimers();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-pink-light dark:border-gray-700 max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconClock size={28} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-ink dark:text-gray-100 mb-2">¿Seguís ahí?</h2>
        <p className="text-ink/60 dark:text-gray-400 text-sm mb-1">
          Tu sesión se va a cerrar por inactividad en:
        </p>
        <p className="text-3xl font-bold text-amber-600 mb-5">{secondsLeft}s</p>
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 border border-pink-light dark:border-gray-700 text-ink/80 dark:text-gray-300 font-semibold rounded-full hover:bg-cream dark:hover:bg-gray-700 transition"
          >
            Cerrar sesión
          </button>
          <button
            onClick={resetTimers}
            className="flex-1 px-4 py-2.5 bg-coral hover:bg-coral-dark text-white font-semibold rounded-full transition"
          >
            Seguir usando
          </button>
        </div>
      </div>
    </div>
  );
}