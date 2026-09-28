// lib/resourceService.ts
//
// Catálogo de recursos descargables (colección `resources`, lectura
// pública — ver firestore.rules). El catálogo se carga fuera de esta app
// (no hay CRUD de docente/admin acá), así que este servicio es de lectura
// más el contador de descargas (incrementDownloads).

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './firebaseFirestore';
import { auth } from './firebaseAuth';
import { track } from './trackClient';
import type { Resource } from '@/types/resource';

const mapResource = (id: string, data: any): Resource => ({
  id,
  title: data.title,
  description: data.description,
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

  /** Link de descarga (en una clase todos los recursos son gratis). Null si
   *  no hay sesión, no es docente ni alumno de una clase, o no tiene archivo. */
  async getFileUrl(resourceId: string): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const res = await fetch(`/api/resources/${encodeURIComponent(resourceId)}/file`, {
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    if (!res.ok) return null;
    const { url } = (await res.json()) as { url?: unknown };
    return typeof url === 'string' ? url : null;
  },

  /** Suma 1 al contador de descargas por /api/track — el mismo campo
   *  `downloads` que suma la plataforma principal, así el total queda
   *  unificado (las reglas de Firestore ya no dejan escribirlo desde el
   *  navegador). Se llama al hacer clic en "Descargar" dentro de una tarea. */
  async incrementDownloads(resourceId: string): Promise<void> {
    track({ kind: 'download', collection: 'resources', id: resourceId });
  },
};

export default ResourceService;
