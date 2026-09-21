import { getAuth, connectAuthEmulator } from 'firebase/auth';
import app from './firebase';

export const auth = getAuth(app);

// SOLO para las pruebas en navegador (tests/browser): apunta al emulador de
// Auth. `NEXT_PUBLIC_*` se resuelve al compilar, así que sin esta variable
// (producción) el bloque es código muerto y no llega al bundle.
if (process.env.NEXT_PUBLIC_E2E_EMULATORS === '1') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch {
    // ya conectado (recarga en caliente)
  }
}
