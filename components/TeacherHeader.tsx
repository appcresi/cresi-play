'use client';

import React, { Fragment, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Popover, Transition } from '@headlessui/react';
import { IconSchool, IconLogout, IconChevronDown } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';

export default function TeacherHeader(): JSX.Element {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const username = profile?.profile?.username?.trim() || 'Docente';
  const initial = username.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/');
      // Recarga completa, mismo criterio que usa el header de alumnos.
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  const navTabs = [
    { href: '/docente', label: 'Mis clases' },
    { href: '/docente/trivias', label: 'Mis trivias' },
    { href: '/docente/completapalabras', label: 'Completa Palabras' },
  ];

  return (
    <header className="w-full bg-cream shadow-sm shrink-0">
      <nav className="h-16 px-6 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/docente" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-coral flex items-center justify-center shrink-0">
            <IconSchool className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="hidden sm:block text-base font-semibold text-ink group-hover:text-coral transition-colors">
            CrESI Docentes
          </h1>
        </Link>

        <Popover className="relative">
          {({ close }) => (
            <>
              <Popover.Button className="flex items-center gap-2 hover:bg-pink-light rounded-full pl-1 pr-3 py-1 transition-colors">
                <div className="w-8 h-8 rounded-full bg-mint text-mint-text flex items-center justify-center text-sm font-bold shrink-0">
                  {initial}
                </div>
                <span className="hidden sm:block text-sm font-medium text-ink/80 max-w-[160px] truncate">
                  {username}
                </span>
                <IconChevronDown className="w-4 h-4 text-ink/40" />
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
                <Popover.Panel className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-pink-light overflow-hidden z-50">
                  <div className="p-3 border-b border-pink-light">
                    <p className="text-sm font-medium text-ink truncate">{username}</p>
                    <p className="text-xs text-ink/60">Docente</p>
                  </div>
                  <button
                    onClick={() => { close(); handleLogout(); }}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600
                             hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconLogout className="w-4 h-4" />
                    {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                  </button>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </nav>

      {/* Navegación fija del área de docente — visible en cualquier
          pantalla, no solo enterrada adentro de una clase puntual. */}
      <div className="border-t border-pink-light">
        <div className="max-w-6xl mx-auto px-6 flex gap-6">
          {navTabs.map((tab) => {
            const isActive = tab.href === '/docente'
              ? pathname === '/docente'
              : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-coral text-coral-dark'
                    : 'border-transparent text-ink/60 hover:text-ink/80'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}