import { getSession } from '@/lib/session';
import { getTeacherCompletaPalabras } from '@/lib/completaPalabrasServer';
import SessionSync from '@/components/SessionSync';
import SoloDocentes from '@/components/teacher/SoloDocentes';
import CompletaPalabrasManager, { type LessonDoc } from './CompletaPalabrasManager';

// Server Component: verifica la sesión y trae las lecciones del docente en
// el servidor, así la página llega con la lista ya puesta (antes: carga
// desde el navegador después de que Firebase Auth terminaba de iniciar). La
// parte interactiva vive en CompletaPalabrasManager.
export default async function CompletaPalabrasPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Debés estar logueado para crear una lección de Completa Palabras.</p>
        </div>
        <SessionSync />
      </div>
    );
  }

  // Un alumno que entró con código de clase no usa el panel docente.
  if (session.student) return <SoloDocentes />;

  const lessons = (await getTeacherCompletaPalabras(session.uid)) as unknown as LessonDoc[];
  return <CompletaPalabrasManager teacherId={session.uid} initialLessons={lessons} />;
}
