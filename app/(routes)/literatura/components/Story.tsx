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
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('literatura');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Literatura';
const ACCENT = ACTIVITY?.color ?? '#F57C00';
const POINTS_PER_PAGE = 5;

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
      className="relative bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
    >
      <div className="h-24 relative" style={{ background: `linear-gradient(to bottom right, ${ACCENT}, ${ACCENT}CC)` }}>
        <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
          <IconBooks size={24} style={{ color: ACCENT }} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {story.title}
        </h3>

        <p className="text-sm text-gray-500 mb-3">
          {story.author}
        </p>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {story.description}
        </p>

        {readingProgress && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <TrophyIcon size={18} className={readingProgress.percentage === 100 ? "text-yellow-500" : "text-gray-300"} />
              <span className="font-medium">
                {readingProgress.percentage}% completado
              </span>
            </div>

            {readingProgress.lastPage > 0 && readingProgress.percentage < 100 && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <IconBook size={16} />
                <span>Página {readingProgress.lastPage + 1}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
        <button className="text-sm font-semibold" style={{ color: ACCENT }}>
          {readingProgress?.lastPage ? 'Continuar leyendo' : 'Abrir'}
        </button>
      </div>
    </div>
  );
}

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
          className="w-full pl-12 pr-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent rounded-xl transition-colors duration-200 outline-none text-base focus:ring-2"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

interface StoryReaderProps {
  selectedTitle: string;
  onBack: () => void;
  storyProgress: Record<string, { lastPage: number; percentage: number; pagesRead: string[] }>;
  onPageRead: (storyTitle: string, pageIndex: number, totalPages: number) => void;
}

function StoryReader({ selectedTitle, onBack, storyProgress, onPageRead }: StoryReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [storyPages, setStoryPages] = useState<string[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    const story = stories.find(s => s.title === selectedTitle);
    if (story) {
      const pages = splitIntoPages(story.content[0]);
      const savedProgress = storyProgress[story.title];
      const lastPage = savedProgress?.lastPage || 0;

      setCurrentStory(story);
      setStoryPages(pages);
      setCurrentPage(lastPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTitle]);

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">Cargando historia...</p>
      </div>
    );
  }

  const handlePageChange = (direction: 'next' | 'prev') => {
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

    if (newPage >= 0 && newPage < storyPages.length) {
      setCurrentPage(newPage);

      if (direction === 'next') {
        onPageRead(currentStory.title, newPage, storyPages.length);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="h-28 rounded-t-xl relative" style={{ background: `linear-gradient(to bottom right, ${ACCENT}, ${ACCENT}CC)` }}>
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-full shadow-md transition-colors"
          >
            <IconArrowBack size={20} />
            <span className="font-medium">Volver</span>
          </button>
        </div>

        <div className="p-6 -mt-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentStory.title.replace(/\*\*/g, '')}
            </h1>
            <p className="text-sm text-gray-500">por {currentStory.author}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-4">
        <p className="text-lg leading-relaxed text-gray-700">
          {storyPages[currentPage]}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-white hover:opacity-90'
            }`}
            style={currentPage === 0 ? undefined : { backgroundColor: ACCENT }}
          >
            <IconChevronLeft size={20} />
            Anterior
          </button>

          <span className="text-sm font-medium text-gray-500">
            Página {currentPage + 1} de {storyPages.length}
          </span>

          <button
            onClick={() => handlePageChange('next')}
            disabled={currentPage === storyPages.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
              currentPage === storyPages.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-white hover:opacity-90'
            }`}
            style={currentPage === storyPages.length - 1 ? undefined : { backgroundColor: ACCENT }}
          >
            Siguiente
            <IconChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Story(): JSX.Element {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_TITLE);
  };

  const saveUserData = (updatedData: typeof userData) => {
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
    setScore(updatedData.game.totalScore);
  };

  /**
   * Antes esto nunca tocaba `completedActivities` — "Literatura" nunca
   * aparecía como completada en el resto de la app. Ahora se marca apenas
   * un cuento llega al 100% (no hace falta terminar todos los cuentos).
   *
   * Además, el ID que se usaba para registrar visitas y tiempos era
   * "Historias", que no coincide con el título real del catálogo
   * ("Literatura") — por eso tampoco quedaba bien registrado ahí.
   */
  const handlePageRead = (storyTitle: string, pageIndex: number, totalPages: number) => {
    const current = UserDataManager.loadUserData();
    const storyKey = `story_${storyTitle}`;
    const currentProgress = current.progress.storyProgress?.[storyTitle] || {
      lastPage: 0,
      percentage: 0,
      pagesRead: []
    };

    const pageId = `${storyTitle}_page_${pageIndex}`;
    const isNewPage = !currentProgress.pagesRead.includes(pageId);

    const updatedPagesRead = isNewPage
      ? [...currentProgress.pagesRead, pageId]
      : currentProgress.pagesRead;

    const percentage = Math.round(((pageIndex + 1) / totalPages) * 100);
    const pointsEarned = isNewPage ? POINTS_PER_PAGE : 0;
    const isStoryComplete = percentage === 100;

    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + pointsEarned
      },
      progress: {
        ...current.progress,
        storyProgress: {
          ...current.progress.storyProgress,
          [storyTitle]: {
            lastPage: pageIndex,
            percentage,
            pagesRead: updatedPagesRead
          }
        },
        activityScores: {
          ...current.progress.activityScores,
          [storyKey]: (current.progress.activityScores[storyKey] || 0) + pointsEarned
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString()
        },
        completedActivities: isStoryComplete
          ? Array.from(new Set([...current.progress.completedActivities, ACTIVITY_TITLE]))
          : current.progress.completedActivities
      }
    };

    saveUserData(updatedData);
  };

  const handleBack = () => {
    setSelectedFeature(null);
    loadUserData();
  };

  const getReadingProgress = (): Record<string, ReadingProgress> => {
    if (!userData.progress.storyProgress) return {};

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
        level={selectedFeature ? (readingProgress[selectedFeature]?.lastPage ?? 0) + 1 : 1}
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
              <p className="text-center text-base text-gray-500 mt-8">
                No se encontraron historias que coincidan con tu búsqueda.
              </p>
            )}
          </div>
        ) : (
          <StoryReader
            selectedTitle={selectedFeature}
            onBack={handleBack}
            storyProgress={userData.progress.storyProgress || {}}
            onPageRead={handlePageRead}
          />
        )}
      </div>
    </section>
  );
}