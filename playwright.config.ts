import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://<TU-APP-URL>',  // <- reemplazar con la URL de la app bajo prueba
    headless: process.env.HEADED !== '1',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: parseInt(process.env.SLOW_MO || '0', 10),
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
// Comandos útiles:
//   npm run test               → todos los tests (headless)
//   npm run test:headed        → con browser visible
//   npm run test:headless      → forzar headless
//   npm run test:debug         → modo debug (paso a paso)
//   npm run test:one -- login  → solo tests que contengan 'login'
//   npm run report             → abrir reporte HTML
//   npm run codegen            → grabar flujo interactivo
//
// Con velocidad reducida (headed + slow):
//   $env:HEADED='1'; $env:SLOW_MO='700'; npm run test
