import React, { useState, useEffect } from 'react';
import { IconChevronLeft, IconChevronRight, IconArrowBack } from "@tabler/icons-react";
import { stories } from '../data/stories';
import { splitIntoPages } from '../utils/textUtils';
import type { Story, ReadingProgress } from '../types/types';

interface StoryReaderProps {
  selectedTitle: string;
  onBack: (progress: ReadingProgress) => void;
}

const StoryReader: React.FC<StoryReaderProps> = ({ selectedTitle, onBack }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [storyPages, setStoryPages] = useState<string[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [nextContent, setNextContent] = useState<string>('');

  useEffect(() => {
    const story = stories.find(s => s.title === selectedTitle);
    if (story) {
      const pages = splitIntoPages(story.content[0]);
      const savedProgress = localStorage.getItem(`${story.title}_progress`);
      const lastPage = savedProgress ? parseInt(savedProgress) : 0;
      
      setCurrentStory(story);
      setStoryPages(pages);
      setCurrentPage(lastPage);
      setCurrentContent(pages[lastPage]);
      setNextContent(pages[lastPage + 1] || '');
    }
  }, [selectedTitle]);

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-xl">Selecciona una historia para comenzar...</p>
      </div>
    );
  }

  const handlePageChange = (newDirection: 'next' | 'prev') => {
    if (isAnimating) return;

    const newPage = newDirection === 'next' ? currentPage + 1 : currentPage - 1;
    
    if (newPage >= 0 && newPage < storyPages.length) {
      setDirection(newDirection);
      setIsAnimating(true);
      
      setCurrentContent(storyPages[currentPage]);
      setNextContent(storyPages[newPage]);

      setTimeout(() => {
        setCurrentPage(newPage);
        setIsAnimating(false);
        setCurrentContent(storyPages[newPage]);
        setNextContent(storyPages[newPage + 1] || '');
        
        localStorage.setItem(`${currentStory.title}_progress`, newPage.toString());
      }, 500);
    }
  };

  const handleBack = () => {
    const progress: ReadingProgress = {
      percentage: Math.round((currentPage + 1) / storyPages.length * 100),
      lastPage: currentPage
    };
    onBack(progress);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-xl">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-comic px-4 py-2 rounded-lg border-4 border-black transform hover:-translate-y-1 transition-transform"
        style={{
          boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        }}
      >
        <IconArrowBack size={24} />
        Volver a los cuentos
      </button>

      <div className="border-b-4 border-black mb-4">
        <h1 className="text-4xl font-bold text-center py-4 font-comic">
          {currentStory.title.replace(/\*\*/g, '')}
        </h1>
        <p className="text-right italic mb-2">por {currentStory.author}</p>
      </div>

      <div className="relative bg-gray-100 p-6 rounded-lg mb-4 border-2 border-black overflow-hidden">
        <div className={`
          transition-transform duration-500 ease-in-out
          ${isAnimating && direction === 'next' ? '-translate-x-full' : ''}
          ${isAnimating && direction === 'prev' ? 'translate-x-full' : ''}
        `}>
          

          <div className="relative bg-white p-6 rounded-lg border-2 border-black">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-black rotate-45" />
            <p className="text-xl leading-relaxed font-comic">
              {currentContent}
            </p>
          </div>
        </div>

        <div className={`
          absolute top-0 left-0 w-full h-full p-6
          transition-transform duration-500 ease-in-out
          ${!isAnimating ? 'translate-x-full' : 'translate-x-0'}
          ${direction === 'prev' ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <div className="relative bg-white p-6 rounded-lg border-2 border-black">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-black rotate-45" />
            <p className="text-xl leading-relaxed font-comic">
              {nextContent}
            </p>
          </div>
        </div>

        <div className={`
          absolute inset-0 pointer-events-none
          transition-opacity duration-500
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `}
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 20%)'
          }}
        />
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 0 || isAnimating}
          className={`flex items-center px-4 py-2 rounded-lg border-4 border-black ${
            currentPage === 0 || isAnimating
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:-translate-y-1 transition-transform'
          }`}
          style={currentPage !== 0 && !isAnimating ? {
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          } : {}}
        >
          <IconChevronLeft className="mr-2" />
          Anterior
        </button>
        <span className="text-lg font-comic">
          Página {currentPage + 1} de {storyPages.length}
        </span>
        <button
          onClick={() => handlePageChange('next')}
          disabled={currentPage === storyPages.length - 1 || isAnimating}
          className={`flex items-center px-4 py-2 rounded-lg border-4 border-black ${
            currentPage === storyPages.length - 1 || isAnimating
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:-translate-y-1 transition-transform'
          }`}
          style={currentPage !== storyPages.length - 1 && !isAnimating ? {
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          } : {}}
        >
          Siguiente
          <IconChevronRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default StoryReader;