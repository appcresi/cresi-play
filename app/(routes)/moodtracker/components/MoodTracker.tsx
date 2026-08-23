"use client"
import React, { useState, useEffect } from 'react';
import { IconCalendar, IconMedal, IconTrophy, IconBook, IconStar, IconChartBar, IconArrowLeft } from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';
import type { Achievement } from '@/types/user';

const ACTIVITY = getActivityById('moodtracker');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'MoodTracker';
const ACCENT = ACTIVITY?.color ?? '#0288D1';

interface MoodEntry {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

interface Stats {
  moodCounts: Record<string, number>;
  avgIntensity: string;
  totalEntries: number;
  mostCommonMood: string;
}

interface Mood {
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

const ACHIEVEMENT_POINTS: Record<string, number> = {
  'streak-3': 500,
  'mood-master': 1000,
  'note-taker': 750,
  'intensity-explorer': 500,
  'streak-7': 1000,
  'streak-30': 2000
};

// MoodIcon Component
const MoodIcon = ({ mood }: { mood: Mood }) => {
  switch (mood.value) {
    case 1: return <div role="img" aria-label="Angry" className={`text-4xl ${mood.color}`}>😠</div>;
    case 2: return <div role="img" aria-label="Sad" className={`text-4xl ${mood.color}`}>😢</div>;
    case 3: return <div role="img" aria-label="Annoyed" className={`text-4xl ${mood.color}`}>😤</div>;
    case 4: return <div role="img" aria-label="Depressed" className={`text-4xl ${mood.color}`}>😩</div>;
    case 5: return <div role="img" aria-label="Frustrated" className={`text-4xl ${mood.color}`}>😫</div>;
    case 6: return <div role="img" aria-label="Neutral" className={`text-4xl ${mood.color}`}>😐</div>;
    case 7: return <div role="img" aria-label="Loving" className={`text-4xl ${mood.color}`}>😍</div>;
    case 8: return <div role="img" aria-label="Happy" className={`text-4xl ${mood.color}`}>😊</div>;
    case 9: return <div role="img" aria-label="Excited" className={`text-4xl ${mood.color}`}>😋</div>;
    case 10: return <div role="img" aria-label="Very Happy" className={`text-4xl ${mood.color}`}>😄</div>;
    default: return null;
  }
};

// Achievement Icon Component
const AchievementIcon = ({ iconName, className }: { iconName: string; className: string }) => {
  switch (iconName) {
    case 'Medal': return <IconMedal className={className} />;
    case 'Trophy': return <IconTrophy className={className} />;
    case 'BookOpen': return <IconBook className={className} />;
    case 'Star': return <IconStar className={className} />;
    default: return null;
  }
};

const MoodTracker = () => {
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensityRating, setIntensityRating] = useState<number>(5);
  const [moodNote, setMoodNote] = useState('');
  const [showStats, setShowStats] = useState(false);

  const moods: Mood[] = [
    { value: 1, label: 'Enojado', color: 'text-red-400', bgColor: 'bg-red-100' },
    { value: 2, label: 'Triste', color: 'text-purple-400', bgColor: 'bg-purple-100' },
    { value: 3, label: 'Molesto', color: 'text-blue-400', bgColor: 'bg-blue-100' },
    { value: 4, label: 'Deprimido', color: 'text-gray-400', bgColor: 'bg-gray-100' },
    { value: 5, label: 'Frustrado', color: 'text-orange-400', bgColor: 'bg-orange-100' },
    { value: 6, label: 'Neutral', color: 'text-pink-400', bgColor: 'bg-pink-100' },
    { value: 7, label: 'Amoroso', color: 'text-rose-400', bgColor: 'bg-rose-100' },
    { value: 8, label: 'Feliz', color: 'text-green-400', bgColor: 'bg-green-100' },
    { value: 9, label: 'Entusiasmado', color: 'text-teal-400', bgColor: 'bg-teal-100' },
    { value: 10, label: 'Muy Feliz', color: 'text-yellow-400', bgColor: 'bg-yellow-100' }
  ];

