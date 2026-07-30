// types/user.ts
//
// Única fuente de verdad para los tipos relacionados al usuario/perfil.
// Antes estaban redefinidos (con variaciones sutiles) en AuthModal.tsx,
// userDataManager.ts, userDataSync.ts, EducationalProgressPanel.tsx,
// Features.tsx y Header.tsx. Cualquier cambio de forma va acá, una sola vez,
// y todo lo demás importa desde este archivo.

export type UserRole = 'student' | 'teacher';

export interface Character {
  id: number;
  name: string;
  image: string;
}

export interface MoodRecord {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

/** Una nota que el alumno escribe mientras lee una lección (sección "Mis notas"). */
export interface LessonNote {
  id: string;
  text: string;
  lessonTitle: string;
  level: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  date?: string;
  /** Nombre de ícono (de @tabler/icons-react) a resolver donde se necesite. */
  iconName?: string;
}

export interface DashboardConfig {
  visibleActivities: string[];
  activityOrder: string[];
}

export interface UserProfile {
  character: Character;
  username: string;
  createdAt: string;
  lastLogin: string;
  /** Ausente = alumno "clásico" de antes de que existieran los roles. */
  role?: UserRole;
  /** Clase a la que pertenece el alumno, si entró con código. */
  classroomId?: string | null;
  className?: string | null;
}

export interface UserProgress {
  completedActivities: string[];
  activityScores: { [activityTitle: string]: number };
  activityTimes: { [activityTitle: string]: string };
  lastVisits: { [activityTitle: string]: string };
  /** Progreso detallado por lección (usado por la actividad "Lecciones"). */
  lessonProgress?: { [lessonTitle: string]: { percentage: number; completed: boolean } };
  /** Progreso de lectura por cuento (usado por la actividad "Literatura"). */
  storyProgress?: { [storyTitle: string]: { lastPage: number; percentage: number; pagesRead: string[] } };
  /** Progreso del test vocacional (respuestas, resultados por área, y el sub-test por profesión). */
  vocationalTest?: {
    answers: Record<number, boolean>;
    results?: Record<string, { name: string; questions: number[]; total: number }>;
    professionAnswers?: Record<string, boolean[]>;
  };
}

export interface UserGame {
  totalScore: number;
  totalLives: number;
  streak: number;
}

export interface UserSettings {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
}

export interface UserMood {
  history: MoodRecord[];
  lastEntry: MoodRecord | null;
}

export interface UserData {
  profile: UserProfile;
  game: UserGame;
  progress: UserProgress;
  mood: UserMood;
  achievements: Achievement[];
  settings: UserSettings;
  dashboard: DashboardConfig;
  /** Notas que el alumno escribe mientras lee las lecciones. */
  notes: LessonNote[];
}