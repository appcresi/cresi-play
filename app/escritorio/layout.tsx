'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function EscritorioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (role === 'teacher') {
      router.replace('/docente');
    }
  }, [loading, user, role, router]);

  if (loading || !user || role === 'teacher') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral" />
      </div>
    );
  }

  return <>{children}</>;
}