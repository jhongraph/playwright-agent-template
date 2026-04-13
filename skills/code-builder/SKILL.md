---
name: code-builder
description: 'Genera fixtures TypeScript y specs Playwright a partir del plan JSON y los selectores del discovery. Usar cuando el orquestador necesita convertir el plan de un TC en código E2E. Lee plan-output.json + discovery-output.json y escribe los archivos .fixture.ts y .spec.ts en TPlans/. NO toca browser, NO toca ADO, NO ejecuta tests — solo escribe código.'
argument-hint: 'TC ID (para localizar plan-<ID>.json y discovery-<ID>.json). Ruta donde crear los archivos (default: TPlans/).'
---

# Code Builder Agent

**Rol:** Auto Dev — TypeScript Writer  
**Input:** `.agent-state/plan-<TC_ID>.json` + `.agent-state/discovery-<TC_ID>.json`  
**Output:** `TPlans/fixtures/<flujo>.fixture.ts` + `TPlans/tests/<flujo>.spec.ts`  
**Herramientas permitidas:** File system (leer/escribir archivos) + terminal solo para `tsc --noEmit`  
**PROHIBIDO:** Abrir MCP Browser, tocar ADO, ejecutar `npx playwright test`

> → Consultar `playwright-guide.md` para implementación canónica de helpers (`waitForPageIdle`, `safeSetValue`, `setIfBlank`, `logEmptyFields`, `clickContinuar`).  
> → Consultar `execution-rules.md` para REGLAs 1-13 de comportamiento.

---

## Responsabilidad única

Tomar el plan (pasos, datos) y el catálogo de selectores confirmados y convertirlos en código Playwright correcto. El input ya viene verificado — no re-navegar la app.

---

## PASO 1 — Leer los contratos de input

Leer `.agent-state/plan-<TC_ID>.json` y `.agent-state/discovery-<TC_ID>.json`.

⛔ Si alguno de los dos archivos no existe → reportar el error al orquestador. NO proceder sin ambos archivos.

Verificar que `discovery-output.json` tiene selectores para todas las pantallas mencionadas en los steps del plan.  
Si falta una pantalla → reportar al orquestador: "Pantalla X no tiene selectores — se necesita re-run de discovery."

---

## PASO 2 — Crear estructura de carpetas

```
TPlans/
├── playwright.config.ts   (si no existe)
├── fixtures/
│   ├── <flujo>.fixture.ts
│   └── files/
│       └── dummy.pdf     (si hay uploads)
├── tests/
│   └── <TC_ID>-<slug>.spec.ts
└── data/
    └── test-data.json    (si hay datos de pool)
```

---

## PASO 3 — Escribir playwright.config.ts (si no existe)

```ts
import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env.playwright' });

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: process.env.APP_URL || '<URL_DEL_AMBIENTE>',
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

---

## PASO 4 — Escribir el fixture

El fixture es el Page Object simplificado. Contiene: `TEST_DATA`, `SEL`, y los helpers.

### Estructura obligatoria del fixture

```ts
import { Page, Locator, expect } from '@playwright/test';
import * as path from 'node:path';

// ── DATOS DE PRUEBA ────────────────────────────────────────────────
export const TEST_DATA = {
  // Extraídos directamente del plan-output.json > test_data
  user: process.env.TEST_USER || '<usuario>',
  password: process.env.TEST_PASS || '<contraseña>',
  // ... resto de datos del TC
};

// ── ARCHIVOS ───────────────────────────────────────────────────────
export const DUMMY_PDF = path.join(__dirname, 'files', 'dummy.pdf');
// Solo si el TC necesita uploads

// ── SELECTORES ─────────────────────────────────────────────────────
// Todos los selectores son los de discovery-output.json — PRIORITY 1 (IDs confirmados)
export const SEL = {
  // ── LOGIN ──────────────────────────────────────────────────
  // LOCATOR_EVIDENCE: confirmado via Discovery Agent JS eval
  login: {
    username: '#LoginUser_UserName',
    password: '#LoginUser_Password',
    btn:      '#LoginUser_LoginButton',
  },
  // ── PANTALLA 1 — nombre ────────────────────────────────────
  // LOCATOR_EVIDENCE: confirmado via Discovery Agent JS eval
  s1: {
    campo1:      '#MainContent_campo1',           // PRIORITY 1
    campoJs:     '#MainContent_campoRestrictivo', // PRIORITY 1 — JS-RESTRICTED (oninput)
    ddlReactivo: '#MainContent_ddlTipo',          // PRIORITY 1 — ⚡ Reactivo (AutoPostBack)
    continuar:   '#MainContent_btnContinuar',     // PRIORITY 1
  },
};

// ── HELPERS ────────────────────────────────────────────────────────
// Ver implementación canónica en playwright-guide.md
// Elegir variante de waitForPageIdle según technology en discovery-output.json

// → COPIAR la variante correcta de playwright-guide.md según wait_strategy:
//   "A" → WebForms/UpdatePanel
//   "B" → React/Vue/Angular SPA
//   "C" → Universal/desconocida
export async function waitForPageIdle(page: Page, timeout = 20_000): Promise<void> {
  // (pegar variante correcta de playwright-guide.md)
}

export async function safeSetValue(page: Page, selector: string, value: string): Promise<void> {
  // (pegar de playwright-guide.md)
}

export async function setIfBlank(page: Page, locator: Locator, value: string,
  opts: { isSelect?: boolean; allowZero?: boolean } = {}): Promise<void> {
  // (pegar de playwright-guide.md)
}

