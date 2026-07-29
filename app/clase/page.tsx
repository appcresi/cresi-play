"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconKey, IconArrowLeft } from '@tabler/icons-react';

export default function EnterClassCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleContinue = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/clase/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 p-6 text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
            <IconKey className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">¿Tenés un código de clase?</h1>
        <p className="text-gray-600 text-xs mb-6">Ingresalo para continuar.</p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
          maxLength={8}
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none
                   focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm tracking-widest
                   text-center font-bold uppercase mb-4"
          placeholder="EJ: A3F9K2"
        />

        <button
          onClick={handleContinue}
          disabled={!code.trim()}
          className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700
                   transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          Continuar
        </button>

        <Link href="/unirse" className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600">
          <IconArrowLeft className="w-3.5 h-3.5" /> No tengo código
        </Link>
      </div>
    </div>
  );
}