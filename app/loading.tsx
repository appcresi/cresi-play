// Se muestra mientras Next arma/streamea el segmento de una ruta en la
// navegación. No reemplaza los spinners internos que ya tiene cada página
// para su propio fetch client-side (ese fetch pasa después del mount, este
// loading no lo cubre) — es una segunda capa, para la transición en sí.
export default function Loading(): JSX.Element {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral" />
    </div>
  );
}
