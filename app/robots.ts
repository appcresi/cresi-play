import type { MetadataRoute } from 'next';

const BASE_URL = 'https://jugar.cresi.com.ar';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        // /docente en sí es la landing pública para captar docentes — se
        // deja indexar. Sus sub-herramientas son privadas (panel logueado).
        '/docente/trivias',
        '/docente/completapalabras',
        '/escritorio',
        '/clase',
        '/clase/',
        '/user',
        '/unirse',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
