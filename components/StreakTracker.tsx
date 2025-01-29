import React, { useEffect, useState } from 'react';
import { Calendar, Flame } from 'lucide-react';

interface StreakData {
  lastVisit: string;
  currentStreak: number;
  maxStreak: number;
  visits: string[];
}

const StreakTracker: React.FC = () => {
  const [streakData, setStreakData] = useState<StreakData>({
    lastVisit: '',
    currentStreak: 0,
    maxStreak: 0,
    visits: []
  });

  const updateStreak = () => {
    const storedData = localStorage.getItem('cresiStreak');
    const today = new Date().toISOString().split('T')[0];
    
    if (storedData) {
      const data: StreakData = JSON.parse(storedData);
      
      // Si ya visitó hoy, no actualizar nada
      if (data.lastVisit === today) {
        setStreakData(data);
        return;
      }

      const lastVisitDate = new Date(data.lastVisit);
      const currentDate = new Date();
      const diffDays = Math.floor((currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

      // Actualizar racha
      let newStreak = data.currentStreak;
      if (diffDays === 1) {
        // Día consecutivo
        newStreak += 1;
      } else if (diffDays > 1) {
        // Se perdió la racha
        newStreak = 1;
      }

      const updatedData: StreakData = {
        lastVisit: today,
        currentStreak: newStreak,
        maxStreak: Math.max(newStreak, data.maxStreak),
        visits: Array.from(new Set([...data.visits, today])).sort()
      };

      localStorage.setItem('cresiStreak', JSON.stringify(updatedData));
      setStreakData(updatedData);

    } else {
      // Primera visita
      const initialData: StreakData = {
        lastVisit: today,
        currentStreak: 1,
        maxStreak: 1,
        visits: [today]
      };
      
      localStorage.setItem('cresiStreak', JSON.stringify(initialData));
      setStreakData(initialData);
    }
  };

  useEffect(() => {
    updateStreak();
  }, []);

  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-4 sm:p-6 bg-yellow-100 rounded-lg border-4 border-black transform sm:rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:rotate-0 transition-transform mb-4 sm:mb-2"> 
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-full border-2 border-black">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" strokeWidth={2} />
            </div>
            <div className="text-sm sm:text-base font-bold uppercase">
            Racha:  
            <span className="ml-1 sm:ml-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500 text-white rounded-lg border-2 border-black transform sm:-rotate-2 inline-block">
                {streakData.currentStreak} días
            </span>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-full border-2 border-black">
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" strokeWidth={2} />
            </div>

            <div className="text-sm sm:text-base font-bold uppercase">
                Mejor racha:  
                <span className="ml-1 sm:ml-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500 text-white rounded-lg border-2 border-black transform sm:rotate-2 inline-block">
                {streakData.maxStreak} días        
                </span>
            </div>
        </div>
    </div>

  );
};

export default StreakTracker;