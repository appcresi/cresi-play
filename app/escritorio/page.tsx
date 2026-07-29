"use client"
import React from 'react';
import Features from '@/app/components/Features';
import ClassroomDesk from '@/app/components/ClassroomDesk';
import { useAuth } from '@/context/AuthContext';

// Alumno con código → aula virtual (ClassroomDesk).
// Alumno sin código → panel de juego (Features), como siempre.
export default function EscritorioPage() {
  const { profile } = useAuth();
  const hasClassroom = !!profile?.profile?.classroomId;

  return hasClassroom ? <ClassroomDesk /> : <Features />;
}