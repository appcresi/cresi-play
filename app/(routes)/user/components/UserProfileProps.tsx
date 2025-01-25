"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    IconHeart,
    IconTrophy,
    IconHeartPlus
} from "@tabler/icons-react";
import PurchaseModal from '@/components/PurchaseModal';

// Interfaces remain the same as in the original component
interface CrESICharacter {
  id: number;
  name: string;
  image: string;
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
  const [userData, setUserData] = useState({
    character: { id: 0, name: '', image: '' },
    username: '',
    totalGameLives: 0,
    totalGameScore: 0
  });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
    // Previous useEffect logic remains the same
    if (initialData) {
      setUserData({
        character: initialData.character || { id: 0, name: '', image: '' },
        username: initialData.username || '',
        totalGameLives: initialData.totalGameLives || 0,
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
      totalGameLives: storedLives ? parseInt(storedLives, 10) : 0,
      totalGameScore: storedScore ? parseInt(storedScore, 10) : 0
    });
  }, [initialData]);

  const handlePurchaseLife = () => {
    // Refresh user data after purchase
    const storedLives = localStorage.getItem('totalGameLives');
    const storedScore = localStorage.getItem('totalGameScore');

    setUserData(prevData => ({
      ...prevData,
      totalGameLives: storedLives ? parseInt(storedLives, 10) : prevData.totalGameLives,
      totalGameScore: storedScore ? parseInt(storedScore, 10) : prevData.totalGameScore
    }));
  };

  return (
    <div className="bg-[#F0F0F0] p-6 rounded-xl shadow-lg border-4 border-blue-600 comic-border relative">
      <div className="flex items-center space-x-4 mb-4">
        {userData.character.image && (
          <div className="w-24 h-24 relative comic-frame">
            <Image 
              src={`/${userData.character.image}`} 
              alt={userData.character.name} 
              layout="fill" 
              objectFit="cover" 
              className="rounded-lg"
            />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold comic-text">
            {userData.username || 'Player'}
          </h2>
          <p className="text-md text-gray-600">
            {userData.character.name || 'No Character Selected'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 comic-panel">
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
          <IconHeart className="mr-2 text-red-500" />
          <div>
            <p className="font-bold">Lives</p>
            <p className="text-xl">{userData.totalGameLives}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
          <IconTrophy className="mr-2 text-yellow-500" />
          <div>
            <p className="font-bold">Score</p>
            <p className="text-xl">{userData.totalGameScore}</p>
          </div>
        </div>
      </div>

      {/* Purchase Life Button */}
      <div className="absolute top-2 right-2">
        <button 
          onClick={() => setIsPurchaseModalOpen(true)}
          disabled={userData.totalGameLives >= 3 || userData.totalGameScore < 200}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg 
            ${userData.totalGameLives >= 3 || userData.totalGameScore < 200 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'}
          `}
        >
          <IconHeartPlus size={20} />
          Comprar Vida
        </button>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchase={handlePurchaseLife}
      />
      
      <style jsx>{`
        .comic-border {
          border-style: solid;
          border-width: 4px;
          border-image: 
            repeating-linear-gradient(
              45deg,
              #000, #000 10px,
              transparent 10px, transparent 20px
            ) 1;
        }
        
        .comic-text {
          font-family: 'Comic Sans MS', cursive;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .comic-frame {
          border: 3px solid black;
          box-shadow: 5px 5px 0 rgba(0,0,0,0.5);
        }
        
        .comic-panel {
          background: repeating-linear-gradient(
            45deg,
            #f0f0f0,
            #f0f0f0 10px,
            #e0e0e0 10px,
            #e0e0e0 20px
          );
        }
      `}</style>
    </div>
  );
};

export default UserProfile;