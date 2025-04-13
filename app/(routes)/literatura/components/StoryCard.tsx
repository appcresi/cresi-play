import { IconTrophyFilled, IconTrophyOff, IconBook,   IconBooks } from "@tabler/icons-react";
import type { ReadingProgress, Story } from '../types/types';

interface StoryCardProps {
  story: Story;
  readingProgress?: ReadingProgress;
  onSelect: () => void;
}

function StoryCard({ story, readingProgress, onSelect }: StoryCardProps) {
  const TrophyIcon = readingProgress?.percentage === 100 ? IconTrophyFilled : IconTrophyOff;

  return (
    <div
      className="relative bg-white border-4 border-black rounded-lg transform hover:scale-105 transition-transform"
      style={{
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
      }}
    >
      <div className="absolute -top-3 -left-3 bg-yellow-400 border-4 border-black rounded-full p-2 transform rotate-12">
        <IconBooks size={32} />
      </div>
      
      <div className="p-6 mt-8">
        <h3 className="text-3xl font-bold mb-2 font-comic">
          {story.title}
        </h3>
        
        <p className="text-sm italic mb-4 font-comic text-gray-600">
          Por: {story.author}
        </p>
        
        <p className="text-lg mb-4 font-comic">
          {story.description}
        </p>

        {readingProgress && (
          <div className="space-y-2">
            <div className="flex items-center mb-4 bg-yellow-100 p-2 rounded-lg border-2 border-black">
              <TrophyIcon size={24} className="text-yellow-500" />
              <span className="ml-2 font-comic font-bold">
                {readingProgress.percentage}% completado
              </span>
            </div>
            
            {readingProgress.lastPage > 0 && readingProgress.percentage < 100 && (
              <div className="flex items-center text-sm text-gray-600 font-comic">
                <IconBook size={16} className="mr-1" />
                Continuar desde la página {readingProgress.lastPage + 1}
              </div>
            )}
          </div>
        )}

        <button               
          onClick={onSelect}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-comic text-lg py-2 px-6 rounded-lg border-4 border-black transform hover:-translate-y-1 transition-transform"
          style={{
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
          }}
        >
          {readingProgress?.lastPage ? 'Continuar leyendo' : '¡Descubrir!'}
        </button>
      </div>
    </div>
  );
}

export default StoryCard;