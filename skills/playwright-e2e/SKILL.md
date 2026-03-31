---
name: playwright-e2e
description: 'Automatiza test cases manuales como pruebas E2E con Playwright + MCP Browser. Usar cuando el usuario pida crear, automatizar o generar tests E2E, pruebas automatizadas, scripts de Playwright, o convertir TCs manuales a código. Cubre descubrimiento de app vía browser MCP, Page Object con fixtures, manejo de ASP.NET WebForms, React, Vue, Angular, SPAs, Telerik, uploads, campos reactivos (AutoPostBack/onChange con fetch), diálogos AJAX, elementos trigger ocultos, diagnóstico de fallos y screenshots. REQUIERE que el usuario provea: TC IDs + URL de la app + credenciales + rutas de archivos de datos (si aplica).'
argument-hint: 'TC IDs + URL de la app (OBLIGATORIO) + credenciales + rutas de archivos. Ej: "TC 9360, 9361, URL: https://app.company.com, user: test1/pass123, Excel: C:\data\test.xlsx"'
---

# Automatización E2E con Playwright

Skill para convertir test cases manuales en pruebas E2E automatizadas con Playwright, usando el MCP Browser de Playwright para descubrimiento y depuración.

> **Input:** Un test case en lenguaje natural (pasos, datos, resultado esperado).
> **Output:** Un test E2E completo y funcional en Playwright, listo para ejecutar.

---

## ⛔ CHECKLIST DE DISCOVERY TECNOLÓGICO — OBLIGATORIO antes de FASE 1

> Este checklist debe completarse **antes de escribir una sola línea de código**.
> Cada pregunta sin responder es un error de asunción que costará múltiples prompts de corrección.

Ejecutar este script en MCP Browser en la primera pantalla de la app:

```js
const tech = {
  webforms: !!document.querySelector('#__VIEWSTATE'),
  telerik:  !!window.Telerik || !!document.querySelector('[class*="RadUpload"],[id*="RadCalendar"]'),
  react:    !!(window).__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!document.querySelector('[data-reactroot],#root'),
  vue:      !!(window).__vue_app__ || !!(window).Vue,
  angular:  !!(window).ng || !!document.querySelector('[ng-version]'),
  ajax:     !!document.querySelector('#__VIEWSTATE') && typeof Sys !== 'undefined',
};
console.log(JSON.stringify(tech));
```

Luego responder estas 5 preguntas antes de avanzar:

| # | Pregunta | Impacto si no se responde |
|---|---|---|
| 1 | ¿Qué tecnología usa el stack? (`webforms` / `react` / `vue` / `angular` / `telerik`) | Elegir variante incorrecta de `waitForPageIdle` → timeouts |
| 2 | ¿Hay campos reactivos en este formulario? (`onchange=__doPostBack` / `onChange fetch`) | Llenar campos en orden incorrecto → servidor los resetea |
| 3 | ¿Hay calendarios / date pickers? (¿Nativo `input[type=date]`? ¿Telerik RadDatePicker? ¿custom JS?) | `fill()` no funciona → campo queda vacío |
| 4 | ¿Hay upload de archivos? (¿Input nativo? ¿Telerik RadAsyncUpload? ¿Dropzone?) | `setInputFiles()` sin espera → upload no confirmado → Continuar falla |
| 5 | ¿Hay diálogos `confirm` / `alert` JS antes o después de acciones clave? | Dialog bloquea → test cuelga |

> Si la respuesta a cualquier pregunta 3, 4 o 5 es **sí** → leer el playbook correspondiente en
> la sección **TECHNOLOGY PLAYBOOKS** antes de escribir código.

---

## FASE 0 — Preparación del Entorno

### Estructura de Proyecto

```
proyecto/
├── playwright.config.ts
├── fixtures/
│   ├── <nombre-flujo>.fixture.ts
│   └── files/
│       └── dummy.pdf
├── helpers/
│   └── data-manager.ts
├── data/
│   └── test-data.json
├── tests/
│   └── <nombre-flujo>.spec.ts
└── package.json
```

### playwright.config.ts Base

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: '<URL_DEL_AMBIENTE>',
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

### Archivo Dummy para Uploads

Crear `fixtures/files/dummy.pdf` — un PDF mínimo válido (~300 bytes).

---

## FASE 0.5 — Preparar Entorno y Entregar Comando Codegen al Usuario

**Trigger:** El usuario pide automatizar un flujo y AÚN NO tiene código escrito — o el proyecto no existe todavía.

> El objetivo de esta fase es que el **usuario NO tenga que hacer nada técnico** para poder ejecutar Playwright Codegen. El agente monta el proyecto completo y le entrega un comando listo para copiar-pegar.

### Paso 1 — Verificar si el proyecto ya existe

```
¿Existe package.json con @playwright/test?  →  SÍ: saltar al Paso 3
                                            →  NO: ejecutar Paso 2
```

### Paso 2 — Crear el proyecto base

Ejecutar en terminal (en el directorio del workspace):

```bash
# Inicializar proyecto si no existe
npm init -y
npm install --save-dev @playwright/test typescript @types/node
npx playwright install chromium
```

Crear `playwright.config.ts` con baseURL de la app bajo prueba:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: '<URL_DEL_AMBIENTE>',  // ← rellenar con la URL real
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

Crear estructura de carpetas mínima:
```
tests/
fixtures/
fixtures/files/
```

### Paso 3 — Verificar que Playwright está instalado y listo

```bash
npx playwright --version
# Si falla → npx playwright install chromium
```

### Paso 4 — Entregar el comando Codegen al usuario

Una vez que el entorno está listo, **mostrar al usuario** el comando exacto para ejecutar:

```
╔══════════════════════════════════════════════════════════════════╗
║  ENTORNO LISTO — Ejecuta este comando para grabar el flujo:      ║
║                                                                  ║
║  npx playwright codegen --viewport-size=1280,720 \               ║
║    --save-storage=fixtures/auth.json \                           ║
║    <URL_DE_INICIO>                                               ║
║                                                                  ║
║  Cuando termines de grabar:                                      ║
║  1. Copia el código generado                                     ║
║  2. Pégalo aquí en el chat                                       ║
║  → El agente lo optimizará y lo convertirá en un test completo   ║
╚══════════════════════════════════════════════════════════════════╝
```

> Si la app requiere login primero, incluir la URL de login en el comando:
> ```bash
> npx playwright codegen --viewport-size=1280,720 <URL_LOGIN>
> ```

### Paso 5 — Dos caminos posibles después del codegen

```
Usuario pega el código codegen  →  Continuar con FASE 5 (Auditoría)
                                    → El agente analiza, optimiza selectores
                                    → y convierte en fixture + spec final

Usuario dice "sigue sin codegen" →  Continuar con FASE 1 (Descubrimiento)
                                    → El agente navega la app vía MCP y
                                    → construye el test desde cero
```

> ⛔ **El agente NUNCA debe pedir al usuario que instale dependencias, cree carpetas
> o configure nada.** Toda la preparación técnica es responsabilidad del agente.
> El único paso del usuario es ejecutar el comando codegen y pegar el resultado.

---

## FASE 1 — Descubrimiento de la Aplicación

**ANTES de escribir UNA SOLA línea de test**, explorar la app usando el MCP Browser de Playwright.

> ⛔ **REGLA ABSOLUTA — LOCATOR CATALOGUE FIRST**
> No se escribe ningún fixture ni spec hasta tener el catálogo completo de selectores de TODAS las pantallas del flujo.
> Cada selector DEBE resolverse en el orden de prioridad definido en REGLA 0.
> Un selector ambiguo o basado en texto es un bug en espera de ocurrir.

### Checklist de Descubrimiento

| Info | Cómo obtenerla |
|------|----------------|
| URL de cada pantalla | Navegar y anotar si cambia o es single-page |
| Tecnología frontend | Inspeccionar: ¿ASP.NET WebForms? ¿React SPA? ¿Angular? |
| Tipo de navegación | ¿Postback completo? ¿AJAX/UpdatePanel? ¿Client-side routing? |
| **IDs de todos los controles** | `Array.from(document.querySelectorAll('input,select,textarea,button,a')).map(e=>({tag:e.tagName,id:e.id,name:e.name,type:e.type,value:e.value,text:e.textContent?.trim().slice(0,40)}))` → copiar COMPLETO |
| **IDs de botones de navegación** | `Array.from(document.querySelectorAll('button,input[type=submit],input[type=button],a')).map(e=>({id:e.id,name:e.name,text:e.textContent?.trim(),onclick:e.getAttribute('onclick')}))` |
| Campos pre-llenados | ¿Qué campos llena el servidor automáticamente? |
| Campos con AutoPostBack | Ejecutar query de detección obligatorio (ver abajo) — marcar en SEL cuáles necesitan `waitForPageIdle` |
| Control de upload | ¿Input nativo? ¿Telerik RadAsyncUpload? ¿Dropzone? |
| Popups/modales | ¿Hay confirmaciones intermedias? |
| Validaciones cliente | ¿CustomValidators? ¿Required field validators? |
| Botones de navegación | Selector del botón Continuar/Siguiente/Enviar |

