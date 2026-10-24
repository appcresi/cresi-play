'use client';

import { useEffect, useState } from 'react';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';
import { isSoundOn, onSoundChange, setSoundOn } from '@/lib/sounds';

interface SoundToggleProps {
  className?: string;
  size?: number;
}

export default function SoundToggle({ className = '', size = 18 }: SoundToggleProps) {
  // Arranca "activado" para que el HTML del servidor coincida; se corrige al montar.
  const [on, setOn] = useState(true);

  useEffect(() => {
    const sync = () => setOn(isSoundOn());
    sync();
    return onSoundChange(sync);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setSoundOn(!on)}
      title={on ? 'Silenciar sonidos' : 'Activar sonidos'}
      aria-label={on ? 'Silenciar sonidos' : 'Activar sonidos'}
      aria-pressed={!on}
      className={`flex items-center justify-center rounded-full transition-colors hover:opacity-80 ${className}`}
    >
      {on ? (
        <IconVolume size={size} className="text-ink/70 dark:text-gray-300" />
      ) : (
        <IconVolumeOff size={size} className="text-ink/40 dark:text-gray-500" />
      )}
    </button>
  );
}
