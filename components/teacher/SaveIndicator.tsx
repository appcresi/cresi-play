import React from 'react';
import { IconLoader, IconCheck } from '@tabler/icons-react';

// Indicador chico y compartido para el autoguardado (actividades, trivias y preguntas).
export const SaveIndicator = ({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) => {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs text-ink/40 shrink-0">
        <IconLoader className="w-3.5 h-3.5 animate-spin" /> Guardando...
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
        <IconCheck className="w-3.5 h-3.5" /> Guardado
      </span>
    );
  }
  if (state === 'error') {
    return <span className="text-xs text-red-600 shrink-0">No se pudo guardar</span>;
  }
  return null;
};