### Detección de Campos Reactivos — OBLIGATORIO en TODA tecnología

> **Concepto universal**: Un *campo reactivo* es cualquier campo (`input`, `select`, `textarea`) cuya interacción (change, blur) dispara una llamada al servidor que puede **resetear, rellenar o deshabilitar otros campos**. Existe en WebForms, React, Vue, Angular y cualquier otro framework.
>
> ⛔ **REGLA**: Ejecutar la detección en **cada pantalla con formularios**, antes de escribir código. Marcar cada campo reactivo en el SEL con `// ⚡ Reactivo` y aplicar `waitForPageIdle` después de interactuar con él.

#### Paso 1 — Detectar tecnología primero

```js
const tech = {
  webforms: !!document.querySelector('#__VIEWSTATE'),
  telerik:  !!window.Telerik,
  react:    !!document.querySelector('[data-reactroot], #root') && !!(window).__REACT_DEVTOOLS_GLOBAL_HOOK__,
  vue:      !!(window).__vue_app__ || !!(window).Vue,
  angular:  !!document.querySelector('[ng-version]') || !!(window).ng,
};
console.log(tech);
```

#### Paso 2 — Query de detección según tecnología

**ASP.NET WebForms** — buscar `__doPostBack` en atributos del DOM:
```js
Array.from(document.querySelectorAll('input, select, textarea'))
  .filter(e => ['onchange','onblur','onfocus','onclick']
    .some(a => (e.getAttribute(a) || '').includes('__doPostBack')))
  .map(e => ({ id: e.id, tag: e.tagName, type: e.type,
    onchange: e.getAttribute('onchange'), onblur: e.getAttribute('onblur') }));
```

**React / Vue / Angular** — los handlers están en el VDOM, no en atributos del DOM. Usar observación de red:
```ts
// En el spec, durante la exploración — registrar requests que disparan al interactuar con cada campo
const reactiveFields: string[] = [];
page.on('request', req => {
  if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
    console.log(`[XHR al interactuar] ${req.method()} ${req.url()}`);
  }
});
// Ahora interactuar con cada campo sospechoso individualmente y observar el log
// Si un campo dispara una request → es reactivo → marcarlo
```

**Universal (cualquier tecnología)** — observar el tráfico de red al llenar cada campo:
```ts
// Helper para detectar si una acción dispara requests
async function isReactive(page: Page, action: () => Promise<void>): Promise<boolean> {
  let fired = false;
  const handler = () => { fired = true; };
  page.on('request', handler);
  await action();
  await page.waitForTimeout(500); // ventana de detección
  page.off('request', handler);
  return fired;
}
// Uso: if (await isReactive(page, () => page.locator('#mySelect').selectOption('X'))) → reactivo
```

#### Paso 3 — Mapear al fixture y al spec

**En el fixture** — marcar cada campo reactivo:
```ts
export const SEL = {
  s1: {
    vinInput:      '#MainContent_ucCarRegistration_txtVIN',        // ⚡ Reactivo — llena datos del vehículo
    plate:         '#MainContent_ucCarRegistration_txtPlateNumber', // ⚡ Reactivo — resetea marbete
    licenseNumber: '#MainContent_ucCarRegistration_txtLicense',    // depende de vinInput
    sticker:       '#MainContent_ucCarRegistration_txtSticker',    // depende de plate
  },
};
```

**En el spec** — patrón obligatorio para cualquier campo reactivo:
```ts
// Patrón universal — campo reactivo → waitForPageIdle → campos dependientes
await page.locator(SEL.s1.vinInput).fill(vin);
await waitForPageIdle(page);                           // esperar que el servidor complete
await page.locator(SEL.s1.licenseNumber).fill(data.license); // campo que dependía del reactivo
```

### Detección de Tecnología

```js
// ASP.NET WebForms
!!document.querySelector('#__VIEWSTATE')
// ASP.NET con Telerik
!!window.Telerik || !!document.querySelector('[class*="RadUpload"]')
// React SPA
!!document.querySelector('#root') && !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
// Angular
!!window.ng || !!document.querySelector('[ng-version]')
```

---

## TECHNOLOGY PLAYBOOKS — Patrones por tecnología

> Si el discovery confirmó alguna de estas tecnologías, leer el playbook
> correspondiente COMPLETO antes de escribir el fixture.

---

### PLAYBOOK A — ASP.NET WebForms + Telerik

#### Señales de identificación
- `document.querySelector('#__VIEWSTATE')` → `true`
- `window.Telerik` → `true` o presencia de `[class*="RadCalendar"],[class*="RadUpload"]`

#### Patrón 1 — `waitForPageIdle` correcto para WebForms
```ts
async function waitForPageIdle(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => {
    const prm = (window as any).Sys?.WebForms?.PageRequestManager?.getInstance?.();
    return !prm || !prm.get_isInAsyncPostBack();
  }, { timeout });
}
```
> ⚠️ `networkidle` solo NO es suficiente en WebForms con UpdatePanel. Siempre combinar con `PageRequestManager`.

#### Patrón 2 — Campos que resetean otros (AutoPostBack)
```ts
// Detectar en MCP antes de codificar:
Array.from(document.querySelectorAll('select,input')).filter(e =>
  (e.getAttribute('onchange') || '').includes('__doPostBack')
).map(e => ({ id: e.id, onchange: e.getAttribute('onchange') }))

// En el spec — orden OBLIGATORIO:
await page.locator(SEL.campoReactivo).selectOption(valor);  // 1. campo reactivo
await waitForPageIdle(page);                                 // 2. esperar postback completo
await page.locator(SEL.campoDependiente).fill(valor2);      // 3. SOLO después del idle
```

#### Patrón 3 — Calendarios Telerik RadDatePicker
```ts
// ❌ fill() NO funciona con Telerik RadDatePicker
// ✅ Usar evaluate() para setear el valor directamente en el input de texto del picker
async function setRadDatePicker(page: Page, selector: string, dateStr: string): Promise<void> {
  // dateStr en formato que el picker acepta, ej: '3/31/2026' o '31/3/2026'
  // Verificar formato en MCP: document.getElementById('ID').value
  const rawId = selector.startsWith('#') ? selector.slice(1) : selector;
  await page.evaluate((args: { id: string; val: string }) => {
    const el = document.getElementById(args.id) as HTMLInputElement;
    if (!el) return;
    el.value = args.val;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }, { id: rawId, val: dateStr });
  await waitForPageIdle(page);
}

// Para seleccionar la fecha de hoy en un RadDatePicker:
async function selectToday(page: Page, selector: string): Promise<void> {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  // Probar primero MM/DD/YYYY, ajustar si el picker usa otro formato
  await setRadDatePicker(page, selector, `${mm}/${dd}/${yyyy}`);
}
```
> ⚠️ Verificar el formato de fecha aceptado por el picker en MCP antes de hardcodear.
> Ejecutar: `document.getElementById('ID_DEL_PICKER').value` después de seleccionar manualmente.

#### Patrón 4 — Campos JS-RESTRICTED (oninput/onkeypress validadores)
```ts
// Detectar en MCP:
Array.from(document.querySelectorAll('input[oninput],input[onkeypress]'))
  .map(e => ({ id: e.id, oninput: e.getAttribute('oninput'), onkeypress: e.getAttribute('onkeypress') }))

// Si tiene validator → fill() deja el campo vacío → usar evaluate:
async function safeSetValue(page: Page, selector: string, value: string): Promise<void> {
  const loc = page.locator(selector);
  await loc.click();
  await loc.fill(value);
  const current = await loc.inputValue().catch(() => '');
  if (!current || current.replace(/[^a-zA-Z0-9]/g, '') === '') {
    const rawId = selector.startsWith('#') ? selector.slice(1) : selector;
    await page.evaluate((args: { id: string; val: string }) => {
      const el = document.getElementById(args.id) as HTMLInputElement;
      if (!el) return;
      el.value = args.val;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { id: rawId, val: value });
  }
}
```

