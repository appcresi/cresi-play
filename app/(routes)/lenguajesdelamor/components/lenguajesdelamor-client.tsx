'use client';

import { useEffect, useState } from 'react';
import { IconHeartHandshake, IconArrowRight } from '@tabler/icons-react';
import { getActivityById } from '@/lib/activities';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';
import LoveLanguagesTest from './LoveLanguagesTest';

const ACCENT = getActivityById('lenguajesdelamor')?.color ?? '#EC407A';

export default function LenguajesDelAmorClient() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
  }, []);

  return (
    <div className="w-full min-h-screen bg-cream dark:bg-gray-900">
      <section className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <GameStatusBar title="Lenguajes del Amor" score={score} lives={lives} level={1} />

        <div className="mb-8">
          <LoveLanguagesTest onScoreChange={setScore} />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl p-5 border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ACCENT }}>
                <IconHeartHandshake className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: ACCENT }}>
                  ¿Qué son los lenguajes del amor?
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Son las distintas formas en que las personas dan y reciben cariño: con palabras, con tiempo,
                  con regalos, con acciones o con contacto físico. Conocer el tuyo te ayuda a entenderte mejor
                  y a comunicarte con tu familia, amigos o pareja.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center shrink-0">
                <IconHeartHandshake className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-pink-900 dark:text-pink-200 mb-1">
                  ¿Qué vas a lograr?
                </p>
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  Vas a descubrir cuál es tu forma principal de sentirte querido/a, y vas a llevarte ideas
                  concretas para pedirlo y para reconocerlo en los demás.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support info */}
        <div className="bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center shrink-0">
              <IconHeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-pink-900 dark:text-pink-200 mb-2">
                ¿Querés hablar de esto con alguien?
              </h3>
              <p className="text-sm text-pink-700 dark:text-pink-300 mb-3">
                Entender cómo das y recibís cariño también ayuda a construir vínculos más sanos. Si querés
                profundizar sobre relaciones saludables, no dudes en contactarnos.
              </p>
              <a
                href="https://www.cresi.com.ar/contacto"
                className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium inline-flex items-center gap-1"
              >
                Contacta con nosotros
                <IconArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
