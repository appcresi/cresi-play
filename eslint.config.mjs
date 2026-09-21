// ESLint (formato "flat"). Base oficial de Next 16: buenas prácticas de React y
// de Next + reglas de TypeScript. `next lint` ya no existe en Next 16: se corre
// con `npm run lint`. (ESLint 9 a propósito: el plugin de React que trae
// eslint-config-next todavía no soporta ESLint 10.)
//
// Política: lo que suele ser un BUG real queda como error (p. ej.
// `rules-of-hooks`); las reglas nuevas y estrictas de React 19 y las de estilo
// se dejan como AVISOS, porque el código es anterior a ellas. `npm run lint` fija
// un tope de avisos (`--max-warnings`) que solo puede BAJAR: no entran avisos nuevos.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Reglas del "compilador de React" (React 19): estrictas y muy opinadas.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      // Estilo.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      'prefer-const': 'warn',
      // Las pantallas de error usan <a> A PROPÓSITO: una navegación completa
      // reinicia el estado que falló, un <Link> no.
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    // Playwright llama `use` a su callback de fixtures: no es el hook de React.
    files: ['tests/**', 'playwright.config.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
  {
    // Archivos CommonJS: `require` es lo normal ahí (next.config.js carga lib/securityHeaders.js).
    files: ['next.config.js', '**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // Los `eslint-disable` que ya no hacen falta no son un problema de fondo.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'public/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    '.tmp-*',
  ]),
]);