export async function logEmptyFields(page: Page, formSel: string, ss: Function): Promise<void> {
  // (pegar de playwright-guide.md)
}

export async function clickContinuar(page: Page, selector: string): Promise<void> {
  // (pegar de playwright-guide.md)
}

// ── LOGIN ──────────────────────────────────────────────────────────
export async function loginFlujo(page: Page): Promise<void> {
  await page.goto(process.env.APP_URL || TEST_DATA.url || '/');
  await page.locator(SEL.login.username).fill(TEST_DATA.user);
  await page.locator(SEL.login.password).fill(TEST_DATA.password);
  await page.locator(SEL.login.btn).click();
  await waitForPageIdle(page);
}
```

### Reglas del fixture

- Usar `process.env.TEST_USER` / `process.env.TEST_PASS` para credenciales (no hardcodear)
- Cada sección de SEL debe tener el comentario `// LOCATOR_EVIDENCE`
- Campos `js_restricted: true` en discovery → comentar con `// JS-RESTRICTED`
- Campos `reactive: true` en discovery → comentar con `// ⚡ Reactivo`
- Los helpers van en el fixture, NO en el spec (evitar duplicación)

---

## PASO 5 — Escribir el spec

```ts
import { test, expect } from '@playwright/test';
import {
  SEL, TEST_DATA,
  loginFlujo, waitForPageIdle, safeSetValue, setIfBlank, logEmptyFields, clickContinuar
} from '../fixtures/<flujo>.fixture';

function makeScreenshot(page: Page, testInfo: any) {
  return async (name: string) => {
    const buf = await page.screenshot({ fullPage: true });
    await testInfo.attach(name, { body: buf, contentType: 'image/png' });
  };
}

test.describe('<Título del TC>', () => {

  test('TC-<ID> | <título corto>', async ({ page }, testInfo) => {
    const ss = makeScreenshot(page, testInfo);

    // ── SETUP ──────────────────────────────────────────────────
    await loginFlujo(page);
    await ss('00-post-login');

    // ── PANTALLA 1 ─────────────────────────────────────────────
    // (derivada de steps del plan)
    await ss('01-pantalla1-inicio');

    // Campos independientes primero (REGLA 3 de execution-rules.md)
    await setIfBlank(page, page.locator(SEL.s1.campo1), TEST_DATA.campo1);

    // Campos reactivos → waitForPageIdle (REGLA 3)
    await page.locator(SEL.s1.ddlReactivo).selectOption(TEST_DATA.tipo);
    await waitForPageIdle(page);

    // JS-Restricted → safeSetValue (REGLA 11)
    await safeSetValue(page, SEL.s1.campoJs, TEST_DATA.valorJs);

    // Diagnóstico pre-submit (REGLA 6)
    await logEmptyFields(page, '#form1', ss);
    await ss('01-antes-continuar');

    await clickContinuar(page, SEL.s1.continuar);

    // ── ASSERTION FINAL ────────────────────────────────────────
    // Assert duro SOLO en resultado final (REGLA 6)
    await expect(page.locator('#MainContent_lblResultado')).toBeVisible({ timeout: 15_000 });
    await ss('99-resultado-final');
  });

});
```

### Reglas del spec

- Screenshots: al inicio de cada pantalla + antes de cada Continuar + en errores (REGLA 9)
- Orden de llenado: independientes → reactivos+waitForPageIdle → dependientes (REGLA 3)
- `logEmptyFields` antes de cada Continuar — diagnóstico, no assert duro (REGLA 6)
- Assert duro SOLO en resultado final
- Si hay uploads → ver REGLA 8 de `execution-rules.md`

---

## PASO 6 — Verificar compilación

```bash
cd TPlans && npx tsc --noEmit
```

⛔ NO reportar "listo" si hay errores de TypeScript. Corregir antes de notificar al orquestador.

Los errores más comunes:
- `Type 'null' is not assignable` → agregar `!` o verificar existencia
- `Property does not exist` → revisar que el import del fixture es correcto
- `Cannot find module` → verificar ruta relativa del import

---

## PASO 7 — Actualizar session.json

Marcar el TC como `"status": "built"` y registrar la ruta del spec:
```json
{ "id": 9400, "status": "built", "phase": "code-builder", "spec": "TPlans/tests/9400-procesar-excel.spec.ts" }
```

---

## PASO 8 — Notificar al orquestador

```
✅ Code Builder completado para TC 9400
   Archivos generados:
     TPlans/fixtures/procesar-excel.fixture.ts
     TPlans/tests/9400-procesar-excel.spec.ts
   Compilación TypeScript: ✅ sin errores
   Siguiente agente: executor
   Comando de ejecución: npx playwright test TPlans/tests/9400-procesar-excel.spec.ts --headed
```

---

## Reglas críticas

- ⛔ NO abrir MCP Browser para "verificar selectores" — el discovery ya lo hizo
- ⛔ NO hardcodear credenciales en el fixture — usar `process.env`
- ⛔ NO reportar listo si `tsc --noEmit` tiene errores
- ⛔ NO duplicar helpers — copiarlos del `playwright-guide.md` una sola vez en el fixture
- ✅ Variante de `waitForPageIdle` según `wait_strategy` en `discovery-output.json`
- ✅ Campos `js_restricted: true` → `safeSetValue()` obligatorio
- ✅ Campos `reactive: true` → `waitForPageIdle()` después de interactuar
