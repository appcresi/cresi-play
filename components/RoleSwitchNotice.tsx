'use client';

import React, { useState } from 'react';
import { IconUserQuestion, IconLoader } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import UserDataSync from '@/lib/userDataSync';
import type { UserData, UserRole } from '@/types/user';

const PROFILE_STORAGE_KEY = 'cresi_user_data';

const ROLE_LABEL: Record<UserRole, string> = {
  teacher: 'docente',
  student: 'alumno/a',
};

/**
 * El rol (docente/alumno) se guarda en localStorage del navegador, no en
 * la cuenta de Google — así que un mismo navegador usado primero como
 * alumno y después para entrar como docente (o viceversa) quedaba
 * "trabado": la guarda de rol de TeacherAreaShell/EscritorioLayout
 * redirigía en silencio a la pantalla principal, sin explicar por qué ni
 * dar una salida. Esta pantalla reemplaza ese rebote silencioso por una
 * elección explícita.
 */
export const RoleSwitchNotice = ({ targetRole, sectionLabel }: { targetRole: UserRole; sectionLabel: string }) => {
  const { role, refreshProfile, logout } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as UserData;
        data.profile.role = targetRole;
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('cresi-session-updated'));
        refreshProfile();
        UserDataSync.syncCompleteData(data).catch((err) => console.error('Error sincronizando el cambio de rol:', err));
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-8 max-w-md text-center">
        <div className="w-14 h-14 bg-pink-light dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconUserQuestion className="w-7 h-7 text-ink/60 dark:text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-ink dark:text-gray-100 mb-2">
          Este navegador está usando una sesión de {role ? ROLE_LABEL[role] : ''}
        </h2>
        <p className="text-sm text-ink/70 dark:text-gray-400 mb-6">
          Para entrar a {sectionLabel} necesitás una sesión de {ROLE_LABEL[targetRole]}. Podés seguir con esta
          cuenta cambiando el tipo de sesión, o cerrar sesión y entrar de nuevo.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSwitch}
            disabled={switching}
            className="px-5 py-2.5 rounded-full bg-coral text-white font-medium hover:bg-coral-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {switching && <IconLoader className="w-4 h-4 animate-spin" />}
            Seguir como {ROLE_LABEL[targetRole]} con esta cuenta
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-5 py-2.5 rounded-full bg-pink-light dark:bg-gray-700 text-ink/80 dark:text-gray-300 font-medium hover:bg-pink dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loggingOut && <IconLoader className="w-4 h-4 animate-spin" />}
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
