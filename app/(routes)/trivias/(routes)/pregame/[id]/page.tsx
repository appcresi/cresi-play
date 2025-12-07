'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { IconArrowNarrowLeft, IconArrowNarrowRight, IconUser, IconCalendar, IconListNumbers, IconBolt, IconShare } from '@tabler/icons-react';
import TriviaSettings from '../../../components/TriviaSettings';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Trivia {
  id: string;
  name: string;
  author: string;
  level: number;
  questions: any[];
  created_at: string;
  description?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const [id, setId] = useState<string>('');
  const [data, setData] = useState<Trivia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const { id: triviaId } = await params;
      setId(triviaId);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchTrivia = async () => {
      try {
        setLoading(true);
        const triviaRef = doc(db, 'trivia', id);
        const triviaSnap = await getDoc(triviaRef);

        if (!triviaSnap.exists()) {
          throw new Error('Trivia no encontrada');
        }

        const triviaData = triviaSnap.data() as Trivia;
        setData({
          id: triviaSnap.id,
          ...triviaData,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al obtener la trivia';
        setError(errorMessage);
        console.error('Error fetching trivia:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrivia();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Cargando trivia...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/trivias"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <IconArrowNarrowLeft size={20} />
            <span className="text-sm font-medium">Volver a trivias</span>
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-red-600">
              {error || 'No se pudo cargar la trivia'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/trivias"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <IconArrowNarrowLeft size={20} />
          <span className="text-sm font-medium">Volver a trivias</span>
        </Link>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg p-8 text-white mb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <IconListNumbers size={24} />
            </div>
            <div>
              <p className="text-sm opacity-90">Trivia</p>
              <h1 className="text-3xl font-bold">{data.name}</h1>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Trivia</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconUser size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Autor</p>
                    <p className="text-sm font-medium text-gray-900">
                      {data.author === 'CRESI' ? 'CrESI' : 'Usuario personalizado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconBolt size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nivel de dificultad</p>
                    <p className="text-sm font-medium text-gray-900">Nivel {data.level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconListNumbers size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cantidad de preguntas</p>
                    <p className="text-sm font-medium text-gray-900">{data.questions?.length || 0} preguntas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <IconCalendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha de creación</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(data.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <Link
              href={`/trivias/${data.id}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              Comenzar Trivia
              <IconArrowNarrowRight size={24} />
            </Link>
          </div>

          {/* Right Column - QR Code */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <IconShare size={20} className="text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Compartir Trivia</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Escaneá este código QR para compartir la trivia con otros
              </p>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex justify-center">
                <QRCode
                  size={200}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  value={`https://jugar.cresi.com.ar/trivias/pregame/${data.id}`}
                  viewBox={`0 0 256 256`}
                />
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 text-center">
                  Compartí este link con tus amigos para que jueguen
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Button (Fixed) */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <TriviaSettings />
          </div>
        </div>
      </div>
    </main>
  );
}