// lib/infografiaService.ts
//
// No hay un CRUD centralizado de infografías (cada pantalla consulta
// `infografias` directo — ver InfografiasClient.tsx, CreateTareaScreen.tsx,
// InfografiasPicker.tsx, LinkedActivityPreview.tsx). Este servicio solo
// junta el contador de descargas, igual que ResourceService.incrementDownloads.

import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebaseFirestore';

const InfografiaService = {
  /** Suma 1 al contador de descargas — ver firestore.rules: se permite
   *  este único campo sin requerir sesión, igual que `downloads` en
   *  resources y `playCount` en trivia. Se llama al hacer clic en
   *  "Descargar PDF", tanto desde el catálogo público como embebida en
   *  una tarea. */
  async incrementDownloads(infografiaId: string): Promise<void> {
    await updateDoc(doc(db, 'infografias', infografiaId), { downloads: increment(1) });
  },
};

export default InfografiaService;
