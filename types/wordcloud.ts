// types/wordcloud.ts
//
// "Nube de Palabras" — herramienta en vivo estilo Mentimeter: el/la docente
// crea una sala con un código corto, la proyecta, y alumnos sin login
// escriben palabras desde el celular que se suman a una nube que crece en
// tiempo real. Ver lib/wordCloudService.ts para la lógica de Firestore.
export interface WordCloudSession {
  code: string;
  title: string;
  teacherId: string;
  active: boolean;
  createdAt: string;
}

export interface WordCloudEntry {
  id: string;
  text: string;
  count: number;
}
