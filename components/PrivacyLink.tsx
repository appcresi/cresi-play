// Link a la política de privacidad, que vive en el sitio institucional
// (web/app/(company)/privacidad). Va en cada lugar donde se piden o se
// publican datos: entrar, crear cuenta, sumarse al ranking.
import { PRIVACY_URL } from '@/lib/cresiWeb';

export { PRIVACY_URL };

export default function PrivacyLink({
  children = 'política de privacidad',
  className = 'font-semibold underline hover:text-coral-dark',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

/** Aviso corto debajo de los botones de entrar. */
export function PrivacyNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] text-center text-ink/45 dark:text-gray-500 ${className}`}>
      Al continuar aceptás nuestra <PrivacyLink />.
    </p>
  );
}
