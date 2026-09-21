import { getSession } from '@/lib/session';
import { getTeacherTrivias } from '@/lib/triviaServer';
import SessionSync from '@/components/SessionSync';
import TriviasManager, { type UserTrivia } from './TriviasManager';

// Server Component: verifica la sesión y trae las trivias del docente en el
// servidor, así la página llega con la lista ya puesta (antes: esqueleto de
// carga hasta que Firebase Auth y Firestore respondían desde el navegador).
// La parte interactiva vive en TriviasManager.
export default async function TriviasPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Debes estar logueado para crear una trivia personalizada.</p>
        </div>
        <SessionSync />
      </div>
    );
  }

  const trivias = (await getTeacherTrivias(session.uid)) as unknown as UserTrivia[];
  return <TriviasManager teacherId={session.uid} initialTrivias={trivias} />;
}
