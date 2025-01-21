"use client"
import { useState, useEffect } from 'react';
import {IconMenu2    , IconX }  from '@tabler/icons-react';


const ComicBurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Array de objetos con el nombre y enlace específico para cada elemento
  const menuItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Trivias', href: '/trivias' },
    { name: 'Pasapalabras', href: '/pasapalabras' },
    { name: 'Simuladorde Grooming', href: '/simulador' },
    { name: 'Completa Palabras', href: '/completapalabras' },
    { name: 'DataMuncher', href: '/datamuncher' }
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
                className="block p-3 text-xl font-bold text-black bg-yellow-300 rounded-lg border-2 border-black 
                transform transition-transform hover:scale-105 hover:-rotate-2
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:bg-yellow-400"
              >
                ¡{item.name}!
              </a>
            ))}
          </nav>

          <div className="absolute bottom-8 left-4 transform -rotate-12">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ¡POW!
            </div>
          </div>
          <div className="absolute bottom-20 right-4 transform rotate-12">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ¡BAM!
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComicBurgerMenu;