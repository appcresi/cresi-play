"use client"
import { IconHeartPlus } from '@tabler/icons-react';
import Swal from 'sweetalert2';

// UserData interfaces (matching MoodTracker and UnifiedWordGame)
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
}

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

// UserDataManager class
class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';

  public static getDefaultUserData(): UserData {
    return {
      profile: {
        character: { id: 0, name: '', image: '' },
        username: 'Estudiante',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      game: {
        totalScore: 0,
        totalLives: 3,
        streak: 0
      },
      progress: {
        completedActivities: [],
        activityScores: {},
        activityTimes: {},
        lastVisits: {}
      },
      mood: {
        history: [],
        lastEntry: null
      },
      achievements: [],
      settings: {
        notifications: true,
        theme: 'light',
        language: 'es'
      }
    };
  }

  static loadUserData(): UserData {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as UserData;
        parsedData.profile.lastLogin = new Date().toISOString();
        this.saveUserData(parsedData);
        return parsedData;
      }
      return this.getDefaultUserData();
    } catch (error) {
      console.error('Error loading user data:', error);
      return this.getDefaultUserData();
    }
  }

  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
}

const LIFE_PURCHASE_COST = 200;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: () => void;
  itemName?: string;
  description?: string;
}

const PurchaseModal = ({
  isOpen,
  onClose,
  onPurchase,
  itemName = "vida extra",
  description = "¿Comprar una vida extra?"
}: PurchaseModalProps) => {
  if (!isOpen) return null;

  const userData = UserDataManager.loadUserData();
  const currentScore = userData.game.totalScore;
  const currentLives = userData.game.totalLives;
  const canAfford = currentScore >= 200 && currentLives < 3;

  const handlePurchase = () => {
    if (canAfford) {
      const updatedUserData = { ...userData };
      updatedUserData.game.totalScore = currentScore - 200;
      updatedUserData.game.totalLives = Math.min(currentLives + 1, 3);
      
      UserDataManager.saveUserData(updatedUserData);
      onPurchase();
      onClose();
      
      Swal.fire({
        icon: "success",
        title: "¡Vida Extra Comprada!",
        text: "¡Continúa jugando!",
        showConfirmButton: false,
        timer: 1000
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{description}</h2>
        <div className="flex justify-between mb-4">
          <p>Costo: {LIFE_PURCHASE_COST} puntos</p>
          <p>Tus puntos: {currentScore}</p>
        </div>
        {currentLives >= 3 ? (
          <div>
            <p className="text-red-500 mb-4">
              Ya tienes el máximo de vidas
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        ) : canAfford ? (
          <div className="flex gap-4">
            <button
              onClick={handlePurchase}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <IconHeartPlus size={20} />
              Comprar
            </button>
            <button
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div>
            <p className="text-red-500 mb-4">
              No tienes suficientes puntos para comprar {itemName}
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;