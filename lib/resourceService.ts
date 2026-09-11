// lib/resourceService.ts
//
// Catálogo de recursos descargables (colección `resources`, lectura
// pública — ver firestore.rules). El catálogo se carga fuera de esta app
// (no hay CRUD de docente/admin acá), así que este servicio es solo de
// lectura.

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
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
  downloads: data.downloads,
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
};

export default ResourceService;
