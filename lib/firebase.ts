import { initializeApp, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase una sola vez
let app: any;
try {
  app = getApp();
} catch (error) {
  app = initializeApp(firebaseConfig);
}

// Solo la app base acá — sin `auth` ni `firestore`. Un módulo que solo
// necesita autenticación (como el layout raíz, montado en TODAS las
// páginas) no debería arrastrar el SDK entero de Firestore solo por
// compartir archivo con él. Ver lib/firebaseAuth.ts y lib/firebaseFirestore.ts.
export default app;
