// types/resource.ts
//
// Recursos descargables (guías, talleres, materiales) del catálogo de
// CrESI — hoy son todos links de Google Drive, no archivos alojados en
// Firebase Storage. Viven en la colección `resources` (ver firestore.rules
// — lectura pública, escritura solo admin), cargados fuera de esta app.

export interface Resource {
  id: string;
  title: string;
  description: string;
  /** Link de descarga real — hoy son todos de Google Drive. */
  url: string;
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
