// lib/infografiaService.ts
//
// No hay un CRUD centralizado de infografías (cada pantalla consulta
// `infografias` directo — ver InfografiasClient.tsx, CreateTareaScreen.tsx,
// InfografiasPicker.tsx, LinkedActivityPreview.tsx). Este servicio solo
// junta el contador de descargas, igual que ResourceService.incrementDownloads.

import { track } from './trackClient';

const InfografiaService = {
  /** Suma 1 al contador de descargas por /api/track (las reglas de
   *  Firestore ya no dejan escribirlo desde el navegador). Se llama al
   *  hacer clic en "Descargar PDF", tanto desde el catálogo público como
   *  embebida en una tarea. */
  async incrementDownloads(infografiaId: string): Promise<void> {
    track({ kind: 'download', collection: 'infografias', id: infografiaId });
  },
};

export default InfografiaService;
