import React, { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import type { Tarea } from '@/types/tarea';

const MAX_SHOWN = 4;

/**
 * Recuadro chico con las próximas tareas a vencer (fecha de entrega más
 * cercana primero, solo las que todavía no vencieron). Va en la columna
 * chica del Tablón/Novedades, al lado del código de la clase.
 */
export const ProximasEntregasBox = ({ classroomId }: { classroomId: string }) => {
  const [upcoming, setUpcoming] = useState<Tarea[] | null>(null);

  useEffect(() => {
    TareaService.getTareasForClassroom(classroomId)
      .then((list) => {
        // getTareasForClassroom ya devuelve ordenado por dueDate ascendente.
        const now = Date.now();
        setUpcoming(list.filter((t) => new Date(t.dueDate).getTime() >= now).slice(0, MAX_SHOWN));
      })
      .catch((err) => {
        console.error('Error cargando próximas entregas:', err);
        setUpcoming([]);
      });
  }, [classroomId]);

  if (upcoming === null || upcoming.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
        <IconClock className="w-4 h-4 text-indigo-600" />
        Próximas a entregar
      </h3>
      <ul className="space-y-2">
        {upcoming.map((t) => (
          <li key={t.id} className="text-xs">
            <p className="font-medium text-gray-800 truncate">{t.title}</p>
            <p className="text-gray-500">{new Date(t.dueDate).toLocaleDateString('es-AR')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};