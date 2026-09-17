// lib/resourceService.ts
//
// Catálogo de recursos descargables (colección `resources`, lectura
// pública — ver firestore.rules). El catálogo se carga fuera de esta app
// (no hay CRUD de docente/admin acá), así que este servicio es de lectura
// más el contador de descargas (incrementDownloads).

import { collection, doc, getDoc, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebaseFirestore';
import type { Resource } from '@/types/resource';

const mapResource = (id: string, data: any): Resource => ({
  id,
  title: data.title,
  description: data.description,
  url: data.url,
  type: data.type,
  image: data.image,
  is_free: data.is_free ?? true,
  price: data.price,
  downloads: data.downloads ?? 0,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

const ResourceService = {
  async getAll(): Promise<Resource[]> {
    const snap = await getDocs(collection(db, 'resources'));
    return snap.docs
      .map((d) => mapResource(d.id, d.data()))
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  },

  async getById(resourceId: string): Promise<Resource | null> {
    const snap = await getDoc(doc(db, 'resources', resourceId));
    if (!snap.exists()) return null;
    return mapResource(snap.id, snap.data());
  },

  /** Suma 1 al contador de descargas — el mismo campo `downloads` que
   *  suma la plataforma principal, así el total queda unificado sin
   *  importar desde dónde se descargó (ver firestore.rules: se permite
   *  este único campo sin requerir sesión, igual que playCount en
   *  trivia). Se llama al hacer clic en "Descargar" dentro de una tarea. */
  async incrementDownloads(resourceId: string): Promise<void> {
    await updateDoc(doc(db, 'resources', resourceId), { downloads: increment(1) });
  },
};

export default ResourceService;
