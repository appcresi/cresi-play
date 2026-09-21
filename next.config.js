/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  productionBrowserSourceMaps: false,
  // Interruptor de las pruebas en navegador (tests/browser). Se declara SIEMPRE
  // (con '0' por defecto) para que Next lo reemplace por un literal al compilar:
  // sin esto, si la variable no está definida, la comprobación se queda como una
  // lectura en tiempo de ejecución y los ganchos de prueba (emuladores, inicio de
  // sesión de servicio) viajan al navegador aunque estén inertes. Con el literal
  // '0' el minificador los elimina.
  env: {
    NEXT_PUBLIC_E2E_EMULATORS: process.env.NEXT_PUBLIC_E2E_EMULATORS === '1' ? '1' : '0',
  },
  turbopack: {
    resolveExtensions: [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
}

module.exports = nextConfig