  const moodColors: Record<string, string> = {
    'Enojado': '#f87171',
    'Triste': '#c084fc',
    'Molesto': '#60a5fa',
    'Deprimido': '#9ca3af',
    'Frustrado': '#fb923c',
    'Neutral': '#f472b6',
    'Amoroso': '#fb7185',
    'Feliz': '#4ade80',
    'Entusiasmado': '#2dd4bf',
    'Muy Feliz': '#facc15'
  };

  const defaultAchievements: Achievement[] = [
    {
      id: 'streak-3',
      name: '3 días seguidos',
      description: 'Registraste tu estado de ánimo durante 3 días consecutivos',
      iconName: 'Medal',
      unlocked: false
    },
    {
      id: 'streak-7',
      name: 'Una semana completa',
      description: 'Registraste tu estado de ánimo durante 7 días consecutivos',
      iconName: 'Trophy',
      unlocked: false
    },
    {
      id: 'mood-master',
      name: 'Maestro del Ánimo',
      description: 'Usaste todas las emociones disponibles',
      iconName: 'Trophy',
      unlocked: false
    },
    {
      id: 'note-taker',
      name: 'Reflexivo',
      description: 'Escribiste 5 notas detalladas sobre tus emociones',
      iconName: 'BookOpen',
      unlocked: false
    },
    {
      id: 'intensity-explorer',
      name: 'Explorador Emocional',
      description: 'Usaste toda la escala de intensidad (1-10)',
      iconName: 'Star',
      unlocked: false
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  // Antes esta actividad nunca se registraba como visitada ni completada
  // en ningún lado — la funcionalidad en sí (registrar humor, logros,
  // racha) andaba bien, pero "MoodTracker" nunca aparecía marcada en el
  // resto de la app.
  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    UserDataManager.visitActivity(ACTIVITY_TITLE);

    if (data.achievements.length === 0) {
      const updatedData = { ...data, achievements: defaultAchievements };
      UserDataManager.saveUserData(updatedData);
      setUserData(updatedData);
    }
  };

  const checkAchievements = (updatedHistory: MoodEntry[]) => {
    let achievementsToUnlock: Achievement[] = [];

    if (userData.game.streak >= 3) {
      const a = userData.achievements.find(a => a.id === 'streak-3');
      if (a && !a.unlocked) achievementsToUnlock.push(a);
    }

    if (userData.game.streak >= 7) {
      const a = userData.achievements.find(a => a.id === 'streak-7');
      if (a && !a.unlocked) achievementsToUnlock.push(a);
    }

    const usedMoods = new Set(updatedHistory.map(entry => entry.mood));
    if (usedMoods.size === moods.length) {
      const a = userData.achievements.find(a => a.id === 'mood-master');
      if (a && !a.unlocked) achievementsToUnlock.push(a);
    }

    const notesCount = updatedHistory.filter(entry => entry.note && entry.note.length > 20).length;
    if (notesCount >= 5) {
      const a = userData.achievements.find(a => a.id === 'note-taker');
      if (a && !a.unlocked) achievementsToUnlock.push(a);
    }

    const usedIntensities = new Set(updatedHistory.map(entry => entry.intensity));
    if (usedIntensities.size >= 10) {
      const a = userData.achievements.find(a => a.id === 'intensity-explorer');
      if (a && !a.unlocked) achievementsToUnlock.push(a);
    }

    achievementsToUnlock.forEach(achievement => {
      UserDataManager.addAchievement({ ...achievement, unlocked: true }, ACHIEVEMENT_POINTS[achievement.id] || 100);
    });

    if (achievementsToUnlock.length > 0) {
      const updatedData = UserDataManager.loadUserData();
      setUserData(updatedData);
    }
  };

  const calculateStats = (): Stats | null => {
    if (userData.mood.history.length === 0) return null;

    const moodCounts = userData.mood.history.reduce((acc, entry) => {
      acc[entry.label] = (acc[entry.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgIntensity = userData.mood.history.reduce((sum, entry) => sum + entry.intensity, 0) / userData.mood.history.length;

    return {
      moodCounts,
      avgIntensity: avgIntensity.toFixed(1),
      totalEntries: userData.mood.history.length,
      mostCommonMood: Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
    };
  };

  const handleSaveMood = () => {
    if (!selectedMood) return;

    const newMoodEntry: MoodEntry = {
      date: new Date().toISOString(),
      mood: selectedMood.value,
      label: selectedMood.label,
      intensity: intensityRating,
      note: moodNote
    };

    UserDataManager.updateMoodEntry(newMoodEntry);
    let updatedData = UserDataManager.updateMoodStreakAndRewards(newMoodEntry);

    // Se marca "MoodTracker" como completado desde el primer registro.
    if (!updatedData.progress.completedActivities.includes(ACTIVITY_TITLE)) {
      updatedData = {
        ...updatedData,
        progress: {
          ...updatedData.progress,
          completedActivities: [...updatedData.progress.completedActivities, ACTIVITY_TITLE],
          activityTimes: {
            ...updatedData.progress.activityTimes,
            [ACTIVITY_TITLE]: new Date().toISOString()
          }
        }
      };
      UserDataManager.saveUserData(updatedData);
      trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
    }

    setUserData(updatedData);
    checkAchievements(updatedData.mood.history);

    setSelectedMood(null);
    setIntensityRating(5);
    setMoodNote('');
  };

  const chartData = userData.mood.history.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    valor: entry.mood,
    intensidad: entry.intensity
  }));

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <GameStatusBar
        title="Mood Tracker"
        score={userData.game.totalScore}
        lives={userData.game.totalLives}
        level={1}
      />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        {showStats ? (
          <>
            <button
              onClick={() => setShowStats(false)}
              className="flex items-center gap-2 font-medium mb-6 hover:opacity-80 transition-opacity"
              style={{ color: ACCENT }}
            >
              <IconArrowLeft className="w-5 h-5" />
              Volver a registrar
            </button>

            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6 border-t-4" style={{ borderTopColor: ACCENT }}>
                    <p className="text-ink/60 dark:text-gray-400 text-sm font-medium">Entradas Totales</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: ACCENT }}>{stats.totalEntries}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-x border-b border-pink-light dark:border-gray-700 p-6 border-t-4 border-t-green-500">
                    <p className="text-ink/60 dark:text-gray-400 text-sm font-medium">Racha Actual</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{userData.game.streak} días</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-x border-b border-pink-light dark:border-gray-700 p-6 border-t-4 border-t-purple-500">
                    <p className="text-ink/60 dark:text-gray-400 text-sm font-medium">Intensidad Promedio</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.avgIntensity}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-x border-b border-pink-light dark:border-gray-700 p-6 border-t-4 border-t-orange-500">
                    <p className="text-ink/60 dark:text-gray-400 text-sm font-medium">Emoción Más Común</p>
                    <p className="text-lg font-bold text-orange-600 mt-2">{stats.mostCommonMood}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6">
                    <h3 className="text-base font-semibold text-ink dark:text-gray-100 mb-4">Distribución de Emociones</h3>
                    <div className="flex justify-center">
                      <PieChart width={250} height={250}>
                        <Pie
                          dataKey="value"
                          data={Object.entries(stats.moodCounts).map(([name, value]) => ({
                            name,
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {Object.entries(stats.moodCounts).map(([name]) => (
                            <Cell key={`cell-${name}`} fill={moodColors[name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6">
                    <h3 className="text-base font-semibold text-ink dark:text-gray-100 mb-4">Tu Aventura Emocional</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer>
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" stroke="#999" fontSize={12} />
                          <YAxis yAxisId="left" stroke="#999" domain={[0, 10]} />
                          <YAxis yAxisId="right" orientation="right" stroke="#999" />
                          <Tooltip contentStyle={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="valor" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                          <Line yAxisId="right" type="monotone" dataKey="intensidad" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6">
                  <h3 className="text-base font-semibold text-ink dark:text-gray-100 mb-4">Logros Desbloqueados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-xl border-l-4 ${
                          achievement.unlocked
                            ? 'bg-gold-light border-gold-accent'
                            : 'bg-white dark:bg-gray-700 border-ink/15 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AchievementIcon
                            iconName={achievement.iconName || ''}
                            className={`w-6 h-6 shrink-0 ${
                              achievement.unlocked ? 'text-gold-accent' : 'text-ink/30 dark:text-gray-600'
                            }`}
                          />
                          <div>
                            <h4 className="font-bold text-ink dark:text-gray-100">{achievement.name}</h4>
                            <p className="text-sm text-ink/60 dark:text-gray-400">{achievement.description}</p>
                            {achievement.unlocked && achievement.date && (
                              <p className="text-xs text-ink/40 dark:text-gray-500 mt-1">
                                Desbloqueado: {new Date(achievement.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3 text-ink/80 dark:text-gray-300">
                <IconCalendar className="w-5 h-5" style={{ color: ACCENT }} />
                <span className="font-medium">Racha actual: <span className="font-bold" style={{ color: ACCENT }}>{userData.game.streak} días</span></span>
              </div>
              <button
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-full font-semibold transition-colors hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                <IconChartBar className="w-5 h-5" />
                Ver Estadísticas
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-bold text-ink dark:text-gray-100 mb-6">¿Cómo te sentís hoy?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all ${
                      selectedMood?.label === mood.label
                        ? `${mood.bgColor} ring-2 ring-offset-2 shadow-md scale-105`
                        : `${mood.bgColor} hover:shadow-sm`
                    }`}
                    style={selectedMood?.label === mood.label ? ({ '--tw-ring-color': ACCENT } as React.CSSProperties) : undefined}
                  >
                    <MoodIcon mood={mood} />
                    <span className="mt-2 text-xs font-medium text-ink/80 dark:text-gray-300 text-center">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedMood && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6 mb-8">
                <h3 className="text-base font-semibold text-ink dark:text-gray-100 mb-4">
                  ¿Cuál es la intensidad de tu emoción?
                </h3>

                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={intensityRating}
                      onChange={(e) => setIntensityRating(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full appearance-none cursor-pointer"
                    />
                    <span className="text-xl font-bold text-ink dark:text-gray-100 bg-pink-light dark:bg-gray-700 px-3 py-1 rounded-full min-w-fit">
                      {intensityRating}/10
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-ink/40 dark:text-gray-500 mt-2">
                    <span>Muy bajo</span>
                    <span>Muy alto</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-ink/80 dark:text-gray-300 mb-2">
                    Agregar una nota (opcional)
                  </label>
                  <textarea
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder="¿Qué te hizo sentir así?"
                    className="w-full p-3 border border-pink-light rounded-xl focus:ring-2 focus:border-transparent resize-none h-24 text-sm"
                    style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                  />
                </div>

                <button
                  onClick={handleSaveMood}
                  className="w-full text-white font-bold py-3 rounded-full transition-colors hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Guardar Emoción
                </button>
              </div>
            )}

            {userData.mood.history.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-6">
                <h3 className="text-base font-semibold text-ink dark:text-gray-100 mb-4">Historial Reciente</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userData.mood.history.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-cream dark:bg-gray-900 rounded-xl border-l-4" style={{ borderColor: ACCENT }}>
                      <div className="flex items-center gap-3">
                        <MoodIcon mood={moods.find(m => m.value === entry.mood) || moods[0]} />
                        <div>
                          <p className="font-medium text-ink dark:text-gray-100">{entry.label}</p>
                          <p className="text-sm text-ink/60 dark:text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-ink/70 dark:text-gray-400">Intensidad: {entry.intensity}/10</p>
                        {entry.note && <p className="text-xs text-ink/40 dark:text-gray-500 max-w-xs truncate">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MoodTracker;