import React, { useState } from 'react';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { ACTIVITIES } from '@/lib/activities';
import { ActivityIcon } from './icons';
import { SaveIndicator } from './SaveIndicator';
import { ToggleCard } from './ToggleCard';
import { useAutosave } from './useAutosave';

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
  const { saveState, scheduleSave } = useAutosave();

  const save = (next: Set<string>) => scheduleSave(async () => {
    const activityIds = Array.from(next);
    await ClassroomService.updateAllowedActivities(classroom.id, activityIds);
    onChanged(activityIds);
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      // No dejamos que se quede sin ninguna actividad visible.
      if (prev.has(id) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(ACTIVITIES_CATALOG.map((a) => a.id));
    setSelected(next);
    save(next);
  };

  const selectNone = () => {
    // Dejamos al menos la primera, por la misma razón de arriba.
    const next = new Set([ACTIVITIES_CATALOG[0]?.id].filter(Boolean) as string[]);
    setSelected(next);
    save(next);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-ink dark:text-gray-100">Actividades visibles</h3>
        <SaveIndicator state={saveState} />
      </div>
      <p className="text-xs text-ink/60 dark:text-gray-400 mb-3">
        Tocá una tarjeta para prenderla/apagarla — se guarda solo. Los alumnos de esta
        clase solo ven las que estén marcadas ({selected.size}/{totalActivities}).
      </p>

      <div className="flex gap-3 text-xs mb-3">
        <button onClick={selectAll} className="text-coral-dark hover:underline font-medium">
          Marcar todas
        </button>
        <button onClick={selectNone} className="text-ink/60 dark:text-gray-400 hover:underline font-medium">
          Desmarcar todas
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ACTIVITIES_CATALOG.map((activity) => (
          <ToggleCard
            key={activity.id}
            isOn={selected.has(activity.id)}
            color={activity.color}
            icon={<ActivityIcon iconName={activity.iconName} className="w-5 h-5" />}
            title={activity.title}
            subtitle={activity.category}
            onClick={() => toggle(activity.id)}
          />
        ))}
      </div>
    </div>
  );
};