---

### PLAYBOOK B — React / Vue / Angular (SPA)

#### Señales de identificación
- React: `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` o `document.querySelector('[data-reactroot],#root')`
- Vue: `window.__vue_app__` o `window.Vue`
- Angular: `window.ng` o `document.querySelector('[ng-version]')`

#### Patrón 1 — `waitForPageIdle` correcto para SPA
```ts
async function waitForPageIdle(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll(
      '.spinner,.loading,[class*="skeleton"],[class*="loading"],[aria-busy="true"]'
    );
    return spinners.length === 0 ||
      Array.from(spinners).every(el => (el as HTMLElement).offsetParent === null);
  }, { timeout: 5_000 }).catch(() => {});
}
```

#### Patrón 2 — Campos reactivos en SPA (onChange → fetch)
```ts
// Los handlers están en el VDOM — no aparecen en atributos del DOM.
// Detectar observando el tráfico de red al interactuar manualmente en MCP:
page.on('request', req => {
  if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch')
    console.log(`[SPA XHR] ${req.method()} ${req.url()}`);
});
// Llenar el campo sospechoso → si aparece un XHR → es reactivo → aplicar waitForPageIdle después
```

#### Patrón 3 — Date pickers custom en SPA
```ts
// La mayoría de date pickers SPA (MUI DatePicker, Vuetify, ng-datepicker)
// sí responden a fill() en su input interno, pero requieren blur para confirmar:
const dateInput = page.locator('[data-testid="date-input"], input[placeholder*="fecha"], input[type="date"]');
await dateInput.fill(dateStr);  // formato ISO: 'YYYY-MM-DD'
await dateInput.press('Tab');   // blur para disparar onChange
await waitForPageIdle(page);

// Si fill() no funciona → usar keyboard:
await dateInput.click();
await dateInput.type(dateStr);
await dateInput.press('Enter');
```

#### Patrón 4 — Errores visibles post-submit en SPA
```ts
// Los errores en SPA no usan aspNetValidationSummary — buscar por aria-invalid:
const errors = page.locator('[aria-invalid="true"], .error-message, [class*="error"][class*="text"]');
const errorCount = await errors.count();
if (errorCount > 0) {
  const msgs = await errors.allTextContents();
  console.warn('[SPA Errors]', msgs);
}
```

---

### PLAYBOOK C — Tabla de señales de Upload por widget

Antes de codificar el upload, identificar el tipo en MCP:

| Widget | Señal en el DOM | `setInputFiles()` directo | Necesita `waitForResponse` | Delay entre uploads |
|---|---|---|---|---|
| Input nativo `<input type="file">` | `input[type="file"]` visible o hidden | ✅ sí | ❌ no | ❌ no |
| Telerik RadAsyncUpload | `[class*="RadUpload"],[class*="ruInputs"]` | ✅ sí (en el input interno) | ✅ sí — `WebResource.axd` | ✅ **1.5s obligatorio** |
| Telerik RadUpload (sync) | `[class*="RadUpload"]` sin XHR | ✅ sí | ❌ no (submit final) | ❌ no |
| Dropzone.js / FilePond | `[class*="dropzone"],[class*="filepond"]` | ✅ sí (input oculto interno) | depende del config | ❌ no |
| AWS S3 presigned upload | form `action` con `s3.amazonaws.com` | ✅ sí | ✅ sí — URL s3 | ❌ no |
| Custom AJAX `<input>` | XHR a API propia al `change` | ✅ sí | ✅ sí — endpoint propio | ❌ no |

**Confirmación de upload exitoso — buscar en MCP la señal correcta para este widget:**
```js
// ¿Qué cambia en el DOM cuando el upload termina?
// - ¿Aparece el nombre del archivo en alguna celda/span?
// - ¿Desaparece el input y aparece un botón de eliminar?
// - ¿Cambia el texto de un label?
// Ejecutar ANTES y DESPUÉS de subir manualmente para ver la diferencia.
Array.from(document.querySelectorAll('[id*="upload"],[id*="document"],[id*="file"]'))
  .map(e => ({ id: e.id, text: e.textContent?.trim().slice(0,40), visible: e.offsetParent !== null }))
```

---

## FASE 2 — Arquitectura del Test

### Fixture File (Page Object simplificado)

Cada flujo tiene UN fixture en `fixtures/<nombre>.fixture.ts`:

```ts
import { Page, Locator, TestInfo, expect } from '@playwright/test';
import * as path from 'node:path';

export const DUMMY_PDF = path.join(__dirname, 'files', 'dummy.pdf');

export const TEST_DATA = {
  // Todos los valores del test case van aquí
};

export const SEL = {
  continuar: '#selector-del-boton-continuar',
  // Pantalla 1
  s1: {
    campo1: '#id-campo-1',
    campo2: '#id-campo-2',
  },
  // Pantalla 2...
};
```

### Spec File

```ts
import { test as base, expect } from '@playwright/test';
import { SEL, TEST_DATA } from '../fixtures/mi-flujo.fixture';

const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('#user', 'usuario');
    await page.fill('#pass', 'password');
    await page.click('#loginBtn');
    await page.waitForURL('**/dashboard*');
    await use(page);
  },
});

test.describe('Mi Flujo E2E', () => {
  test('debe completar el flujo completo', async ({ authenticatedPage: page }, testInfo) => {
    const ss = async (name: string) => {
      const buf = await page.screenshot({ fullPage: true });
      await testInfo.attach(name, { body: buf, contentType: 'image/png' });
    };
    // ... pantallas del flujo
  });
});
```

---

## FASE 3 — Reglas de Implementación

### REGLA 0 — Prioridad OBLIGATORIA de Localizadores ⚠️ BLOQUEANTE

Cada selector en el fixture **debe seguir esta jerarquía estrictamente**. No se avanza al siguiente nivel hasta confirmar que el anterior no existe.

| Prioridad | Tipo | Ejemplo | Condición de uso |
|-----------|------|---------|------------------|
| **1 — ID único** | `#id` | `#MainContent_btnUploadExcel` | Existe `id` en el HTML ✅ **USAR SIEMPRE** |
| **2 — Name único** | `[name="x"]` | `[name="txtUser"]` | Existe `name` y es único en página |
| **3 — Data attribute** | `[data-x="y"]` | `[data-action="submit"]` | Existe atributo `data-*` semántico |
| **4 — Aria/role** | `role + name` | `getByRole('button', {name:'...'})` | El elemento tiene role y label accesible |
| **5 — Value exacto** | `input[value="x"]` | `input[value="Volver al Paso 1"]` | Solo cuando no hay ID ni name |
| **6 — CSS específico** | `form #id > input` | `#divForm input[type=text]` | Combinación estructural estable |
| **7 — Texto visible** | `:text("x")` / `has-text` | `button:has-text("Procesar")` | ⚠️ ÚLTIMO RECURSO — frágil ante i18n y cambios de UI |

#### Procedimiento OBLIGATORIO antes de escribir cualquier selector

```js
// Ejecutar en MCP Browser en CADA pantalla relevante
// Paso 1 — Inventariar TODOS los controles interactivos con ID
Array.from(document.querySelectorAll('[id]'))
  .filter(e => ['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(e.tagName))
  .map(e => ({ id: e.id, tag: e.tagName, type: e.type, value: e.value, text: e.textContent?.trim().slice(0,40) }))

// Paso 2 — Para botones SIN ID, buscar name o value
Array.from(document.querySelectorAll('button:not([id]), input[type=button]:not([id]), input[type=submit]:not([id])'))
  .map(e => ({ tag: e.tagName, name: e.name, value: e.value, text: e.textContent?.trim() }))

// Paso 3 — Para links SIN ID
Array.from(document.querySelectorAll('a:not([id])'))
  .map(e => ({ href: e.href, text: e.textContent?.trim(), onclick: e.getAttribute('onclick') }))
```

#### Regla de oro para botones (caso raíz de este cambio)

> Si un botón tiene `id`, **SIEMPRE** usar `#id`.
> Si el botón NO tiene `id` pero SÍ tiene `value`, usar `input[value="texto exacto"]`.
> `button:has-text("...")` **SOLO** si no existe ningún atributo estable.
> Click vía `page.evaluate(() => el.click())` cuando hay overlays o menús de navegación expandibles que impiden el click nativo.

#### Formato del catálogo en el fixture

