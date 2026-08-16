import type { Metadata } from 'next';

// Esta página no tiene contenido todavía (ver más abajo) — noindex a
// propósito en vez de inventarle título/descripción a una pantalla vacía.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CrearTriviaPage() {
  return (
    <main className="min-h-screen bg-cream py-8">
      
    </main>
  );
}