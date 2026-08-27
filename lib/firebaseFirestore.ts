import { initializeFirestore, getFirestore } from 'firebase/firestore';
import app from './firebase';

// `ignoreUndefinedProperties` evita el error de Firestore "Unsupported
// field value: undefined" cuando algún objeto guardado (progreso de una
// actividad, resultados de un test, etc.) todavía no tiene un campo
// opcional definido — en vez de que el write entero falle, Firestore
// simplemente omite esa propiedad. El try/catch es porque
// `initializeFirestore` tira si ya se llamó antes para esta app (pasa en
// hot-reload de desarrollo, donde este módulo se puede re-evaluar).
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
