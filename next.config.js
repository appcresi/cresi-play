/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compresión general
  compress: true,
  
  // Optimizaciones experimentales
  experimental: {
    optimizeCss: true, // Optimización de CSS
    legacyBrowsers: false, // Desactiva soporte para navegadores legacy
    browsersListForSwc: true, // Usa browserslist para SWC
  },
  
  // Configuración de imágenes (ya la tienes bien configurada)
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Optimizaciones adicionales para producción
  swcMinify: true, // Usa SWC para minificación (más rápido que Terser)
  
  // Headers para mejor caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*).css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Webpack optimizaciones personalizadas
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimizaciones para producción
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }
    }
    return config
  },
}

module.exports = nextConfig