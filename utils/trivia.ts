import { GameSettings } from '@/app/(routes)/trivias/types/settings'
import { TriviaStatus } from '@/types/trivia'

const STORAGE_KEY = 'cresi_user_data'

interface MoodEntry {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  date?: string;
}

interface UserData {
  profile: {
    character: {
      id: number;
      name: string;
      image: string;
    };
    username: string;
    createdAt: string;
    lastLogin: string;
  };
  game: {
    totalScore: number;
    totalLives: number;
    streak: number;
  };
  progress: {
    completedActivities: string[];
    activityScores: { [key: string]: number };
    activityTimes: { [key: string]: string };
    lastVisits: { [key: string]: string };
  };
  mood: {
    history: MoodEntry[];
    lastEntry: MoodEntry | null;
  };
  achievements: Achievement[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
  trivias?: {
    [triviaId: string]: TriviaStatus;
  };
  gameSettings?: GameSettings;
}

// Get UserData from localStorage
function getUserData(): UserData | null {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData) as UserData;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
  }
  return null;
}

// Save UserData to localStorage
function saveUserData(userData: UserData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Each trivia has a status (completed, percentage, etc.), which is saved in userData

export function getTriviaStatus(id: string): TriviaStatus | undefined {
  const userData = getUserData();
  
  if (userData && userData.trivias && userData.trivias[id]) {
    return userData.trivias[id];
  }
  
  return undefined;
}

export function saveTriviaStatus(data: TriviaStatus): void {
  const userData = getUserData();
  
  if (userData) {
    // Inicializar trivias si no existe
    if (!userData.trivias) {
      userData.trivias = {};
    }
    
    // Guardar el estado de la trivia
    userData.trivias[data.id] = data;
    
    saveUserData(userData);
  }
}

// Settings for trivia gameplay are saved in userData

export function getSettings(): GameSettings | undefined {
  if (typeof window !== 'undefined') {
    const userData = getUserData();
    
    if (userData && userData.gameSettings) {
      return userData.gameSettings;
    }
  }
  
  return undefined;
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window !== 'undefined') {
    const userData = getUserData();
    
    if (userData) {
      userData.gameSettings = settings;
      saveUserData(userData);
    }
  }
}

export function generateTriviaPathFromName(name: string, level: number): string {
  const escapedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().split(' ').join('-')
  return escapedName.concat('-', level.toString())
}