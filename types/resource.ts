// types/resource.ts
//
// Recursos descargables (guías, talleres, materiales) del catálogo de
// CrESI — hoy son todos links de Google Drive, no archivos alojados en
// Firebase Storage. Viven en la colección `resources` (ver firestore.rules
// — lectura pública, escritura solo admin), cargados fuera de esta app.
// El link de descarga NO está acá: vive en `resourceFiles/{id}` y se pide
// a /api/resources/[id]/file (ResourceService.getFileUrl).

export interface Resource {
  id: string;
  title: string;
  description: string;
  /** Texto libre, ej: "workshop" — no está tipado como enum. */
  type: string;
  /** Ruta relativa, ej: "/images/recursos/ITS.png". */
  image?: string;
  is_free: boolean;
  /** En ARS, presente solo si is_free es false. */
  price?: number;
  downloads?: number;
  created_at: string;
  updated_at: string;
}
