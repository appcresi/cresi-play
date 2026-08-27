'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconRefresh, IconSparkles } from '@tabler/icons-react';
import { QUESTIONS, LANGUAGES, shuffleQuestions, type LoveLanguageKey, type LoveLanguageQuestion } from '../lib/questions';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('lenguajesdelamor');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Lenguajes del Amor';
const ACCENT = ACTIVITY?.color ?? '#EC407A';

const POINTS_PER_QUESTION = 40;
const COMPLETION_BONUS = 200;

interface LoveLanguagesTestProps {
  onScoreChange?: (newScore: number) => void;
}

export default function LoveLanguagesTest({ onScoreChange }: LoveLanguagesTestProps) {
  // Arranca con el orden original (idéntico en server y cliente, para que
  // el primer render coincida y no rompa la hidratación) y recién se
  // mezcla en el useEffect de abajo, que solo corre en el navegador — ahí
  // ya no importa que el resultado de Math.random() sea distinto al del
  // server, porque el server nunca llega a ver ese segundo render.
  const [questions, setQuestions] = useState<LoveLanguageQuestion[]>(QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, LoveLanguageKey>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<LoveLanguageKey, number> | null>(null);

  useEffect(() => {
    setQuestions(shuffleQuestions());
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    onScoreChange?.(data.game.totalScore);
    UserDataManager.visitActivity(ACTIVITY_TITLE);

    const saved = data.progress.loveLanguagesTest;
    if (saved) {
      setAnswers((saved.answers as Record<number, LoveLanguageKey>) || {});
      if (saved.results) {
        setResults(saved.results as Record<LoveLanguageKey, number>);
        setShowResults(true);
      }
    }
  };

  const saveAnswerProgress = (newAnswers: Record<number, LoveLanguageKey>) => {
    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + POINTS_PER_QUESTION,
      },
      progress: {
        ...current.progress,
        loveLanguagesTest: {
          answers: newAnswers,
          // Ojo: Firestore rechaza `undefined` como valor de campo. Antes
          // de terminar el test todavía no hay resultados, así que ese
          // caso directamente omite la clave en vez de mandarla en `undefined`.
          ...(current.progress.loveLanguagesTest?.results
            ? { results: current.progress.loveLanguagesTest.results }
            : {}),
        },
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + POINTS_PER_QUESTION,
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString(),
        },
      },
    };
    UserDataManager.saveUserData(updatedData);
    onScoreChange?.(updatedData.game.totalScore);
  };

  const handleAnswer = (letter: LoveLanguageKey) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: letter };
    setAnswers(newAnswers);
    saveAnswerProgress(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setTimeout(() => handleCalculateResults(newAnswers), 400);
    }
  };

  const handleCalculateResults = (finalAnswers: Record<number, LoveLanguageKey>) => {
    const counts: Record<LoveLanguageKey, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    Object.values(finalAnswers).forEach((letter) => {
      counts[letter]++;
    });
    setResults(counts);
    setShowResults(true);

    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + COMPLETION_BONUS,
      },
      progress: {
        ...current.progress,
        completedActivities: !current.progress.completedActivities.includes(ACTIVITY_TITLE)
          ? [...current.progress.completedActivities, ACTIVITY_TITLE]
          : current.progress.completedActivities,
        loveLanguagesTest: {
          answers: finalAnswers,
          results: counts,
        },
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + COMPLETION_BONUS,
        },
      },
    };
    UserDataManager.saveUserData(updatedData);
    onScoreChange?.(updatedData.game.totalScore);

    if (!current.progress.completedActivities.includes(ACTIVITY_TITLE)) {
      trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
    }

    toast.success(
      `¡Test completado! +${POINTS_PER_QUESTION * questions.length + COMPLETION_BONUS} puntos en total`,
      { duration: 3000 }
    );
  };

  const resetTest = () => {
    setQuestions(shuffleQuestions());
    setShowResults(false);
    setResults(null);
    setAnswers({});
    setCurrentQuestion(0);

    const current = UserDataManager.loadUserData();
    UserDataManager.saveUserData({
      ...current,
      progress: {
        ...current.progress,
        loveLanguagesTest: { answers: {} },
      },
    });
  };

  if (showResults && results) {
    const sorted = (Object.entries(results) as [LoveLanguageKey, number][]).sort((a, b) => b[1] - a[1]);
    const [topKey, topTotal] = sorted[0];
    const top = LANGUAGES[topKey];
    const maxPossible = questions.length;

    return (
      <div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
          <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tu lenguaje del amor</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Así elegiste dar y recibir cariño</p>
            </div>
            <button
              onClick={resetTest}
              className="flex items-center gap-1.5 px-4 py-2 text-white rounded-full font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: ACCENT }}
            >
              <IconRefresh className="w-4 h-4" />
              Repetir test
            </button>
          </div>
        </div>

        {/* Resultado principal */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className={`bg-gradient-to-r ${top.color} p-8 text-white text-center`}>
            <div className="text-5xl mb-3">{top.icon}</div>
            <p className="text-sm font-medium opacity-90 mb-1">Tu lenguaje principal es</p>
            <h2 className="text-3xl font-bold">{top.name}</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{top.description}</p>
          </div>
        </div>

        {/* Desglose de los 5 lenguajes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {sorted.map(([key, total]) => {
            const lang = LANGUAGES[key];
            return (
              <div key={key} className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                <div className={`bg-gradient-to-r ${lang.color} px-4 py-3 text-white flex items-center justify-between`}>
                  <h3 className="text-sm font-bold line-clamp-2">{lang.name}</h3>
                  <span className="text-xl shrink-0 ml-2">{lang.icon}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Puntaje</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{total}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${lang.color} transition-all duration-500`}
                      style={{ width: `${(total / maxPossible) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips del lenguaje principal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <IconSparkles className="w-5 h-5" style={{ color: ACCENT }} />
            ¿Qué podés hacer con esto?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Conocer tu lenguaje del amor te sirve para dos cosas: pedir cariño de la forma que más te llega, y
            entender mejor cómo lo expresan las personas que te rodean, aunque no sea "tu" lenguaje.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: ACCENT }}>
                Para pedirlo vos
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-1 text-sm text-gray-600 dark:text-gray-400">
                {top.askTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: ACCENT }}>
                Para dárselo a los demás
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-1 text-sm text-gray-600 dark:text-gray-400">
                {top.giveTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="flex items-center justify-center px-2">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
            >
              {currentQuestion + 1} / {questions.length}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
              {question.text}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option) => (
              <button
                key={option.letter}
                onClick={() => handleAnswer(option.letter)}
                className="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-left transition"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.backgroundColor = `${ACCENT}0D`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.backgroundColor = ''; }}
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">{option.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 px-8 py-3 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
          <p>+{POINTS_PER_QUESTION} puntos por cada pregunta • +{COMPLETION_BONUS} bonus al finalizar</p>
        </div>
      </div>
    </div>
  );
}