```ts
export const SEL = {
  // ── PANTALLA N — <nombre> ──────────────────────────────
  // LOCATOR_EVIDENCE: id="MainContent_btnUploadExcel" confirmado via JS eval
  pantallaN: {
    btnProcesar:      '#MainContent_btnUploadExcel',        // ID único ✅ PRIORITY 1
    btnCancelar:      '#MainContent_btnCancelBatch',        // ID único ✅ PRIORITY 1
    btnVolver:        'input[value="Volver al Paso 1"]',    // sin ID → value ✅ PRIORITY 5
    btnMenuExternal:  null, // sin ID ni value → click via page.evaluate() buscando textContent
  },
};
```

> ⛔ **PROHIBIDO** usar `button:has-text(...)` o `:text(...)` para ningún elemento que tenga `id`, `name` o `value` estable.

### REGLA 1 — Esperar SIEMPRE antes de actuar

> La implementación de `waitForPageIdle` depende de la tecnología detectada en FASE 1.
> Usar la variante correcta para el framework — NO mezclarlas.

**Paso 1 — Detectar tecnología** (ya hecho en FASE 1, usar el resultado):

```
webforms: true  → usar Variante A
react/vue/angular: true → usar Variante B
tecnología desconocida → usar Variante C (universal)
```

**Variante A — ASP.NET WebForms / UpdatePanel:**
```ts
async function waitForPageIdle(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => {
    const prm = (window as any).Sys?.WebForms?.PageRequestManager?.getInstance?.();
    return !prm || !prm.get_isInAsyncPostBack();
  }, { timeout });
}
```

**Variante B — SPAs (React / Vue / Angular) — esperar que desaparezcan indicadores de carga:**
```ts
async function waitForPageIdle(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll(
      '.spinner, .loading, [class*="skeleton"], [class*="loading"], [aria-busy="true"]'
    );
    return spinners.length === 0 || Array.from(spinners).every(
      el => (el as HTMLElement).offsetParent === null
    );
  }, { timeout }).catch(() => {}); // no fallar si no hay spinners
}
```

**Variante C — Universal (tecnología desconocida o múltiple):**
```ts
async function waitForPageIdle(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  // Intentar WebForms + spinners como cobertura amplia
  await Promise.all([
    page.waitForFunction(() => {
      const prm = (window as any).Sys?.WebForms?.PageRequestManager?.getInstance?.();
      return !prm || !prm.get_isInAsyncPostBack();
    }, { timeout: 3_000 }).catch(() => {}),
    page.waitForFunction(() => {
      return !document.querySelector('.spinner, .loading, [aria-busy="true"]');
    }, { timeout: 3_000 }).catch(() => {}),
  ]);
}
```

### REGLA 2 — No sobrescribir campos pre-llenados

```ts
async function setIfBlank(
  page: Page,
  locator: Locator,
  value: string,
  opts: { isSelect?: boolean; allowZero?: boolean } = {},
): Promise<void> {
  const current = await locator.inputValue();
  const blank = !current || current === '' || current === 'Seleccionar';
  const zero = !opts.allowZero && ['0', '$0', '0.00', '$0.00'].includes(current);
  if (!blank && !zero) return;

  if (opts.isSelect) {
    await locator.selectOption(value);
    await waitForPageIdle(page);
  } else {
    await locator.evaluate((el, val) => {
      (el as HTMLInputElement).value = val;
    }, value);
  }
}
```

### REGLA 3 — Orden de llenado en páginas con Campos Reactivos

> Aplica a cualquier tecnología (WebForms, React, Vue, Angular). El principio es el mismo: un campo reactivo dispara una operación asíncrona que puede resetear o rellenar otros campos.

1. Identificar campos reactivos (FASE 1 — Detección de Campos Reactivos)
2. Llenar primero los campos que NO son reactivos ni dependen de otros
3. Llenar campos reactivos y hacer `waitForPageIdle` después de cada uno
4. Llenar DESPUÉS los campos que dependen del resultado del campo reactivo
5. Campos que el servidor puede resetear → llenar siempre al FINAL, tras confirmar que no hay más postbacks pendientes

**Orden recomendado en formularios típicos:**
```
1. Selects independientes (categorías, tipos — sin dependencias)
2. Campos de texto independientes (precio, descripción)
3. ⚡ Campos reactivos (e.g. VIN lookup, plate lookup) → waitForPageIdle después de cada uno
4. Campos que el reactivo puede rellenar/resetear (e.g. datos del vehículo, marbete)
5. Date pickers (si disparan events, tratar como reactivos)
6. Campos que dependen de los date pickers → llenar al final
```

### REGLA 4 — Click seguro en botones de navegación

```ts
async function waitForClickable(locator: Locator, timeout = 10_000): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toBeEnabled({ timeout });
}

async function clickContinuar(page: Page): Promise<void> {
  await waitForPageIdle(page);
  await waitForClickable(page.locator(SEL.continuar));
  await page.locator(SEL.continuar).click();
}
```

### REGLA 5 — Validación pre-submit

Antes de click en Continuar/Enviar, diagnosticar campos vacíos:

```ts
const invalidFields = await page.evaluate(() => {
  const ALLOWED_ZERO = ['txtOdometer'];
  const ALLOWED_EMPTY = ['txtOptional'];
  const INVALID = (id: string, v: string) => {
    if (ALLOWED_EMPTY.some(k => id.includes(k))) return false;
    if (!v || v === '' || v === 'Seleccionar') return true;
    if (['$0', '0.00', '$0.00'].includes(v)) return true;
    if (v === '0' && !ALLOWED_ZERO.some(k => id.includes(k))) return true;
    return false;
  };
  const els = document.querySelectorAll(
    'input[type="text"]:not([disabled]):not([readonly]), select:not([disabled])'
  );
  return Array.from(els)
    .filter(el => (el as HTMLElement).offsetParent !== null)
    .filter(el => INVALID(el.id, (el as HTMLInputElement).value))
    .map(el => ({ id: el.id, value: (el as HTMLInputElement).value }));
});
expect(invalidFields, `Campos inválidos: ${JSON.stringify(invalidFields)}`).toHaveLength(0);
```

### REGLA 6 — Diagnóstico cuando Continuar no avanza

1. Buscar errores visibles:
```ts
const errors = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[class*="error"], [class*="alert"], [style*="color: red"]'))
    .filter(el => (el as HTMLElement).offsetParent !== null)
    .map(el => el.textContent?.trim())
);
```
2. Buscar validators ASP.NET activos
3. Tomar screenshot y corregir
4. **NUNCA** repetir click sin corregir primero

### REGLA 7 — Datos consumibles (Pool Pattern)

```ts
// helpers/data-manager.ts
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.resolve(__dirname, '../data/test-data.json');

export function consumeItem(key: string): string {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  if (!data.available[key] || data.available[key].length === 0) {
    throw new Error(`No hay items para '${key}'. Agrega más a ${DATA_FILE}.`);
  }
  const item = data.available[key].shift()!;
  data.used[key] = data.used[key] || [];
  data.used[key].push(item);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return item;
}
```

### REGLA 8 — Diálogos `window.confirm` / `window.alert` — 3 Patrones

> ⚠️ **Identificar PRIMERO** si el diálogo dispara **sincrónicamente** (al hacer click el JS llama confirm() inmediatamente) o **después de AJAX** (el servidor responde con `requiresConfirmation: true` y el JS llama confirm() al procesar la respuesta).

#### Patrón A — Diálogo SÍNCRONO (dispara durante el click)
```ts
// Registrar handler ANTES del click
page.once('dialog', async (dialog) => {
  const msg = dialog.message();
  await dialog.accept(); // o dismiss()
});
await page.locator('#btnProcesar').click();
await waitForPageIdle(page);
```

#### Patrón B — Diálogo AJAX (dispara DESPUÉS de respuesta del servidor) ⚠️ COMÚN EN ASP.NET
```ts
// ❌ INCORRECTO con page.once — el dialog llega después de networkidle
// y page.once ya no está activo

// ✅ CORRECTO — Promise.all garantiza que el listener está activo cuando llega el dialog
const [dialog] = await Promise.all([
  page.waitForEvent('dialog', { timeout: 20_000 }),
  page.locator('#btnCrear').click(),
]);
const msg = dialog.message();
console.log(`[Dialog] ${dialog.type()}: ${msg.slice(0, 120)}`);
await dialog.accept(); // o dismiss()
await waitForPageIdle(page);
```
> **Cómo detectarlo:** Si el botón hace un fetch/XHR y en el response handler hay `if (result.requiresConfirmation) confirm(msg)`, es Patrón B.

