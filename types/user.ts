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
}