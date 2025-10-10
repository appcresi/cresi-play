"use client";
import { useState, useEffect } from "react";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconArrowBack,
  IconTrophyFilled, 
  IconTrophyOff, 
  IconBook,
  IconBooks,
  IconSearch 
} from "@tabler/icons-react";
import GameStatusBar from '@/components/GameStatusBar';
import { stories } from '../data/stories';
import { splitIntoPages } from '../utils/textUtils';
import type { Story, ReadingProgress } from '../types/types';

// Interfaces
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
    storyProgress: { [key: string]: { lastPage: number; percentage: number; pagesRead: string[] } };
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

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'story_reader';
const POINTS_PER_PAGE = 5;

// StoryCard Component
interface StoryCardProps {
  story: Story;
  readingProgress?: ReadingProgress;
  onSelect: () => void;
}

function StoryCard({ story, readingProgress, onSelect }: StoryCardProps) {
  const TrophyIcon = readingProgress?.percentage === 100 ? IconTrophyFilled : IconTrophyOff;

  return (
    <div
      onClick={onSelect}
      className="relative bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
    >
      <div className="h-24 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
          <IconBooks size={24} className="text-blue-600" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-medium text-gray-900 mb-1 line-clamp-2">
          {story.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {story.author}
        </p>
        
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {story.description}
        </p>

        {readingProgress && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <TrophyIcon size={18} className={readingProgress.percentage === 100 ? "text-yellow-500" : "text-gray-400"} />
              <span className="font-medium">
                {readingProgress.percentage}% completado
              </span>
            </div>
            
            {readingProgress.lastPage > 0 && readingProgress.percentage < 100 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <IconBook size={16} />
                <span>Página {readingProgress.lastPage + 1}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          {readingProgress?.lastPage ? 'Continuar leyendo' : 'Abrir'}
        </button>
      </div>
    </div>
  );
}

// StorySearch Component
interface StorySearchProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

function StorySearch({ onSearch, initialValue = "" }: StorySearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onSearch(newValue);
  };

  return (
    <div className="mb-6 max-w-2xl mx-auto">
      <div className="relative">
        <IconSearch 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar historias..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-12 pr-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-blue-500 rounded-lg transition-colors duration-200 outline-none text-base"
        />
      </div>
    </div>
  );
}

// StoryReader Component
interface StoryReaderProps {
  selectedTitle: string;
  onBack: () => void;
  userData: UserData | null;
  onPageRead: (storyTitle: string, pageIndex: number, totalPages: number) => void;
}

function StoryReader({ selectedTitle, onBack, userData, onPageRead }: StoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [storyPages, setStoryPages] = useState<string[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    const story = stories.find(s => s.title === selectedTitle);
    if (story && userData) {
      const pages = splitIntoPages(story.content[0]);
      const savedProgress = userData.progress.storyProgress?.[story.title];
      const lastPage = savedProgress?.lastPage || 0;
      
      setCurrentStory(story);
      setStoryPages(pages);
      setCurrentPage(lastPage);
    }
  }, [selectedTitle, userData]);

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-600">Cargando historia...</p>
      </div>
    );
  }

  const handlePageChange = (direction: 'next' | 'prev') => {
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    
    if (newPage >= 0 && newPage < storyPages.length) {
      setCurrentPage(newPage);
      
      // Si avanzamos a una nueva página, dar puntos
      if (direction === 'next') {
        onPageRead(currentStory.title, newPage, storyPages.length);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md transition-colors"
          >
            <IconArrowBack size={20} />
            <span className="font-medium">Volver</span>
          </button>
        </div>
        
        <div className="p-6 -mt-8">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h1 className="text-3xl font-medium text-gray-900 mb-2">
              {currentStory.title.replace(/\*\*/g, '')}
            </h1>
            <p className="text-sm text-gray-600">por {currentStory.author}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-4">
        <p className="text-lg leading-relaxed text-gray-800">
          {storyPages[currentPage]}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <IconChevronLeft size={20} />
            Anterior
          </button>
          
          <span className="text-sm font-medium text-gray-600">
            Página {currentPage + 1} de {storyPages.length}
          </span>
          
          <button
            onClick={() => handlePageChange('next')}
            disabled={currentPage === storyPages.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === storyPages.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Siguiente
            <IconChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Story Component
export default function Story(): JSX.Element {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        setScore(data.game.totalScore);
        setLives(data.game.totalLives);
        
        // Actualizar última visita
        data.progress.lastVisits[ACTIVITY_ID] = new Date().toISOString();
        
        // Inicializar storyProgress si no existe
        if (!data.progress.storyProgress) {
          data.progress.storyProgress = {};
        }
        
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = (updatedData: UserData) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
      setScore(updatedData.game.totalScore);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handlePageRead = (storyTitle: string, pageIndex: number, totalPages: number) => {
    if (!userData) return;

    const storyKey = `story_${storyTitle}`;
    const currentProgress = userData.progress.storyProgress?.[storyTitle] || {
      lastPage: 0,
      percentage: 0,
      pagesRead: []
    };

    // Verificar si esta página ya fue leída antes
    const pageId = `${storyTitle}_page_${pageIndex}`;
    const isNewPage = !currentProgress.pagesRead.includes(pageId);

    // Actualizar páginas leídas
    const updatedPagesRead = isNewPage 
      ? [...currentProgress.pagesRead, pageId]
      : currentProgress.pagesRead;

    // Calcular porcentaje
    const percentage = Math.round(((pageIndex + 1) / totalPages) * 100);

    // Calcular puntos solo si es una página nueva
    const pointsEarned = isNewPage ? POINTS_PER_PAGE : 0;

    const updatedData: UserData = {
      ...userData,
      game: {
        ...userData.game,
        totalScore: userData.game.totalScore + pointsEarned
      },
      progress: {
        ...userData.progress,
        storyProgress: {
          ...userData.progress.storyProgress,
          [storyTitle]: {
            lastPage: pageIndex,
            percentage,
            pagesRead: updatedPagesRead
          }
        },
        activityScores: {
          ...userData.progress.activityScores,
          [storyKey]: (userData.progress.activityScores[storyKey] || 0) + pointsEarned
        },
        activityTimes: {
          ...userData.progress.activityTimes,
          [ACTIVITY_ID]: new Date().toISOString()
        }
      }
    };

    saveUserData(updatedData);
  };

  const handleBack = () => {
    setSelectedFeature(null);
    loadUserData(); // Recargar datos al volver
  };

  const getReadingProgress = (): Record<string, ReadingProgress> => {
    if (!userData?.progress.storyProgress) return {};
    
    const progress: Record<string, ReadingProgress> = {};
    Object.entries(userData.progress.storyProgress).forEach(([title, data]) => {
      progress[title] = {
        percentage: data.percentage,
        lastPage: data.lastPage
      };
    });
    return progress;
  };

  const readingProgress = getReadingProgress();

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.content.some(content => content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section className="min-h-screen bg-gray-50">
      <GameStatusBar
        title="Historias"
        score={score}
        lives={lives}
        level={selectedFeature ? readingProgress[selectedFeature]?.lastPage + 1 || 1 : 1}
      />

      <div className="py-8 px-4 pt-24">
        {!selectedFeature ? (
          <div className="max-w-7xl mx-auto">
            <StorySearch 
              onSearch={setSearchTerm}
              initialValue={searchTerm}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.title}
                  story={story}
                  readingProgress={readingProgress[story.title]}
                  onSelect={() => setSelectedFeature(story.title)}
                />
              ))}
            </div>
            {filteredStories.length === 0 && (
              <p className="text-center text-base text-gray-600 mt-8">
                No se encontraron historias que coincidan con tu búsqueda.
              </p>
            )}
          </div>
        ) : (
          <StoryReader
            selectedTitle={selectedFeature}
            onBack={handleBack}
            userData={userData}
            onPageRead={handlePageRead}
          />
        )}
      </div>
    </section>
  );
}