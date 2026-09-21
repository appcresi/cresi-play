import { getSession } from '@/lib/session';
import { getTeacherSessions } from '@/lib/wordCloudServer';
import SessionSync from '@/components/SessionSync';
import NubeDePalabrasManager from './NubeDePalabrasManager';

// Server Component: verifica la sesión y trae las nubes del docente en el
// servidor, así la página llega con los datos ya puestos (antes: pantalla
// en blanco/"cargando" hasta que Firebase Auth y Firestore respondían desde
// el navegador). La parte interactiva vive en NubeDePalabrasManager.
export default async function NubeDePalabrasPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Debes estar logueado para crear una nube de palabras.</p>
        </div>
        <SessionSync />
      </div>
    );
  }

  const sessions = await getTeacherSessions(session.uid);
  return <NubeDePalabrasManager teacherId={session.uid} initialSessions={sessions} />;
}
