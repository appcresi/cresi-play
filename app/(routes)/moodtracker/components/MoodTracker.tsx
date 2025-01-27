"use client"
import React, { useState, useEffect } from 'react';
import { 
  IconMoodAngry, 
  IconMoodSad, 
  IconMoodAnnoyed, 
  IconMoodNeutral, 
  IconMoodSmile, 
  IconMoodHappy, 
  IconMoodCry, 
  IconMoodTongueWink, 
  IconMoodConfuzed, 
  IconMoodHeart 
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GameStatusBar from '@/components/GameStatusBar';

const MoodTracker = () => {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensityRating, setIntensityRating] = useState<number>(5);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);

 
  const moods = [
    { icon: IconMoodAngry, value: 1, label: 'Enojado', color: 'text-red-400', bgColor: 'bg-red-100' },
    { icon: IconMoodSad, value: 2, label: 'Triste', color: 'text-purple-400', bgColor: 'bg-purple-100' },
    { icon: IconMoodAnnoyed, value: 3, label: 'Molesto', color: 'text-blue-400', bgColor: 'bg-blue-100' },
    { icon: IconMoodCry, value: 4, label: 'Deprimido', color: 'text-gray-400', bgColor: 'bg-gray-100' },
    { icon: IconMoodConfuzed, value: 5, label: 'Frustrado', color: 'text-orange-400', bgColor: 'bg-orange-100' },
    { icon: IconMoodNeutral, value: 6, label: 'Neutral', color: 'text-pink-400', bgColor: 'bg-pink-100' },
    { icon: IconMoodHeart, value: 7, label: 'Amoroso', color: 'text-rose-400', bgColor: 'bg-rose-100' },
    { icon: IconMoodSmile, value: 8, label: 'Feliz', color: 'text-green-400', bgColor: 'bg-green-100' },
    { icon: IconMoodTongueWink, value: 9, label: 'Entusiasmado', color: 'text-teal-400', bgColor: 'bg-teal-100' },
    { icon: IconMoodHappy, value: 10, label: 'Muy Feliz', color: 'text-yellow-400', bgColor: 'bg-yellow-100' }
  ];
  
  interface Mood {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    value: number;
    label: string;
    color: string;
    bgColor: string;
  }

  interface MoodEntry {
    date: string;
    mood: number;
    label: string;
    intensity: number;
  }

  useEffect(() => {
    const savedMoods = localStorage.getItem('moodHistory');
    const savedScore = localStorage.getItem('totalGameScore');
    const savedLives = localStorage.getItem('totalGameLives');
    
    if (savedMoods) {
      setMoodHistory(JSON.parse(savedMoods));
    }
    if (savedScore) {
      setGameScore(parseInt(savedScore));
    }
    if (savedLives) {
      setGameLives(parseInt(savedLives));
    }
  }, []);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const handleSaveMood = () => {
    if (!selectedMood) return;

    const newMoodEntry: MoodEntry = {
      date: new Date().toISOString(),
      mood: selectedMood.value,
      label: selectedMood.label,
      intensity: intensityRating
    };
    
    const updatedHistory: MoodEntry[] = [...moodHistory, newMoodEntry];
    setMoodHistory(updatedHistory);
    localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));

    // Actualizar puntuación y vidas
    if (gameLives < 3) {
      const newLives = gameLives + 1;
      setGameLives(newLives);
      localStorage.setItem('totalGameLives', newLives.toString());
    } else {
      const newScore = gameScore + 200;
      setGameScore(newScore);
      localStorage.setItem('totalGameScore', newScore.toString());
    }
  };

  const chartData = moodHistory.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    valor: entry.mood,
    intensidad: entry.intensity,
    estado: entry.label
  }));

  return (
    <div className="min-h-screen bg-yellow-50 p-4 sm:p-6 pt-24"> 
  <GameStatusBar 
    title="Mood Tracker"
    score={gameScore}
    lives={gameLives}
    level={1}
  />
  
  <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
    <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4 sm:p-6 transform rotate-1">
      <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-blue-600 tracking-wide text-center" 
          style={{ textShadow: '2px 2px 0 #000' }}>
        ¡Diario de Emociones!
      </h1>
      <p className="text-base sm:text-lg font-semibold text-gray-700 text-center mb-4">
        ¿Cómo estás hoy? 
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => handleMoodSelect(mood)}
            className={`relative p-4 rounded-lg flex flex-col items-center transition-all
              ${mood.bgColor} border-4 border-black
              ${selectedMood?.label === mood.label 
                ? 'transform scale-105 shadow-xl' 
                : 'hover:scale-105 hover:shadow-lg'}
              transform hover:-rotate-3 transition-transform duration-200`}
          >
            <mood.icon 
              className={`w-12 h-12 sm:w-16 sm:h-16 ${mood.color}`}
              strokeWidth={3}
            />
            <span className="mt-2 text-sm sm:text-base font-bold text-gray-800">{mood.label}</span>
          </button>
        ))}
      </div>

      {selectedMood && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-yellow-50 rounded-lg shadow-lg border-4 border-black">
          <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center" style={{ 
            textTransform: 'uppercase'
          }}>Del 1 al 10, ¿Cómo te sentís?</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={intensityRating} 
              onChange={(e) => setIntensityRating(parseInt(e.target.value))} 
              className="w-full h-4 sm:h-6 bg-yellow-200 rounded-full appearance-none cursor-pointer border-2 border-black"
            />
            <span className="text-2xl sm:text-3xl font-bold" style={{ 
              color: '#FF6B6B'
            }}>{intensityRating}</span>
          </div>
          
          <div className="flex justify-between text-lg sm:text-xl mt-2">
            <span className="text-3xl sm:text-4xl"><IconMoodAngry className="w-6 sm:w-8 h-6 sm:h-8 text-red-500" strokeWidth={3} /></span>
            <span className="text-3xl sm:text-4xl"><IconMoodHappy className="w-6 sm:w-8 h-6 sm:h-8 text-green-500" strokeWidth={3} /></span>
          </div>
          
          <button 
            onClick={handleSaveMood} 
            className="mt-4 w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors transform hover:scale-105 border-4 border-black"
          >
            ¡Guardar registro!
          </button>
        </div>
      )}
    </div>

    {moodHistory.length > 0 && (
      <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4 sm:p-6 transform -rotate-1">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-purple-600" 
            style={{ textShadow: '1px 1px 0 #000' }}>
          ¡Tu Aventura Emocional!
        </h2>
        <div className="h-48 sm:h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="#000000"
                fontSize={10}
                strokeWidth={2}
              />
              <YAxis 
                yAxisId="left"
                stroke="#000000"
                fontSize={10}
                strokeWidth={2}
                ticks={[0, 1, 2, 3, 4, 5,6, 7, 8, 9, 10]}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#FF0000"
                domain={[1, 10]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'white',
                  border: '3px solid black',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="valor" 
                stroke="#6366f1"
                strokeWidth={3}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="intensidad" 
                stroke="#FF0000"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
  </div>
</div>

  );
};

export default MoodTracker;