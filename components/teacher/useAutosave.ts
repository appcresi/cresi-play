import { useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 600;
const SAVED_RESET_MS = 1500;

/**
 * Autoguardado con debounce: agrupa varios cambios seguidos (ej. tocar
 * varias tarjetas rápido) en un solo guardado, en vez de mandar un request
 * por cada click. Usado por todos los "Picker" de visibilidad del panel
 * docente (trivias, completa palabras, infografías, preguntas, actividades)
 * — antes cada uno reimplementaba este mismo timer + máquina de estados.
 */
export function useAutosave() {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = (save: () => Promise<void>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        await save();
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), SAVED_RESET_MS);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, SAVE_DEBOUNCE_MS);
  };

  return { saveState, scheduleSave };
}
