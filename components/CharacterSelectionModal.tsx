'use client';

import React, { useState, useEffect } from 'react';

interface Character {
  id: number;
  name: string;
  image: string;
}

const characters: Character[] = [
  {
    id: 1,
    name: "Aventurero",
    image: "personaje1.webp"
  },
  {
    id: 2,
    name: "Exploradora",
    image: "personaje2.webp"
  },
  {
    id: 3,
    name: "Valiente",
    image: "personaje3.webp"
  }
];

const CharacterSelectionModal = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [showSelectionForm, setShowSelectionForm] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const savedUsername = localStorage.getItem('cresiUsername');
    const savedCharacter = localStorage.getItem('cresiCharacter');
    
    if (savedUsername && savedCharacter) {
      setUsername(savedUsername);
      setSelectedCharacter(JSON.parse(savedCharacter));
      setIsReturningUser(true);
    } else {
      setShowSelectionForm(true);
    }
  }, []);

  const handleSubmit = () => {
    if (!username.trim()) {
      setError('¡Ups! Necesitas un nombre para tu aventura');
      return;
    }
    if (!selectedCharacter) {
      setError('¡Hey! Elige tu personaje favorito');
      return;
    }

    localStorage.setItem('cresiUsername', username);
    localStorage.setItem('cresiCharacter', JSON.stringify(selectedCharacter));
    setIsOpen(false);
  };

  const handleReset = () => {
    setShowSelectionForm(true);
    setIsReturningUser(false);
  };

  const handleStartGame = () => {
    setIsOpen(false);
  };

  if (!mounted) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-yellow-50 p-6 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4 transform rotate-1">
        <h2 className="text-3xl font-bold mb-6 text-center transform -rotate-1 text-blue-600 uppercase"
            style={{ 
              textShadow: '2px 2px 0px #000000'
            }}>
          ¡Bienvenido a CrESI!
        </h2>

        {isReturningUser && !showSelectionForm ? (
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-4">
                ¡Qué bueno que volviste, {username}!
              </h3>
              <div className="w-48 mx-auto mb-4">
                <img
                  src={selectedCharacter?.image}
                  alt={selectedCharacter?.name}
                  className="w-full rounded-lg border-4 border-black"
                  loading="lazy"
                  width={100}
                  height={100}
                />
                <p className="text-lg font-bold mt-2">
                  {selectedCharacter?.name}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleStartGame}
                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 
                         transition-all transform hover:scale-105 hover:rotate-1
                         border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                ¡COMENZAR AVENTURA!
              </button>
              
              <button
                onClick={handleReset}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 
                         transition-all transform hover:scale-105 hover:rotate-1
                         border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                CAMBIAR PERSONAJE
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 transform -rotate-1">
              <label className="block text-lg font-bold mb-2 text-red-500">
                ¡Tu Nombre de Héroe!
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transform rotate-1"
                placeholder="Escribe aquí..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-bold mb-3 text-purple-600">
                ¡Elige tu Personaje!
              </label>
              <div className="grid grid-cols-3 gap-4">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => setSelectedCharacter(character)}
                    className={`cursor-pointer p-3 rounded-lg transition-all transform hover:scale-105 hover:-rotate-2
                      ${selectedCharacter?.id === character.id
                        ? 'ring-4 ring-blue-500 bg-white rotate-3'
                        : 'bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      } border-2 border-black`}
                  >
                    <img
                      src={character.image}
                      alt={character.name}
                      loading="lazy"
                      className="w-full rounded-lg mb-2 border-2 border-black"
                      width={100}
                      height={100}
                    />
                    <p className="text-center text-sm font-bold">
                      {character.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 font-bold text-center transform -rotate-1">
                ¡{error}!
              </p>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 
                       transition-all transform hover:scale-105 hover:rotate-1
                       border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              ¡COMENZAR AVENTURA!
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterSelectionModal;