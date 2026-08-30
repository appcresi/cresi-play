'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconLoader,
  IconDownload,
  IconExternalLink,
  IconCards,
  IconSearch,
  IconPhoto,
  IconTypography,
  IconApps,
  IconPuzzle,
  IconCloud,
  IconClipboardList,
  IconMaximize,
  IconX,
} from '@tabler/icons-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseFirestore';
import { BuscadorInline } from '@/components/tareas/BuscadorInline';
import { BiopuzzleInline } from '@/components/tareas/BiopuzzleInline';
import { NubeDePalabrasInline } from '@/components/tareas/NubeDePalabrasInline';
import { TriviaInline } from '@/components/tareas/TriviaInline';
import { CompletaPalabrasInline } from '@/components/tareas/CompletaPalabrasInline';
import type { LinkedActivity } from '@/types/tarea';

export const LINKED_TYPE_LABELS: Record<LinkedActivity['type'], string> = {
  libre: '',
  trivia: 'Jugar la trivia',
  buscador: 'Ir al Buscador de Preguntas',
  infografia: 'Ver la infografía',
  completapalabras: 'Ir a Completa Palabras',
  biopuzzle: 'Jugar BioPuzzle',
  nube: 'Mandar una palabra',
  actividad: 'Ir a la actividad',
};

const LINKED_TYPE_ICONS: Record<LinkedActivity['type'], React.ComponentType<{ size?: number; className?: string }>> = {
  libre: IconClipboardList,
  trivia: IconCards,
  buscador: IconSearch,
  infografia: IconPhoto,
  completapalabras: IconTypography,
  biopuzzle: IconPuzzle,
  nube: IconCloud,
  actividad: IconApps,
};

/** A dónde manda la actividad ligada — cuando hay una ruta directa
 *  (trivia, actividad del catálogo, sistema puntual de BioPuzzle, sesión
 *  de Nube de Palabras), deep-link preciso; para las demás, a la sección
 *  general (no hay una URL por ítem). */
function linkedActivityHref(linked: LinkedActivity): string | null {
  switch (linked.type) {
    case 'trivia':
      return linked.id ? `/trivias/pregame/${linked.id}` : '/trivias';
    case 'buscador':
      return '/buscador';
    case 'infografia':
      return '/infografias';
    case 'completapalabras':
      return '/lecciones';
    case 'biopuzzle':
      return linked.id ? `/biopuzzle?sistema=${linked.id}` : '/biopuzzle';
    case 'nube':
      return linked.id ? `/nube/${linked.id}` : null;
    case 'actividad':
      if (!linked.id) return null;
      // Compatibilidad con tareas viejas, de cuando BioPuzzle vivía
      // anidado dentro de "Actividad del catálogo" (ver CreateTareaScreen.tsx).
      return linked.id === 'biopuzzle' && linked.subId
        ? `/biopuzzle?sistema=${linked.subId}`
        : `/${linked.id}`;
    default:
      return null;
  }
}

interface InfografiaData {
  title: string;
  informacion: string;
  cover: string;
  download: string;
}

// Para infografías, mostramos la imagen y el texto directo en vez de
// mandar a la página de Infografías (que lista todas) — así se ve de qué
// se trata sin salir de la tarea. Un clic la abre completa (sin recortar).
const InlineInfografia = ({ infografiaId }: { infografiaId: string }) => {
  const [data, setData] = useState<InfografiaData | null | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'infografias', infografiaId))
      .then((snap) => setData(snap.exists() ? (snap.data() as InfografiaData) : null))
      .catch(() => setData(null));
  }, [infografiaId]);

  if (data === undefined) {
    return (
      <div className="flex items-center gap-2 text-ink/40 dark:text-gray-500 text-sm py-2">
        <IconLoader className="w-4 h-4 animate-spin" /> Cargando infografía...
      </div>
    );
  }

  if (data === null) {
    return <p className="text-sm text-ink/40 dark:text-gray-500">No se pudo cargar la infografía.</p>;
  }

  return (
    <div className="border border-pink-light dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(true)}
        title="Ver completa"
        className="group relative block w-full h-72 sm:h-96 bg-pink-light dark:bg-gray-700 cursor-zoom-in"
      >
        <Image src={data.cover} alt={data.title} fill sizes="600px" className="object-contain" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <IconMaximize className="w-4.5 h-4.5 text-white" />
          </div>
        </div>
      </button>
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-ink dark:text-gray-100">{data.title}</h3>
        <p className="text-sm text-ink/70 dark:text-gray-300 leading-relaxed">{data.informacion}</p>
        <a
          href={data.download}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-mint text-mint-text rounded-full text-sm font-semibold hover:bg-mint-light transition-colors"
        >
          <IconDownload className="w-4 h-4" />
          Descargar PDF
        </a>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <IconX className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.cover}
            alt={data.title}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

