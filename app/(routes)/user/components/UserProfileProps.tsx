"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    IconHeart,
    IconTrophy,
    IconHeartPlus,
    IconMoodHappy,
    IconEdit,
    IconTrash
} from "@tabler/icons-react";
import PurchaseModal from '@/components/PurchaseModal';
import Swal from 'sweetalert2';
import StreakTracker from '@/components/StreakTracker';

interface CrESICharacter {
  id: number;
  name: string;
  image: string;
}

interface MoodRecord {
  date: string;
  mood: number;
  label: string;
  intensity: number;
}

interface UserProfileProps {
  initialData?: {
    character?: CrESICharacter;
    username?: string;
    totalGameLives?: number;
    totalGameScore?: number;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ initialData }) => {
  const router = useRouter();
  const [userData, setUserData] = useState({
    character: { id: 0, name: '', image: '' },
    username: '',
    totalGameLives: 0,
    totalGameScore: 0
  });
  const [lastMood, setLastMood] = useState<MoodRecord | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [initialData]);

  const loadUserData = () => {
    const moodHistory = localStorage.getItem('moodHistory');
    if (moodHistory) {
      const moodData = JSON.parse(moodHistory) as MoodRecord[];
      if (moodData.length > 0) {
        setLastMood(moodData[moodData.length - 1]);
      }
    }

    if (initialData) {
      setUserData({
        character: initialData.character || { id: 0, name: '', image: '' },
        username: initialData.username || '',
        totalGameLives: initialData.totalGameLives || 3,
        totalGameScore: initialData.totalGameScore || 0
      });
      return;
    }

    const storedCharacter = localStorage.getItem('cresiCharacter');
    const storedUsername = localStorage.getItem('cresiUsername');
    const storedLives = localStorage.getItem('totalGameLives');
    const storedScore = localStorage.getItem('totalGameScore');

    setUserData({
      character: storedCharacter ? JSON.parse(storedCharacter) : { id: 0, name: '', image: '' },
      username: storedUsername || '',
      totalGameLives: storedLives ? parseInt(storedLives, 10) : 3,
      totalGameScore: storedScore ? parseInt(storedScore, 10) : 0
    });
  };

  const handleDeleteHistory = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción! Se borrará todo tu historial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, bórralo',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      customClass: {
        popup: 'comic-popup'
      }
    });

    if (result.isConfirmed) {
      localStorage.removeItem('moodHistory');
      localStorage.removeItem('totalGameScore');
      localStorage.removeItem('totalGameLives');
      localStorage.removeItem('achievements'); 
      localStorage.removeItem('cresiStreak');
      setLastMood(null);
      setUserData(prev => ({
        ...prev,
        totalGameLives: 3,
        totalGameScore: 0
      }));

      await Swal.fire({
        title: '¡Borrado!',
        text: 'Tu historial ha sido eliminado.',
        icon: 'success',
        customClass: {
          popup: 'comic-popup'
        }
      });
    }
  };

  const handlePurchaseLife = () => {
    const storedLives = localStorage.getItem('totalGameLives');
    const storedScore = localStorage.getItem('totalGameScore');

    setUserData(prevData => ({
      ...prevData,
      totalGameLives: storedLives ? parseInt(storedLives, 10) : prevData.totalGameLives,
      totalGameScore: storedScore ? parseInt(storedScore, 10) : prevData.totalGameScore
    }));
  };

  const handleUpdateMood = () => {
    router.push('/moodtracker');
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-3xl comic-container">
      <StreakTracker />
      <div className="flex flex-col md:flex-row items-center md:space-x-6 mb-8">
        {userData.character.image && (
          <div className="w-24 h-24 md:w-32 md:h-32 relative comic-image-frame">
            <Image
              src={`/${userData.character.image}`}
              alt={userData.character.name}
              layout="fill"
              objectFit="cover"
              className="rounded-xl"
            />
          </div>
        )}
        <div className="text-center md:text-left mt-4 md:mt-0">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800">
            {userData.username || 'Player'}
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            {userData.character.name || 'No Character Selected'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="comic-card bg-yellow-50">
          <IconHeart className="text-red-500" size={32} />
          <div>
            <p className="font-bold text-gray-700">Vidas</p>
            <p className="text-xl md:text-2xl">{userData.totalGameLives}</p>
          </div>
        </div>

        <div className="comic-card bg-blue-50">
          <IconTrophy className="text-yellow-500" size={32} />
          <div>
            <p className="font-bold text-gray-700">Puntos</p>
            <p className="text-xl md:text-2xl">{userData.totalGameScore}</p>
          </div>
        </div>

        <div className="comic-card bg-green-50 relative group">
          <IconMoodHappy className="text-blue-500" size={32} />
          <div>
            <p className="font-bold text-gray-700">¿Cómo te sientes?</p>
            <p className="text-xl md:text-2xl">{lastMood?.label || 'Sin registro'}</p>
          </div>
          <button
            onClick={handleUpdateMood}
            className="absolute right-2 md:right-3 top-2 md:top-3 p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <IconEdit size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button
          onClick={() => setIsPurchaseModalOpen(true)}
          disabled={userData.totalGameLives >= 3 || userData.totalGameScore < 200}
          className={`comic-button bg-gradient-to-r from-green-400 to-green-500 ${
            userData.totalGameLives >= 3 || userData.totalGameScore < 200
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:from-green-500 hover:to-green-600'
          }`}
        >
          <IconHeartPlus size={24} />
          Comprar Vida
        </button>

        <button
          onClick={handleDeleteHistory}
          className="comic-button bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600"
        >
          <IconTrash size={24} />
          Borrar Historial
        </button>
  </div>

  <PurchaseModal
    isOpen={isPurchaseModalOpen}
    onClose={() => setIsPurchaseModalOpen(false)}
    onPurchase={handlePurchaseLife}
  />

  <style jsx>{`
    .comic-container {
      background-color: white;
      box-shadow: 0 0 0 4px #000, 10px 10px 0 0 #000;
      position: relative;
      overflow: hidden;
    }

    .comic-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 20px 20px, #000 2px, transparent 2px)
        -10px -10px / 40px 40px repeat;
      opacity: 0.03;
      pointer-events: none;
    }

    .comic-image-frame {
      border: 4px solid #000;
      box-shadow: 5px 5px 0 #000;
      border-radius: 16px;
      overflow: hidden;
    }

    .comic-card {
      padding: 1rem;
      border: 3px solid #000;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 5px 5px 0 #000;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .comic-card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0 #000;
    }

    .comic-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 3px solid #000;
      border-radius: 12px;
      color: white;
      font-weight: bold;
      box-shadow: 4px 4px 0 #000;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .comic-button:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 #000;
    }

    .comic-button:active:not(:disabled) {
      transform: translate(0, 0);
      box-shadow: 0 0 0 #000;
    }
  `}</style>
</div>

  );
};

export default UserProfile;