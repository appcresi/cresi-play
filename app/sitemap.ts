import type { MetadataRoute } from 'next';

const BASE_URL = 'https://jugar.cresi.com.ar';

// Solo rutas públicas con contenido real — se deja afuera todo lo privado
// (/docente, /escritorio, /clase, /user, /unirse) y lo que no tiene
// contenido propio (certificado, crear-trivia todavía vacía).
const GAME_ROUTES = [
  'trivias',
  'pasapalabras',
  'simulador',
  'biopuzzle',
  'completapalabras',
  'condon',
  'impostor',
  'datamuncher',
  'lecciones',
  'literatura',
  'memegenerador',
  'moodtracker',
  'amor',
  'lenguajesdelamor',
  'vocacion',
  'saludmental',
  'infografias',
  'jugarazar',
  'buscador',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/docente`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...GAME_ROUTES.map((route) => ({
      url: `${BASE_URL}/${route}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