#### Patrón C — Dos diálogos en secuencia (confirm → AJAX → alert) ⚠️
```ts
// D1 = primer confirm (síncrono al click)
// D2 = alert de error/éxito que dispara el servidor después de aceptar D1

let msgD1 = '', msgD2 = '';
page.once('dialog', async (d1) => {
  msgD1 = d1.message();
  // Registrar D2 DENTRO de D1, ANTES de d1.accept()
  // Así el listener está listo cuando AJAX dispara D2
  page.once('dialog', async (d2) => {
    msgD2 = d2.message();
    await d2.accept();
  });
  await d1.accept(); // Esto desencadena la AJAX que dispara D2
});
await page.locator('#btnFinalizar').click();
await waitForPageIdle(page);
expect(msgD1).toContain('¿Está seguro?');
expect(msgD2).toContain('Error esperado');
```

#### Para modales/popups del framework (no window.confirm):
```ts
const confirmBtn = page.locator('#btnConfirm');
await waitForClickable(confirmBtn, 30_000);
await confirmBtn.click();
await waitForPageIdle(page);
```

### REGLA 8b — Elementos Trigger Ocultos ⚠️

> Existe en **cualquier framework**: botones o inputs `display:none` que son disparados programáticamente por JavaScript (timers, callbacks AJAX, polling). El usuario nunca los ve ni los clickea — son disparadores internos del framework.
>
> - **ASP.NET WebForms**: `input[type=submit]` oculto que llama `__doPostBack`
> - **React/Vue**: `<button>` oculto que `formRef.current.requestSubmit()` dispara
> - **Angular**: `input` oculto conectado a un `FormGroup.submit()` programático

**Síntoma universal:** `await expect(page.locator('#btnX')).toBeVisible()` → timeout perpetuo.

**Diagnóstico:**
```js
// Verificar si el elemento existe pero está oculto
const el = document.getElementById('btnX') || document.querySelector('[data-action="trigger"]');
console.log({
  exists:  !!el,
  display: el?.style.display,        // 'none' → oculto intencionalmente
  type:    el?.type,
  onclick: el?.getAttribute('onclick'),
  // WebForms: buscar __doPostBack
  // React: buscar en bundle si hay .click() programático sobre este ID
});
```

**Solución universal:** NO clickear el elemento oculto. **Esperar el resultado** de la operación que dispara:
```ts
// ❌ INCORRECTO — este elemento nunca será visible
await expect(page.locator('#MainContent_btnLoadResults')).toBeVisible({ timeout: 30_000 });
await page.locator('#MainContent_btnLoadResults').click();

// ✅ CORRECTO — esperar directamente el contenido que aparece tras la operación
await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 120_000 });
// O el siguiente botón/panel que la operación habilita
await expect(page.locator('#MainContent_btnVerResultados')).toBeVisible({ timeout: 120_000 });
```

> **Timeout largo para procesamiento:** Si el elemento trigger opera después de un proceso
> asíncrono (polling, colas de trabajo, procesamiento batch), usar timeout de 60–120 segundos
> en el `expect` del resultado, no intentar interactuar con el trigger.

---

### REGLA 9 — Screenshots en cada paso

```ts
const ss = async (name: string) => {
  const buf = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body: buf, contentType: 'image/png' });
};
await ss('s1-inicio');
// ... llenar screen 1
await ss('s1-antes-continuar');
await clickContinuar(page);
await ss('s2-inicio');
```

### REGLA 10 — File Uploads

#### Paso 0 — Descubrimiento obligatorio antes de escribir código (MCP Browser)

Antes de escribir NADA, navegar a la pantalla de documentos en MCP Browser y ejecutar:

```js
// 1. Entender la estructura de la tabla de documentos
Array.from(document.querySelectorAll('tr')).filter(tr => tr.querySelector('input[type="file"]')).map(tr => ({
  id: tr.id,
  cells: Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim().slice(0,30)),
  inputId: tr.querySelector('input[type="file"]')?.id,
}))

// 2. Identificar cuál columna marca el campo requerido (ej: 'X', '*', 'SI', etc.)
// 3. Verificar si hay control Telerik:
!!document.querySelector('[class*="RadUpload"],[class*="ruInputs"],[id*="RadUpload"]')
```

Resultado esperado antes de proceder:
- Sé el selector de cada fila de documento (`tr[id^="gvwDocuments_tr_"]` o similar)
- Sé qué columna (índice) indica si el documento es requerido y qué valor tiene (`X`, `*`, `Sí`, etc.)
- Sé el `id` del `input[type="file"]` dentro de cada fila
- Sé si es Telerik RadAsyncUpload o input nativo

---

#### Paso 1 — Detectar filas requeridas dinámicamente

> ⚠️ NUNCA hardcodear los IDs de los inputs de upload. La cantidad y el ID de cada fila
> pueden variar por configuración del servidor. Siempre descubrirlas en runtime.

```ts
// Ajustar el selector de fila y el índice de columna según lo descubierto en MCP
const requiredRows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('tr[id^="gvwDocuments_tr_"]'))
    .filter(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      // cells[2] = columna "Requerido" — verificar índice correcto en MCP
      return cells[2]?.textContent?.trim() === 'X' && !!tr.querySelector('input[type="file"]');
    })
    .map(tr => ({
      rowId:   tr.id,
      inputId: (tr.querySelector('input[type="file"]') as HTMLInputElement)?.id ?? '',
    }))
);
console.log(`[Upload] requeridos: ${requiredRows.map(r => r.rowId).join(', ')}`);
```

---

#### Paso 2 — Upload con confirmación real

**Tipo A — Input nativo (confirmar por cambio en texto de la celda):**
```ts
for (const { rowId, inputId } of requiredRows) {
  const input = page.locator(`#${inputId}`);
  if (await input.count() === 0) { console.log(`[Upload SKIP] ${rowId}: ya subido o sin input`); continue; }

  await input.setInputFiles(DUMMY_PDF, { timeout: 8_000 });

  // Confirmación real: esperar que la celda "Archivo" (cells[1]) muestre el nombre del archivo
  await page.waitForFunction(
    (id: string) => {
      const row = document.getElementById(id);
      if (!row) return false;
      const cells = Array.from(row.querySelectorAll('td'));
      const archivo = cells[1]?.textContent?.trim() ?? '';
      return archivo !== '' && !archivo.toLowerCase().includes('drop');
    },
    rowId,
    { timeout: 30_000 },
  );
  console.log(`[Upload ✓] ${rowId}`);
}
```

**Tipo B — Telerik RadAsyncUpload (esperar XHR `WebResource.axd` + confirmar celda):**
```ts
for (const { rowId, inputId } of requiredRows) {
  const input = page.locator(`#${inputId}`);
  if (await input.count() === 0) { continue; }

  // Registrar listener ANTES del setInputFiles
  const uploadDone = page.waitForResponse(
    resp => resp.url().includes('WebResource.axd') && resp.status() === 200,
    { timeout: 30_000 },
  );
  await input.setInputFiles(DUMMY_PDF);
  await uploadDone;  // esperar que el servidor procese el temp file

  // Confirmación adicional: celda de nombre de archivo no vacía
  await page.waitForFunction(
    (id: string) => {
      const row = document.getElementById(id);
      const cells = Array.from(row?.querySelectorAll('td') ?? []);
      const archivo = cells[1]?.textContent?.trim() ?? '';
      return archivo !== '' && !archivo.toLowerCase().includes('drop');
    },
    rowId,
    { timeout: 15_000 },
  );

  // ⚠️ CRÍTICO para Telerik: esperar 1.5s entre uploads para que los temp files
  // del servidor tengan timestamps distintos y no colisionen en App_Data\\RadUploadTemp
  await page.waitForTimeout(1500);
  console.log(`[Upload Telerik ✓] ${rowId}`);
}
```

**Tipo C — Dropzone / drag-and-drop:**
```ts
// Buscar el input oculto dentro del dropzone y usar setInputFiles directamente
const input = page.locator('.dropzone input[type="file"], [data-upload] input[type="file"]').first();
await input.setInputFiles('fixtures/files/dummy.pdf');
```

---

#### Paso 3 — Validar conteo antes de continuar

```ts
const totalRequeridos = requiredRows.length;
const totalSubidos = /* contador de los que confirmaron */ uploadedCount;
console.log(`[Upload] ${totalSubidos}/${totalRequeridos} confirmados`);
// No hacer assert duro aquí — si el servidor rechazó alguno, el Continuar lo marcará
```

---

#### Señales de error a detectar en pantalla post-upload

Antes del click Continuar, verificar con MCP si hay mensajes de error:
```js
// Buscar mensajes de error/validación visibles en la tabla de documentos
Array.from(document.querySelectorAll('[class*="error"],[class*="alert"],[class*="validation"],[aria-invalid]'))
  .filter(e => e.offsetParent !== null)
  .map(e => ({ id: e.id, text: e.textContent?.trim().slice(0,80) }))
