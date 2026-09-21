// Lo que ve un alumno (que entró con código de clase) si llega a una pantalla
// del panel docente. La sesión del servidor sabe que es alumno por la marca
// `student` de su token (lib/session.ts), así que no hace falta traer ningún dato.
export default function SoloDocentes(): JSX.Element {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
        <p className="text-ink/70 dark:text-gray-400">Esta sección es solo para docentes.</p>
      </div>
    </div>
  );
}
