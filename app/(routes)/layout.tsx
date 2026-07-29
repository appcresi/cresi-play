'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';


export default function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role } = useAuth();
  const isTeacher = role === 'teacher';

  useEffect(() => {
    if (isTeacher) {
      router.replace('/docente');
    }
  }, [isTeacher, router]);

  if (isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return <>
  <Header />
  {children}
  </>;
}