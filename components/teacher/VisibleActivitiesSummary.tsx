import React from 'react';
import type { Classroom } from '@/types/classroom';
import { ACTIVITIES } from '@/lib/activities';
import { formatAgeCycles } from '@/types/activity';
import { ActivityIcon } from './icons';

const ACTIVITIES_CATALOG = ACTIVITIES;

export const VisibleActivitiesSummary = ({ classroom }: { classroom: Classroom }) => {
  const visible = classroom.allowedActivities
    ? ACTIVITIES_CATALOG.filter((a) => classroom.allowedActivities!.includes(a.id))
    : ACTIVITIES_CATALOG;

  if (visible.length === 0) {
    return <p className="text-xs text-ink/40 dark:text-gray-500">Todavía no hay actividades seleccionadas.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {visible.map((activity) => (
        <div
          key={activity.id}
          className="rounded-xl border-2 border-transparent shadow-sm p-3 min-w-0"
          style={{ borderColor: activity.color, backgroundColor: `${activity.color}0D` }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
            style={{ backgroundColor: activity.color }}
          >
            <ActivityIcon iconName={activity.iconName} className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-ink dark:text-gray-100 leading-tight mb-0.5 break-words">{activity.title}</p>
          <p className="text-[10px] text-ink/60 dark:text-gray-400 leading-tight">{activity.category}</p>
          <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-ink/5 dark:bg-gray-700 text-ink/70 dark:text-gray-300">
            {formatAgeCycles(activity.ageCycles)}
          </span>
        </div>
      ))}
    </div>
  );
};