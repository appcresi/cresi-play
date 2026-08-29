"use client"
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fredoka } from 'next/font/google';
import {
  IconArrowRight,
  IconSparkles,
  IconUsers,
  IconChalkboard,
  IconChartBar,
  IconListCheck,
  IconDeviceGamepad2,
  IconKey,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { ACTIVITIES, getActivityById } from '@/lib/activities';
import { formatAgeCycles } from '@/types/activity';
import { ActivityIcon } from '@/components/ActivityIcon';
import ThemeToggle from '@/components/ThemeToggle';

// Display face con personalidad, usada con restricción (solo títulos grandes).
// El resto del texto sigue en Mona Sans, que ya usa toda la app.
const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

// ---------- Animación al scrollear ----------
//
// Sin librerías nuevas: un IntersectionObserver chico que dispara una sola
// vez por elemento, más un chequeo de prefers-reduced-motion para no animar
// si la persona pidió menos movimiento en su sistema.

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useRevealed<T extends HTMLElement>(reducedMotion: boolean) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return { ref, visible };
}

/** Envoltorio genérico: aparece con fade + subida al entrar en viewport. */
const Reveal = ({
  children,
  delay = 0,
  className = '',
  reducedMotion,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  reducedMotion: boolean;
}) => {
  const { ref, visible } = useRevealed<HTMLDivElement>(reducedMotion);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ---------- Datos ----------

const HERO_CARD_IDS = ['trivias', 'simulador', 'moodtracker'];
const HERO_CARDS = HERO_CARD_IDS.map((id) => getActivityById(id)).filter(Boolean) as typeof ACTIVITIES;
const HERO_ROTATIONS = ['-rotate-6', 'rotate-2', 'rotate-9'];

const STATS = [
  { value: `${ACTIVITIES.length}`, label: 'actividades distintas' },
  { value: '700+', label: 'preguntas educativas' },
  { value: '100%', label: 'gratuito' },
  { value: '2', label: 'formas de entrar: sola/o o con tu clase' },
];

const WelcomeLanding = () => {
  const reducedMotion = usePrefersReducedMotion();
  // El hero es lo primero que se ve, sin scroll: anima al montar, no al
  // entrar en viewport (para eso ya está `Reveal`, pensado para el resto).
  const [heroMounted, setHeroMounted] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return;
    const t = setTimeout(() => setHeroMounted(true), 50);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  return (
    <div className="min-h-screen bg-[#FFFBF8] dark:bg-gray-900 text-[#241B37] dark:text-gray-100 overflow-x-hidden transition-colors">
      {/* Barra superior: las 3 formas de entrar, siempre visibles sin scrollear */}
      <div className="sticky top-0 z-30 backdrop-blur-sm bg-[#FFFBF8]/80 dark:bg-gray-900/80 border-b border-[#241B37]/5 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logocresi.svg" alt="CrESI" className="w-8 h-8" />
            <span className={`${fredoka.className} text-lg hidden sm:block`}>CrESI</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
            <ThemeToggle className="w-9 h-9 shrink-0 hover:bg-[#241B37]/5 dark:hover:bg-gray-800" />
            <Link
              href="/unirse"
              className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2
                       rounded-full bg-[#FFE5E5] text-[#E8514F] hover:bg-[#FFD6D6] transition-colors"
            >
              <IconDeviceGamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">Jugar</span>
            </Link>
            <Link
              href="/clase"
              className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2
                       rounded-full bg-[#FFF3D6] text-[#B9800A] hover:bg-[#FFEAB8] transition-colors"
            >
              <IconKey className="w-4 h-4" />
              <span className="hidden sm:inline">Con código</span>
            </Link>
            <Link
              href="/docente"
              className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2
                       rounded-full bg-[#E6F7F5] text-[#238F85] hover:bg-[#D3F2EE] transition-colors"
            >
              <IconChalkboard className="w-4 h-4" />
              <span className="hidden sm:inline">Docente</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div
          className={`transition-all duration-700 ease-out ${
            heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 bg-[#FFE5E5] text-[#E8514F] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <IconSparkles className="w-3.5 h-3.5" />
            Plataforma gratuita de Educación Sexual Integral
          </div>

          <h1 className={`${fredoka.className} text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] mb-6`}>
            Todo lo que tenés que saber,{' '}
            <span className="text-[#FF6B6B]">en un juego.</span>
          </h1>

          <p className="text-lg text-[#241B37]/70 dark:text-gray-400 leading-relaxed mb-8 max-w-md">
            {ACTIVITIES.length} actividades sobre cuerpo, vínculos, cuidado y derechos.
            Para jugar por tu cuenta, o para llevar a toda tu clase.
          </p>

          <div className="flex flex-col gap-3 mb-10">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/unirse"
                className="flex items-center gap-2 bg-[#FF6B6B] hover:bg-[#E8514F] text-white font-bold
                         px-7 py-3.5 rounded-full shadow-[0_8px_24px_-8px_rgba(255,107,107,0.6)]
                         hover:shadow-[0_10px_28px_-6px_rgba(255,107,107,0.7)] hover:-translate-y-0.5
                         transition-all"
              >
                Empezar ahora
                <IconArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/clase"
                className="flex items-center gap-2 bg-[#FFF3D6] hover:bg-[#FFEAB8] text-[#B9800A] font-bold
                         px-6 py-3.5 rounded-full transition-all hover:-translate-y-0.5"
              >
                <IconKey className="w-5 h-5" />
                Tengo un código
              </Link>

              <Link
                href="/docente"
                className="flex items-center gap-2 bg-[#E6F7F5] hover:bg-[#D3F2EE] text-[#238F85] font-bold
                         px-6 py-3.5 rounded-full transition-all hover:-translate-y-0.5"
              >
                <IconChalkboard className="w-5 h-5" />
                Soy docente
              </Link>
            </div>
            <span className="text-sm text-[#241B37]/50 dark:text-gray-500 font-medium">
              Sin costo · con o sin cuenta
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-md border-t border-[#241B37]/10 dark:border-gray-800 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className={`${fredoka.className} text-2xl text-[#241B37] dark:text-gray-100`}>{stat.value}</p>
                <p className="text-xs text-[#241B37]/55 dark:text-gray-400 font-medium leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Abanico de tarjetas — el elemento de firma del diseño */}
        <div className="relative h-[440px] hidden sm:block">
          {HERO_CARDS.map((activity, i) => (
            <div
              key={activity.id}
              className={`absolute w-56 rounded-3xl shadow-xl border-4 border-white bg-white text-[#241B37]
                        hover:rotate-0 hover:scale-105 hover:z-20 hover:shadow-2xl
                        transition-all duration-500 cursor-default
                        ${heroMounted ? `${HERO_ROTATIONS[i]} opacity-100` : 'opacity-0 translate-y-16 rotate-0'}`}
              style={{
                top: `${i * 70}px`,
                left: `${i * 60}px`,
                zIndex: i,
                transitionDelay: heroMounted ? `${i * 150}ms` : '0ms',
              }}
            >
              {/* Imagen protagonista: llena todo el header en vez de flotar chica en el medio */}
              <div
                className="h-32 rounded-t-[1.3rem] relative overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: `${activity.color}20` }}
              >
                <Image
                  src={activity.image}
                  alt=""
                  fill
                  sizes="224px"
                  priority
                  className="object-contain scale-[1.35] p-1"
                />
                <div
                  className="absolute bottom-2.5 left-2.5 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: activity.color }}
                >
                  <ActivityIcon iconName={activity.iconName} size={17} />
                </div>
              </div>
              <div className="p-3.5">
                <p className="font-bold text-sm leading-tight">{activity.title}</p>
                <p className="text-[11px] text-[#241B37]/50 mt-0.5">{activity.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ELEGÍ CÓMO ENTRAR ============ */}
      <section id="elegir" className="max-w-6xl mx-auto px-5 pb-24 scroll-mt-20">
        <Reveal reducedMotion={reducedMotion} className="text-center mb-10">
          <h2 className={`${fredoka.className} text-2xl sm:text-3xl mb-2`}>
            Elegí cómo entrar
          </h2>
          <p className="text-[#241B37]/60 dark:text-gray-400">
            Tres caminos distintos — elegí el que te corresponde.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* Alumno sin código */}
          <Reveal reducedMotion={reducedMotion} delay={0}>
            <Link
              href="/unirse"
              className="h-full flex flex-col text-left bg-white dark:bg-gray-800 rounded-3xl border border-[#241B37]/8 dark:border-gray-800 p-6 shadow-sm
                       hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFE5E5] text-[#FF6B6B] flex items-center justify-center mb-4">
                <IconDeviceGamepad2 className="w-5 h-5" />
              </div>
              <h3 className={`${fredoka.className} text-lg mb-2`}>Jugar sin código</h3>
              <p className="text-sm text-[#241B37]/60 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                Sos alumno o alumna y querés entrar por tu cuenta — con o sin registrarte.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF6B6B]
                              group-hover:gap-2.5 transition-all">
                Empezar a jugar <IconArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </Reveal>

          {/* Alumno con código */}
          <Reveal reducedMotion={reducedMotion} delay={90}>
            <Link
              href="/clase"
              className="h-full flex flex-col text-left bg-white dark:bg-gray-800 rounded-3xl border border-[#241B37]/8 dark:border-gray-800 p-6 shadow-sm
                       hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#FFF3D6] text-[#E8A400] flex items-center justify-center mb-4">
                <IconKey className="w-5 h-5" />
              </div>
              <h3 className={`${fredoka.className} text-lg mb-2`}>Tengo un código</h3>
              <p className="text-sm text-[#241B37]/60 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                Tu docente te dio un código de clase y un usuario para entrar.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E8A400]
                              group-hover:gap-2.5 transition-all">
                Unirme a mi clase <IconArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </Reveal>

          {/* Docente */}
          <Reveal reducedMotion={reducedMotion} delay={180}>
            <Link
              href="/docente"
              className="h-full flex flex-col text-left bg-white dark:bg-gray-800 rounded-3xl border border-[#241B37]/8 dark:border-gray-800 p-6 shadow-sm
                       hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#E6F7F5] text-[#2FB8AC] flex items-center justify-center mb-4">
                <IconChalkboard className="w-5 h-5" />
              </div>
              <h3 className={`${fredoka.className} text-lg mb-2`}>Docente</h3>
              <p className="text-sm text-[#241B37]/60 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                Creá tu clase, sumá alumnos y elegí qué actividades pueden ver.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2FB8AC]
                              group-hover:gap-2.5 transition-all">
                Crear mi clase <IconArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </Reveal>
        </div>

        {/* Mini features del lado docente, para que se note que no es solo un formulario */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {[
            { icon: <IconUsers className="w-4 h-4" />, text: 'Alumnos con o sin cuenta propia' },
            { icon: <IconListCheck className="w-4 h-4" />, text: 'Elegís qué actividades ven' },
            { icon: <IconChartBar className="w-4 h-4" />, text: 'Progreso de cada alumno, en vivo' },
          ].map((f, i) => (
            <Reveal reducedMotion={reducedMotion} delay={i * 100} key={f.text}>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#241B37]/55 dark:text-gray-400 px-1">
                <span className="text-[#2FB8AC] shrink-0">{f.icon}</span>
                {f.text}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ TODAS LAS ACTIVIDADES ============ */}
      <section className="bg-[#FFF3EE] dark:bg-gray-800/40 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal reducedMotion={reducedMotion} className="text-center mb-10">
            <h2 className={`${fredoka.className} text-2xl sm:text-3xl mb-2`}>
              Explorá todo lo que hay adentro
            </h2>
            <p className="text-[#241B37]/60 dark:text-gray-400">
              Cada actividad trabaja un tema distinto — de seguridad en redes a salud mental.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {ACTIVITIES.map((activity, i) => (
              <Reveal reducedMotion={reducedMotion} delay={(i % 5) * 70} key={activity.id}>
                <Link
                  href="#elegir"
                  className="w-full block text-left bg-white dark:bg-gray-800 rounded-2xl border border-[#241B37]/6 dark:border-gray-800 p-4
                           hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white mb-3"
                    style={{ backgroundColor: activity.color }}
                  >
                    <ActivityIcon iconName={activity.iconName} size={16} />
                  </div>
                  <p className="font-bold text-sm leading-tight mb-1">{activity.title}</p>
                  <p className="text-[11px] text-[#241B37]/45 dark:text-gray-500 font-medium">{activity.category}</p>
                  <p className="text-[10px] text-[#241B37]/35 dark:text-gray-600 mt-0.5">{formatAgeCycles(activity.ageCycles)}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <Reveal reducedMotion={reducedMotion}>
        <section className="bg-[#FF6B6B] py-20 px-5 text-center">
          <h2 className={`${fredoka.className} text-3xl sm:text-4xl text-white mb-4`}>
            ¿Arrancamos?
          </h2>
          <p className="text-white/85 mb-8 max-w-md mx-auto">
            Es gratis, no necesitás tarjeta, y podés entrar en menos de un minuto.
          </p>
          <Link
            href="#elegir"
            className="inline-flex items-center gap-2 bg-white text-[#FF6B6B] font-bold
                     px-8 py-3.5 rounded-full shadow-xl hover:scale-105 transition-transform"
          >
            Ingresar o registrarme
            <IconArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="bg-[#241B37] text-white/70 py-8 px-5 text-center text-sm">
        <a
          href="https://cresi.com.ar"
          target="_blank"
          rel="noreferrer noopener"
          className="font-semibold text-white hover:text-[#FF6B6B] transition-colors"
        >
          Conocé más sobre CrESI
        </a>
      </footer>

      {/* Botón flotante "jugar ya" — acceso directo a una partida rápida,
          sin pasar por ningún formulario. Siempre visible, con o sin scroll.
          El rebote + la onda de pulso son justamente para que no pase
          desapercibido; se desactivan solos si el sistema pide menos movimiento. */}
      <div className="fixed bottom-6 right-6 z-40 w-16 h-16">
        {!reducedMotion && (
          <span className="absolute inset-0 rounded-full bg-[#FF6B6B] opacity-60 animate-ping" />
        )}
        <Link
          href="/jugarazar"
          title="Jugar ahora"
          className={`relative w-16 h-16 rounded-full
                   bg-gradient-to-br from-[#FF6B6B] to-[#E8514F]
                   text-white shadow-xl hover:shadow-2xl hover:scale-110
                   transition-transform duration-300 flex items-center justify-center
                   ${reducedMotion ? '' : 'animate-bounce'}`}
        >
          <IconPlayerPlay className="w-7 h-7 fill-current" />
        </Link>
      </div>
    </div>
  );
};

export default WelcomeLanding;