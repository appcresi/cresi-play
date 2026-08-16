import type { MetadataRoute } from 'next';

const BASE_URL = 'https://jugar.cresi.com.ar';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/docente',
        '/docente/',
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
