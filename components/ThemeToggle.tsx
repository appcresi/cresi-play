'use client';

import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: number;
}

export default function ThemeToggle({ className = '', size = 18 }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Modo día' : 'Modo noche'}
      aria-label={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      className={`flex items-center justify-center rounded-full transition-colors hover:opacity-80 ${className}`}
    >
      {theme === 'dark' ? (
        <IconSun size={size} className="text-gold-accent" />
      ) : (
        <IconMoon size={size} className="text-ink/70" />
      )}
    </button>
  );
}