```

### REGLA 11 — Checkboxes con click real

```ts
await page.locator('#myCheckbox').click();
await expect(page.locator('#myCheckbox')).toBeChecked();
```

### REGLA 12 — Anotar resultados en el reporte

```ts
testInfo.annotations.push({
  type: 'Resultado',
  description: 'Número de referencia: 20260321-1234',
});
```

---

## FASE 4 — Flujo de Trabajo al Recibir un Test Case

```
1. Leer el TC completo → pantallas, campos, datos, validaciones, resultado esperado
   ↓
2. Descubrimiento → MCP Browser → checklist FASE 1
   │
   ├─ Por CADA pantalla del flujo:
   │   1. Ejecutar el JS de inventario de la REGLA 0
   │   2. Anotar: id | name | value | tag | texto visible
   │   3. Asignar PRIORIDAD (1→7) a cada locator encontrado
   │   4. Documentar en el fixture con comentario // ID único ✅ PRIORITY N
   │
   └─ ⛔ NO pasar al paso 3 hasta tener el 100% de selectores catalogados
   ↓
2.5 Verificación en vivo — ⛔ BLOQUEANTE antes de construir
   Con el catálogo de selectores completo, usar MCP Browser para recorrer el flujo
   SIN escribir código — solo confirmando que cada selector responde en el DOM real:
   │
   ├─ Por cada selector del catálogo:
   │   1. `document.querySelector('#el-id')` → ¿retorna el elemento?
   │   2. Para campos reactivos: interactuar y observar si dispara el request esperado
   │   3. Para botones de navegación: verificar visible + enabled
   │   4. Para uploads: verificar que input file existe y es accesible
   │
   ├─ Si un selector NO responde:
   │   → Investigar causa (iframe? shadow DOM? carga dinámica? condicional?)
   │   → Corregir el selector en el catálogo
   │   → Re-verificar hasta que responda
   │
   └─ ⛔ NO avanzar a construcción hasta que el 100% de selectores estén verificados en vivo
        Un selector que falla aquí fallará en el test — mejor resolverlo antes de codificar
   ↓
3. Crear archivos:
   - fixtures/<nombre>.fixture.ts (SEL + TEST_DATA + helpers)
   - tests/<nombre>.spec.ts
   - data/test-data.json (si datos consumibles)
   - fixtures/files/dummy.pdf (si uploads)
   ↓
4. Implementar fixture → selectores con prioridad confirmada, datos, helpers
   ↓
5. Implementar spec:
   - Login fixture
   - Para CADA pantalla:
     · ss('sN-inicio')
     · Selects primero, textos después
     · ss('sN-antes-continuar')
     · Validación pre-submit
     · Click continuar
     · Esperar siguiente pantalla
   ↓
6. Primera ejecución: npx playwright test mi-flujo --headed --reporter=list
   ↓
7. Si falla:
   a. Leer el reporte HTML + screenshots adjuntos → entender estado visual
   b. Leer el error exacto del terminal
   c. ⛔ ANTES de tocar el código — volver a MCP Browser con los selectores guardados:
      → Navegar a la pantalla donde falló
      → Verificar el selector que falló: `document.querySelector('#id')` → ¿responde?
      → Si es campo reactivo: interactuar y observar si el request se dispara
      → Si es resultado esperado: ¿apareció en el DOM? ¿con qué selector real?
      → Reproducir manualmente la acción fallida y observar
   d. Solo con causa clara y confirmada en el DOM real → corregir → re-ejecutar
   e. NUNCA refactorizar ni hacer fix sin diagnóstico previo confirmado en MCP
   f. NUNCA repetir el mismo click/acción sin cambio previo
```

---

## ANTI-PATRONES — NUNCA hacer esto

| Anti-patrón | Por qué falla | Solución |
|-------------|---------------|-----------|
| **Usar `button:has-text(...)` cuando el botón tiene `id`** | Texto puede cambiar; overlays de menú bloquean el click nativo causando timeout | Usar `#id` siempre (PRIORIDAD 1). Si botón está en nav con hover, usar `page.evaluate(() => btn.click())` |
| **No inventariar locators antes de escribir el fixture** | Selectors frágiles → tests que rompen por cualquier cambio de UI | Ejecutar JS de REGLA 0 en CADA pantalla ANTES de codificar |
| **No documentar la prioridad del locator en el fixture** | Nadie sabe por qué se eligió ese selector; difícil de debuguear | Agregar comentario `// ID único ✅ PRIORITY 1` |
| **Inferir URL de contexto de conversación anterior** | Cada sesión es independiente; URL incorrecta → fallos silenciosos | Pedir URL explícitamente si no está en el TC |
| **`page.once('dialog')` para diálogos AJAX** | El dialog llega DESPUÉS de networkidle; el listener ya no existe | Usar `Promise.all([waitForEvent('dialog'), click()])` (REGLA 8 Patrón B) |
| **Intentar `.click()` o esperar `.toBeVisible()` en botón `display:none`** | Botón hidden es un trigger PostBack auto-disparado por JS, nunca visible | Esperar el panel/sección resultante (REGLA 8b) |
| **Usar `page.once` para múltiples diálogos en secuencia** | Solo captura el primero; el segundo causa `UnhandledPromiseRejection` | Patrón C nested (REGLA 8) |
| **Correr la suite completa sin validar cada TC individualmente** | Un fallo bloquea todo; no se identifica la causa raíz | Ejecutar `--grep "TC XXXX"` por TC hasta que pase, luego suite completa |
| Llenar campos sin verificar si ya tienen valor | Servidor pre-llena datos del catálogo | `setIfBlank()` |
| Llenar textos ANTES que selects con AutoPostBack | Postback resetea textos | Selects primero, textos después |
| `setInputFiles()` sin esperar respuesta del servidor | Archivo no se sube realmente | `waitForResponse()` del endpoint |
| Repetir click en Continuar sin diagnóstico | Validación falla, repetir no cambia nada | Buscar errores, corregir, reintentar |
| `page.evaluate()` para leer inputs | Postback en vuelo puede crashear | `locator.inputValue()` |
| Asignar checkbox con JS (`checked = true`)` | No dispara eventos ASP.NET | `locator.click()` |
| Asumir `networkidle` = página lista en ASP.NET | UpdatePanel tiene AJAX sin network visible | Verificar `PageRequestManager` |
| Timeouts fijos (`page.waitForTimeout(5000)`) | Frágil y lento | Esperar condiciones reales |
| No tomar screenshots en cada pantalla | Sin contexto visual al fallar | `ss('nombre')` en cada transición |
| Crear nueva instancia browser MCP por cada inspect | Lento e innecesario | Reutilizar sesión existente |

---

## FASE 5 — Auditoría de Código Existente (Codegen → Optimizado)

**Trigger:** El usuario pega código Playwright ya escrito — de Playwright Codegen, de una sesión anterior, o parcialmente manual.

> Si el proyecto aún no existe o no está configurado, ejecutar **FASE 0.5 primero**
> para dejar el entorno listo antes de recibir el código del usuario.

**Este flujo es diferente al flujo desde-cero:** el código existente es el punto de partida, no los TCs.

> ⛔ **REGLA ABSOLUTA — EL CODEGEN ES EL MAPA, NO LA FUENTE DE SELECTORES**
>
> El código de Playwright Codegen identifica QUÉ pantallas y QUÉ interacciones existen.
> **NO es una fuente confiable de selectores** — puede usar clases CSS, `getByText()`,
> nth-child, o IDs desactualizados que fallarán en ejecución.
>
> **ANTES de escribir una sola línea de fixture:**
> 1. Navegar CADA pantalla del flujo con MCP Browser
> 2. Ejecutar el JS inventory (REGLA 0) para obtener los IDs reales del DOM
> 3. Si el codegen usó una clase CSS → buscar el `id` del mismo elemento en el DOM real
> 4. Solo entonces asignar selectores en el fixture
>
> ⛔ **PROHIBIDO** copiar selectores del codegen o de archivos YAML/config sin verificarlos
> en el DOM real. Un selector no verificado es un bug garantizado.

### Algoritmo de Auditoría

```
0. ⛔ BLOQUEANTE — ANTES de tocar el fixture:
   Para cada pantalla del flujo codegen:
     → Navegar con MCP Browser
     → Ejecutar JS inventory (ver REGLA 0)
     → Anotar id real de cada elemento interactivo
     → Solo continuar cuando TODOS los IDs estén confirmados
   ↓