// Tarjeta tipo "archivo adjunto" para los tipos sin vista embebida propia
// (trivia, completa palabras, actividad del catálogo) — ícono + nombre +
// abrir, linkeando a la sección real de la app.
const AttachmentCard = ({ linked }: { linked: LinkedActivity }) => {
  const href = linkedActivityHref(linked);
  if (!href) return null;
  const Icon = LINKED_TYPE_ICONS[linked.type];

  return (
    <Link
      href={href}
      target="_blank"
      className="flex items-center gap-3 p-3 border border-pink-light dark:border-gray-700 rounded-xl hover:bg-cream dark:hover:bg-gray-700 transition-colors"
    >
      <div className="w-11 h-11 rounded-lg bg-mint text-mint-text flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink dark:text-gray-100 truncate">
          {linked.label ?? LINKED_TYPE_LABELS[linked.type]}
        </p>
        <p className="text-xs text-ink/50 dark:text-gray-400">{LINKED_TYPE_LABELS[linked.type]}</p>
      </div>
      <IconExternalLink className="w-4 h-4 text-ink/30 dark:text-gray-500 shrink-0" />
    </Link>
  );
};

/**
 * El recurso al que está ligada una tarea (trivia/buscador/infografía/
 * completa palabras/actividad), como aparecería "adjunto" en la tarea —
 * infografía se ve completa inline, buscador se puede usar ahí mismo (sin
 * redirigir a otra página, para no perder al alumno entre pestañas), el
 * resto como tarjeta de acceso directo. Devuelve null para 'libre' (no hay
 * nada que mostrar). Compartido entre la vista del alumno y la del docente.
 *
 * `classroomId` + `awardPoints` solo aplican al buscador embebido:
 * `classroomId` para respetar las preguntas restringidas de esa clase, y
 * `awardPoints` (default false) para que sumar puntos por buscar/jugar
 * solo pase del lado del alumno, no cuando el docente lo previsualiza.
 * `onComplete` (buscador/biopuzzle/nube) avisa cuando el alumno
 * efectivamente usó el desafío embebido — TareaViewScreen lo exige antes
 * de entregar.
 *
 * Trivia y Completa Palabras también se juegan embebidas, pero SOLO
 * cuando `awardPoints` es true (es decir, del lado del alumno real): son
 * juegos completos con vidas/puntos/progreso ya existentes que no tienen
 * un modo "solo mirar" — dejar que el docente los jugara al previsualizar
 * la tarea le sumaría puntos y gastaría vidas de su propia cuenta, así
 * que ahí se quedan con la tarjeta de acceso directo en pestaña nueva.
 */
export const LinkedActivityAttachment = ({
  linked,
  classroomId,
  awardPoints = false,
  onComplete,
}: {
  linked: LinkedActivity;
  classroomId?: string;
  awardPoints?: boolean;
  onComplete?: () => void;
}) => {
  if (linked.type === 'libre') return null;
  if (linked.type === 'infografia' && linked.id) return <InlineInfografia infografiaId={linked.id} />;
  if (linked.type === 'buscador') {
    return <BuscadorInline classroomId={classroomId} awardPoints={awardPoints} onComplete={onComplete} />;
  }
  if (linked.type === 'biopuzzle') {
    return <BiopuzzleInline systemId={linked.id} awardPoints={awardPoints} onComplete={onComplete} />;
  }
  if (linked.type === 'nube' && linked.id) {
    return <NubeDePalabrasInline code={linked.id} onComplete={onComplete} />;
  }
  if (linked.type === 'trivia' && linked.id && awardPoints) return <TriviaInline triviaId={linked.id} />;
  if (linked.type === 'completapalabras' && linked.id && awardPoints) {
    return <CompletaPalabrasInline lessonId={linked.id} />;
  }
  return <AttachmentCard linked={linked} />;
};
