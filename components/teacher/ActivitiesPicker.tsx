import React, { useState, useRef } from 'react';
import { IconCheck } from '@tabler/icons-react';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { ACTIVITIES } from '@/lib/activities';
import { ActivityIcon } from './icons';
import { SaveIndicator } from './SaveIndicator';

const ACTIVITIES_CATALOG = ACTIVITIES;

// ==================== "Actividades visibles" (inline, autoguardado) ====================

export const ActivitiesPicker = ({
  classroom,
  totalActivities,
  onChanged,
}: {
  classroom: Classroom;
  totalActivities: number;
  onChanged: (allowedActivities: string[] | null) => void;
}) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(classroom.allowedActivities ?? ACTIVITIES_CATALOG.map((a) => a.id))
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autoguardado: esperamos un toque a que la persona termine de tocar
  // varias tarjetas seguidas antes de escribir en Firestore, en vez de
  // mandar un request por cada click.
  const scheduleSave = (next: Set<string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        const activityIds = Array.from(next);
        await ClassroomService.updateAllowedActivities(classroom.id, activityIds);
        onChanged(activityIds);
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, 600);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      // No dejamos que se quede sin ninguna actividad visible.
      if (prev.has(id) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      scheduleSave(next);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(ACTIVITIES_CATALOG.map((a) => a.id));
    setSelected(next);
    scheduleSave(next);
  };

  const selectNone = () => {
    // Dejamos al menos la primera, por la misma razón de arriba.
    const next = new Set([ACTIVITIES_CATALOG[0]?.id].filter(Boolean) as string[]);
    setSelected(next);
    scheduleSave(next);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-gray-900">Actividades visibles</h3>
        <SaveIndicator state={saveState} />
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Tocá una tarjeta para prenderla/apagarla — se guarda solo. Los alumnos de esta
        clase solo ven las que estén marcadas ({selected.size}/{totalActivities}).
      </p>

      <div className="flex gap-3 text-xs mb-3">
        <button onClick={selectAll} className="text-indigo-600 hover:underline font-medium">
          Marcar todas
        </button>
        <button onClick={selectNone} className="text-gray-500 hover:underline font-medium">
          Desmarcar todas
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ACTIVITIES_CATALOG.map((activity) => {
          const isOn = selected.has(activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => toggle(activity.id)}
              className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
                isOn
                  ? 'border-transparent shadow-sm'
                  : 'border-gray-100 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
              }`}
              style={isOn ? { borderColor: activity.color, backgroundColor: `${activity.color}0D` } : undefined}
            >
              {isOn && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: activity.color }}
                >
                  <IconCheck className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
                style={{ backgroundColor: activity.color }}
              >
                <ActivityIcon iconName={activity.iconName} className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 break-words">{activity.title}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{activity.category}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};