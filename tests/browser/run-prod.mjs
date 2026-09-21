// Corre las pruebas de navegador contra un build de PRODUCCIÓN (`next build && next start`)
// en vez de `next dev`:  npm run test:browser:prod
//
// Hace falta porque la política de seguridad de contenido (lib/securityHeaders.js) es
// distinta en producción (sin 'unsafe-eval' ni WebSockets locales), y la única forma de
// ver si el sitio cumple ESA política es probarlo como llega al público.
// Un script aparte (y no `PLAYWRIGHT_PROD=1 …` en el comando) para que ande igual en Windows y Linux.
import { spawnSync } from 'child_process';

// Un solo comando (con comillas): con `shell: true` los argumentos con espacios llegarían partidos.
const command = 'npx -y firebase-tools@13 emulators:exec --config firebase.emulator.json --only firestore,auth --project demo-cresi "npx playwright test"';
const result = spawnSync(command, { stdio: 'inherit', shell: true, env: { ...process.env, PLAYWRIGHT_PROD: '1' } });
process.exit(result.status ?? 1);