1. Leer TODO el fixture y el spec existentes
   ↓
2. Extraer inventario de selectores: todas las strings que aparecen en
   locator(), fill(), click(), getByText(), getByRole(), etc.
   ↓
3. Comparar: selector del codegen → ID real del DOM → asignar PRIORITY 1 (#id)
   ↓
4. Aplicar upgrades y simplificaciones
   ↓
5. Ejecutar el test: el AGENTE corre npx playwright test --headed
   → Si falla: diagnosticar, corregir, re-ejecutar
   → NUNCA decir "está listo" sin ver ✅ en el output del terminal
   ↓
6. Solo cuando el test pasa verde → entregar comando de ejecución al usuario
```

### Paso 2 — Extracción de Selectores del Código

Identificar todos los patrones locator en el código fuente:

```ts
// Patrones a detectar (ejemplos):
page.locator('text=INICIAR SESIÓN')           // text selector
page.locator('button:has-text("Procesar")')   // has-text
page.getByText('Bienvenido')                  // getByText API
page.locator('[name="txtUser"]')              // name attribute
page.locator('.btn-primary').nth(0)           // nth — posible ambigüedad
page.click('a:has-text("Continuar")')         // texto en link
page.locator('.upload-btn').click();          // clase CSS genérica
page.setInputFiles(...)                       // ya óptimo si no hay click previo innecesario
```

### Paso 3 — Verificación en DOM Real (MCP)

Por cada selector extraído, ejecutar in-browser para verificar resolución:

```js
// Para cada selector sospechoso, contar cuántos elementos resuelve
const sel = 'text=INICIAR SESIÓN';
const matches = document.querySelectorAll(sel);
console.log(matches.length, [...matches].map(e => ({ tag: e.tagName, id: e.id, class: e.className, text: e.textContent?.trim() })));

// Para un elemento encontrado vía texto, verificar si tiene ID
const el = document.evaluate("//button[text()='Procesar']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
console.log(el?.id, el?.name, el?.getAttribute('data-testid'));
```

### Paso 4 — Tabla de Decisión de Upgrade

| Patrón actual | Condición del DOM | Acción |
|---|---|---|
| `text=X` | Resuelve a 1 elemento con `id` | → `#id` (PRIORITY 1) |
| `text=X` | Resuelve a 2+ elementos | → Encontrar selector único; si no hay ID usar CSS estructura |
| `button:has-text("X")` | Elemento tiene `id` | → `#id` |
| `button:has-text("X")` | Sin ID, es `input[type=submit]` con `value` | → `input[value="X"]` (PRIORITY 5) |
| `[name="x"]` | Elemento también tiene `id` | → `#id` (PRIORITY 1 > 2) |
| `.nth(0)` | Elemento específico tiene `id` | → `#id` (elimina nth) |
| Click en botón upload → setInputFiles | Input tiene `id` o es nativo | → solo `setInputFiles('#id', file)` directo, sin click previo |
| `page.click('.menu-item-text')` (menú de nav) | La página destino tiene URL estable | → `page.goto('/ruta/directa')` (más rápido y robusto) |
| `getByRole('button', {name: 'X'})` | Elemento tiene `id` | → `#id` (aunque getByRole es semántico, ID es más estable) |
| `page.waitForTimeout(N)` | Condición esperable (visibilidad, red) | → `waitForPageIdle()` o `expect().toBeVisible()` |

### Paso 5 — Simplificaciones de Interacción

Más allá de los selectores, auditar también los **patrones de interacción**:

#### A — Upload sin click previo

```ts
// ❌ Antes (codegen típico): click botón de upload, luego setInputFiles
await page.locator('.upload-area').click();
await page.locator('input[type="file"]').setInputFiles('file.pdf');

// ✅ Después: setInputFiles directamente en el input — más confiable
await page.locator('#MainContent_fileInput').setInputFiles('file.pdf');
// El input puede estar display:none — setInputFiles() funciona igual
```

#### B — Navegación directa en lugar de click en menú

```ts
// ❌ Antes: click en menú JS que puede no estar listo
await page.locator('button:has-text("Módulo X")').click();

// ✅ Después: goto directo si la URL es conocida y estable
await page.goto('/Forms/ModuloX.aspx');
await page.waitForLoadState('networkidle');
// Motivo: botones de menú renderizados por JS tienen timing race conditions
```

#### C — Dialog handler antes del click que lo dispara

```ts
// ❌ Antes (codegen): registra handler DESPUÉS del click (timing race)
await page.locator('#btnProcesar').click();
page.once('dialog', dialog => dialog.accept());  // puede llegar tarde

// ✅ Después: handler ANTES del click que lo dispara
page.once('dialog', dialog => dialog.accept());
await page.locator('#btnProcesar').click();
```

#### D — Selector ambiguo por i18n o capitalización

```ts
// ❌ Antes: texto exacto que puede cambiar por locale
await page.locator('text=Bienvenido').toBeVisible();

// ✅ Después: atributo semántico o estructura estable
await page.locator('#ibtHome').toBeVisible(); // #ibtHome es el icono Home único en el dashboard
```

### Checklist de Auditoría Completa

Antes de cerrar la auditoría, verificar que CADA selector en el fixture:

- [ ] No usa `text=X` si hay `id` disponible
- [ ] No usa `button:has-text(...)` si hay `id` o `input[value]`
- [ ] No usa `.nth()` si hay un `id` que identifica el elemento único
- [ ] No usa `[name="x"]` si hay `id` (misma o menor prioridad)
- [ ] No hace click en overlay/botón de upload si puede ir directo con `setInputFiles()`
- [ ] No navega por menú JS si hay URL directa estable
- [ ] Los `page.once('dialog', ...)` están registrados ANTES del click que los dispara
- [ ] No hay `waitForTimeout()` — todos reemplazados por esperas basadas en condición
- [ ] Cada selector tiene comentario de evidencia `// ID único ✅ PRIORITY 1`

### Reporte de Auditoría (formato)

Al terminar la auditoría, generar un resumen conciso:

```
AUDITORÍA DE SELECTORES — <nombre-fixture>.fixture.ts
=====================================================
Selectores revisados: 24
Upgrades aplicados:   7
  - 3x text= → #id
  - 2x button:has-text → #id / input[value]
  - 1x click+setInputFiles → setInputFiles directo
  - 1x click menú → page.goto() directo
Sin cambio necesario: 17
Strict mode violations resueltas: 2
```

---

## FASE 6 — Protocolo TC-ID → Test en Verde (Flujo Completo Autónomo)

**Trigger:** El usuario proporciona un ID de Test Case y una organización ADO.
**Contrato:** El usuario solo hace DOS cosas: ejecutar `codegen` y ejecutar los tests al final.
El agente hace TODO lo demás de forma autónoma.

---

### PASO 1 — Fetch del TC via ADO MCP + Validar Entradas Obligatorias

```
Entrada mínima aceptada:
  "TC: 9360"              → asumir org=AutoregPR, project=AUTOREG
  "TC 9360, org: MiOrg"   → usar org indicada
  "#9360"                 → mismo tratamiento
```

Ejecutar inmediatamente — NO pedir confirmación:
```
mcp_ado_wit_get_work_item({ id: <TC_ID>, project: "<PROJECT>" })
```

Extraer y mapear:
| Campo ADO | Uso en el test |
|---|---|
| `System.Title` | Nombre del describe + nombre del archivo |
| `Microsoft.VSTS.TCM.Steps` | Pasos del test (parsear HTML) |
| `Microsoft.VSTS.TCM.LocalDataSource` | TEST_DATA values |
| `System.AreaPath` | Módulo/carpeta del fixture |
| URL en pasos o descripción | `baseURL` del `playwright.config.ts` |

> ⛔ **REGLA BLOQUEANTE — URL ES OBLIGATORIA**
> Si el TC **no contiene URL** en sus pasos o descripción, y no fue proporcionada junto al TC:
> **DETENER Y PREGUNTAR** antes de hacer cualquier exploración de app.
> ```
> Para automatizar estos TCs necesito:
> 1. URL de la aplicación (ej: https://app.miempresa.com)
> 2. Credenciales de prueba (usuario / contraseña)
> 3. Rutas de archivos de datos si los TCs requieren uploads (Excel, PDF, etc.)
> ```
> NO inferir URL de contexto de conversaciones anteriores — cada sesión es independiente.

> ⚡ **Recopilación paralela para batch de TCs:**
> Si se reciben múltiples TCs a la vez, obtener todos con `mcp_ado_wit_get_work_items_batch_by_ids`
> en UNA sola llamada en lugar de llamadas secuenciales por TC.

---

### PASO 2 — Preparar Entorno (FASE 0.5)

Verificar y ejecutar en terminal lo que falte:
```bash
# ¿Existe package.json con @playwright/test?
Test-Path package.json

# Si no, inicializar
npm init -y
npm install --save-dev @playwright/test typescript @types/node
npx playwright install chromium

# Crear carpetas si no existen
New-Item -ItemType Directory -Force fixtures, fixtures/files, tests
```

Crear/actualizar `playwright.config.ts` con la `baseURL` del TC.

> ⛔ Si el entorno ya existe y está correcto, saltar este paso completamente sin output innecesario.

---

### PASO 3 — PAUSA ÚNICA: Entregar Comando Codegen

Este es el ÚNICO momento en que el agente espera input del usuario.
Mostrar el mensaje exactamente así:

```
╔══════════════════════════════════════════════════════════════╗
║  ENTORNO LISTO — TC #<ID>: <TÍTULO>                         ║
║                                                              ║
║  Ejecuta este comando en tu terminal:                        ║
║                                                              ║
║  npx playwright codegen --viewport-size=1280,720 \          ║
║    <URL_DE_INICIO>                                           ║
║                                                              ║
║  Graba exactamente este flujo:                               ║
║  <PASOS_RESUMIDOS_DEL_TC>                                    ║
║                                                              ║
║  Cuando termines:                                            ║
║  → Pega el código generado aquí                             ║
║  → O escribe "sin codegen" para que continúe sin él         ║
╚══════════════════════════════════════════════════════════════╝
```

**Instrucciones para el usuario durante codegen:**
- Haz exactamente el flujo del TC, nada más
- No navegues a otras páginas innecesarias
- Si te equivocas, cierra y vuelve a ejecutar el comando
- Al terminar, copia TODO el código del panel derecho de Playwright Inspector
> ⛔ **HARD STOP — EL AGENTE CEDE EL TURNO AQUÍ.**
> No ejecutar MCP browser. No navegar la app. No continuar con ninguna fase.
> La instrucción de `actuar de forma autónoma` queda SUSPENDIDA hasta recibir respuesta del usuario.
> **Autonomía ≠ saltarse esta pausa.** Esta pausa es la EXCEPCIÓN explícita a la regla de autonomía.
> El agente solo avanza cuando el usuario escribe una respuesta en el chat.

---

### PASO 4 — Recibir Respuesta del Usuario

**Caso A — Usuario pega código codegen:**
→ Continuar con FASE 5 (auditoría completa)
→ Optimizar todos los selectores verificando en DOM via MCP browser
→ Convertir a fixture + spec final con estructura estándar

**Caso B — Usuario dice "sin codegen" o variante:**
→ Continuar con FASE 1 completa (descubrimiento via MCP browser)
→ Navegar la app, inventariar todos los selectores
→ Construir fixture + spec desde los pasos del TC

---

### PASO 5 — Completar el Test Autónomamente

Una vez que se tiene el código base (de codegen o de descubrimiento propio):

**5.1 Construir fixture:**
```
- SEL con todos los selectores auditados (#id cuando existe)
- TEST_DATA con valores del TC
- Helpers: login(), navigate(), waitForPageIdle()
- Precondition fixtures (authenticatedPage, etc.)
```

**5.2 Construir spec:**
```
- describe con nombre del TC
- test con ID del TC en el nombre (ej: 'TC-9360: Happy Path')
- Todos los pasos del TC como comentarios y como código
- Assertions para cada resultado esperado del TC
- Screenshots en cada transición: ss('s1-inicio'), ss('s2-form'), etc.
```

**5.3 Verificar compilación:**
```bash
npx tsc --noEmit
```
→ Si hay errores: corregir antes de ejecutar

**5.4 Ejecutar y corregir — Protocolo TC por TC:**

> ⛔ **NUNCA ejecutar la suite completa en el primer run.**
> Siempre validar TC por TC con `--grep` hasta que cada uno pase individualmente.

```bash
# Paso 1: Ejecutar UN TC a la vez
npx playwright test tests/<archivo>.spec.ts --headed --reporter=list --grep "TC XXXX"

# Solo cuando PASA en verde, pasar al siguiente TC
npx playwright test tests/<archivo>.spec.ts --headed --reporter=list --grep "TC YYYY"

# Cuando TODOS pasan individualmente, correr la suite completa
npx playwright test tests/<archivo>.spec.ts --headed --reporter=list
```

**Árbol de decisión al fallar:**
```
Test falla
  ├─ Timeout en locator         → Verificar selector en DOM via MCP (JS eval)
  ├─ Dialog timeout             → ¿Es diálogo AJAX? → Patrón B (REGLA 8)
  │                             → ¿Es diálogo doble? → Patrón C (REGLA 8)
  ├─ Element never visible      → ¿display:none siempre? → REGLA 8b (PostBack oculto)
  ├─ Wrong assertion value      → Verificar texto exacto en DOM via MCP
  └─ Navigation timeout         → ¿Hay diálogo bloqueando? → Registrar handler
```

→ NUNCA repetir el mismo click/acción sin corregir la causa raíz primero
→ NUNCA usar `waitForTimeout()` para "parchear" un timing
→ Continuar este ciclo hasta ✅

---

### PASO 6 — Cierre: Marcar TC y Entregar al Usuario

Cuando el test pasa en verde:

**6.1 Marcar TC como automatizado en ADO:**
```
mcp_ado_wit_update_work_item({
  id: <TC_ID>,
  project: "<PROJECT>",
  fields: { "Microsoft.VSTS.TCM.AutomationStatus": "Automated" }
})
```

**6.2 Entregar al usuario:**
```
╔══════════════════════════════════════════════════════════════╗
║  ✅ TC #<ID> AUTOMATIZADO                                    ║
║                                                              ║
║  Archivos generados:                                         ║
║  - fixtures/<nombre>.fixture.ts                             ║
║  - tests/<nombre>.spec.ts                                   ║
║                                                              ║
║  Para ejecutar:                                              ║
║  npx playwright test tests/<nombre>.spec.ts --headed        ║
║                                                              ║
║  Para ver el reporte:                                        ║
║  npx playwright show-report                                  ║
╚══════════════════════════════════════════════════════════════╝
```

---

### Reglas de comportamiento del agente en este flujo

| Situación | Comportamiento |
|---|---|
| TC no tiene URL **y no fue dada por el usuario** | **Detener. Preguntar URL + credenciales + archivos UNA vez. No inferir de contexto anterior.** |
| URL dada junto al TC | Usarla directamente sin preguntar |
| Selector ambiguo después de codegen | Verificar en DOM via MCP sin preguntar |
| Dialog timeout (page.once no captura) | Diagnosticar: ¿AJAX dialog? → cambiar a `Promise.all` Patrón B |
| Dos dialogs en secuencia | Usar Patrón C nested (REGLA 8) |
| Botón `display:none` que nunca es visible | NO clickear. Esperar panel resultante. REGLA 8b |
| Test falla por timeout | Diagnosticar con árbol de decisión (PASO 5.4) |
| Test falla por elemento no encontrado | Revisar DOM via MCP, actualizar selector |
| Proceso quedó enganchado en app | Verificar si hay helper de "reset a Paso 1" (navegación con dialog handler) |
| Usuario no responde tras codegen prompt | **NUNCA continuar sin respuesta explícita.** El agente ya cedió el turno en PASO 3. Esperar. |
| Múltiples TCs en batch | Fetchear todos con `get_work_items_batch_by_ids` (llamada única). Ejecutar y depurar TC por TC con `--grep`. Suite completa solo cuando todos pasan individualmente. |
| Error repetido sin causa identificada | Nunca reintentar sin corregir. Inspeccionar DOM/red vía MCP para entender el estado real de la app. |

