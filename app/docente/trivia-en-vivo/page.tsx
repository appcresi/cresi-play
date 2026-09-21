import { getSession } from '@/lib/session';
import { getTriviaOptionsForTeacher } from '@/lib/triviaServer';
import { getTeacherLiveSessions } from '@/lib/liveTriviaServer';
import SessionSync from '@/components/SessionSync';
import TriviaEnVivoManager from './TriviaEnVivoManager';

// Server Component: verifica la sesión y trae las trivias disponibles y las
// partidas del docente en el servidor, así la página llega con todo puesto
// (antes: "Cargando tus trivias..." hasta que Firebase Auth y Firestore
// respondían desde el navegador). La parte interactiva vive en
// TriviaEnVivoManager.
export default async function TriviaEnVivoPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Debes estar logueado para iniciar una partida en vivo.</p>
        </div>
        <SessionSync />
      </div>
    );
  }

  const [trivias, sessions] = await Promise.all([
    getTriviaOptionsForTeacher(session.uid),
    getTeacherLiveSessions(session.uid),
  ]);
  return <TriviaEnVivoManager teacherId={session.uid} initialTrivias={trivias} initialSessions={sessions} />;
}
