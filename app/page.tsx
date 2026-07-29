"use client"
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WelcomeLanding from './components/WelcomeLanding';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(role === 'teacher' ? '/docente' : '/escritorio');
  }, [loading, user, role, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#FFFBF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B6B]" />
      </div>
    );
  }

  return <WelcomeLanding />;
}