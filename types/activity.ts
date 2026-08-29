// types/activity.ts
//
// El ícono se guarda como nombre (string, de @tabler/icons-react) y no como
// JSX ya resuelto, para que este archivo lo puedan importar módulos que no
// necesitan renderizar nada (AuthModal, TeacherDashboard, userDataManager).
// Donde sí hace falta pintar el ícono, se resuelve el nombre a componente
// con el mapa único en components/ActivityIcon.tsx.
// Ciclos oficiales de ESI (Ley 26.150 / lineamientos curriculares del
// Ministerio de Educación) — se usa esta nomenclatura en vez de una propia
// para que un docente reconozca de inmediato a qué grupo corresponde cada
// sección, en vez de tener que traducir una convención inventada.
export type AgeCycle = 'primario-1' | 'primario-2' | 'secundario';

export const AGE_CYCLE_LABELS: Record<AgeCycle, string> = {
  'primario-1': 'Primer Ciclo Primario (6-8)',
  'primario-2': 'Segundo Ciclo Primario (9-12)',
  secundario: 'Secundario (13-18)',
};

// Versión corta para chips/badges donde no entra la etiqueta completa.
export const AGE_CYCLE_SHORT_LABELS: Record<AgeCycle, string> = {
  'primario-1': '6-8 años',
  'primario-2': '9-12 años',
  secundario: '13-18 años',
};

const AGE_CYCLE_ORDER: AgeCycle[] = ['primario-1', 'primario-2', 'secundario'];
const AGE_CYCLE_RANGE: Record<AgeCycle, [number, number]> = {
  'primario-1': [6, 8],
  'primario-2': [9, 12],
  secundario: [13, 18],
};

/** Un solo ciclo devuelve su etiqueta tal cual ("Secundario (13-18)"); más
 *  de uno se combina en un rango continuo ("Primaria y Secundario (9-18)")
 *  en vez de listar cada ciclo por separado. */
export function formatAgeCycles(cycles: AgeCycle[]): string {
  if (cycles.length === 0) return '';
  if (cycles.length === 1) return AGE_CYCLE_LABELS[cycles[0]];

  const sorted = AGE_CYCLE_ORDER.filter((cycle) => cycles.includes(cycle));
  const levelNames = Array.from(new Set(sorted.map((cycle) => (cycle === 'secundario' ? 'Secundario' : 'Primaria'))));
  const min = Math.min(...sorted.map((cycle) => AGE_CYCLE_RANGE[cycle][0]));
  const max = Math.max(...sorted.map((cycle) => AGE_CYCLE_RANGE[cycle][1]));

  return `${levelNames.join(' y ')} (${min}-${max})`;
}

export interface ActivityDefinition {
  id: string;
  title: string;
  description: string;
  route: string;
  color: string;
  image: string;
  category: string;
  iconName: string;
  iconSize?: number;
  priority?: boolean;
  /** A qué ciclo(s) está pensada la sección. Por ahora casi todo el
   *  catálogo es 'secundario' — se va a ir sumando contenido pensado
   *  específicamente para primaria más adelante. Ver AGE_CYCLE_LABELS. */
  ageCycles: AgeCycle[];
}