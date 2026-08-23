"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fredoka } from 'next/font/google';
import { IconKey, IconArrowLeft } from '@tabler/icons-react';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

export default function EnterClassCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleContinue = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/clase/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-pink dark:from-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-sm w-full border border-ink/8 dark:border-gray-700 p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Image src="/logocresi.svg" alt="CrESI" width={64} height={64} className="w-16 h-16" />
        </div>
        <h1 className={`${fredoka.className} text-xl text-ink dark:text-gray-100 mb-1`}>¿Tenés un código de clase?</h1>
        <p className="text-ink/60 dark:text-gray-400 text-xs mb-6">Ingresalo para continuar.</p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
          maxLength={8}
          autoFocus
          className="w-full px-3 py-2.5 border border-ink/15 dark:border-gray-600 rounded-xl focus:outline-none
                   focus:ring-2 focus:ring-coral bg-white dark:bg-gray-700 text-ink dark:text-gray-100 text-sm tracking-widest
                   text-center font-bold uppercase mb-4"
          placeholder="EJ: A3F9K2"
        />

        <button
          onClick={handleContinue}
          disabled={!code.trim()}
          className="w-full bg-coral text-white py-2.5 px-3 rounded-xl hover:bg-coral-dark
                   transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          Continuar
        </button>

        <Link href="/unirse" className="flex items-center justify-center gap-1 text-xs text-ink/40 dark:text-gray-500 hover:text-ink/70 dark:hover:text-gray-300">
          <IconArrowLeft className="w-3.5 h-3.5" /> No tengo código
        </Link>
      </div>
    </div>
  );
}
