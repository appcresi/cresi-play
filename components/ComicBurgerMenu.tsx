"use client"
import { useState, useEffect } from 'react';
import {
  IconMenu2,
  IconX,
  IconUser,
  IconAB2,
  IconCards,
  IconHome,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodPuzzled,
  IconMoodTongueWink2

} from "@tabler/icons-react";

const ComicBurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Updated menuItems to include User Profile
  const menuItems = [
    { name: 'Inicio', href: '/', icon: IconHome    },
    { name: 'Perfil', href: '/user', icon: IconUser },
    { name: 'Trivias', href: '/trivias',icon: IconCards },
    { name: 'Pasapalabras', href: '/pasapalabras', icon: IconAB2},
    { name: 'Simulador Grooming', href: '/simulador', icon: IconShieldCheck },
    { name: 'Completa Palabras', href: '/completapalabras', icon: IconBrandPnpm },
    { name: 'DataMuncher', href: '/datamuncher', icon: IconPacman },
    { name: 'MoodTracker', href: '/moodtracker', icon: IconMoodPuzzled},
    { name: 'Meme Creator', href: '/memegenerador', icon: IconMoodTongueWink2    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <button 
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 bg-yellow-400 p-2 rounded-lg transform transition-transform hover:scale-110 hover:rotate-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {isOpen ? (
          <IconX size={32} className="text-black" />
        ) : (
          <IconMenu2 size={32} className="text-black" />
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white transform transition-transform duration-300 z-40 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          border-r-4 border-black shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]`}
      >
        <div className="p-6 mt-16">
        <nav className="space-y-4">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block p-2 text-sm font-bold text-black bg-yellow-300 rounded-lg border-2 border-black 
                transform transition-transform hover:scale-105 hover:-rotate-2
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:bg-yellow-400 flex items-center gap-2"
              >
                {item.icon && <item.icon size={20} />}
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default ComicBurgerMenu;