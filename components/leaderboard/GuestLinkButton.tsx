'use client';

// "Guardá tu progreso con Google" para invitados. Si ese Gmail ya tenía
// cuenta en CrESI, avisa antes de cambiar: lo jugado como invitado no se suma.
import { useState } from 'react';
import { IconBrandGoogle } from '@tabler/icons-react';
import type { OAuthCredential } from 'firebase/auth';
import { linkGuestWithGoogle, switchToExistingAccount } from '@/lib/leaderboardClient';

export default function GuestLinkButton({
  onDone,
  label = 'Guardar mi progreso con Google',
  className = '',
}: {
  onDone?: () => void;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<OAuthCredential | null>(null);

  const link = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await linkGuestWithGoogle();
      if (result.status === 'in-use') setPending(result.credential);
      if (result.status === 'linked') onDone?.();
    } catch (err) {
      console.error('❌ Error vinculando con Google:', err);
      setError('No se pudo vincular. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const switchAccount = async () => {
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await switchToExistingAccount(pending);
      setPending(null);
      onDone?.();
    } catch (err) {
      console.error('❌ Error entrando con la cuenta existente:', err);
      setError('No se pudo entrar con esa cuenta.');
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className={`rounded-2xl border border-gold-light bg-gold dark:bg-gray-700 dark:border-gray-600 p-3 text-sm ${className}`}>
        <p className="text-ink dark:text-gray-100">
          Ese Gmail ya tiene una cuenta en CrESI. Si entrás con ella, <strong>lo que jugaste como invitado no se suma</strong>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={switchAccount}
            disabled={busy}
            className="px-3 py-2 rounded-full bg-coral text-white font-semibold hover:bg-coral-dark disabled:opacity-60"
          >
            Entrar con esa cuenta
          </button>
          <button
            type="button"
            onClick={() => setPending(null)}
            disabled={busy}
            className="px-3 py-2 rounded-full text-ink/70 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600"
          >
            Seguir como invitado
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-coral-dark">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={link}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-ink/15 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-ink dark:text-gray-100 hover:bg-cream dark:hover:bg-gray-700 disabled:opacity-60"
      >
        <IconBrandGoogle className="w-4 h-4" />
        {busy ? 'Abriendo Google…' : label}
      </button>
      {error && <p className="mt-1 text-xs text-coral-dark">{error}</p>}
    </div>
  );
}
