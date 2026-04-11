# Skill: qa-execution-reporter

Execute ADO Test Plans with Playwright, capture screenshots, and upload all evidence back to ADO.
Zero manual steps — user only needs to verify results in ADO afterwards.

---

## WHEN TO USE THIS SKILL

Load this skill when the user mentions any of:
- "ejecutar test plan", "correr TP", "run test plan", TP ID number
- "documentar resultados", "subir evidencia", "reportar en ADO"
- "correr los casos de prueba", "execute TCs"

Do NOT use for: creating new TCs (→ `create-test-cases`), converting manual TCs to code (→ `playwright-e2e`).

---

## PHASE 0 — SCENARIO SELECTION (MANDATORY — ALWAYS ASK)

First, route to the correct skill:

| Signal | Action |
|--------|--------|
| TC IDs + "automatizar" / "automate" | → `playwright-e2e` skill |
| Everything else | Continue below |

**BEFORE doing anything else**, present these two scenarios and wait for the user's answer:

> **¿Cómo quieres ejecutar estos TCs?**
>
> ---
> **Escenario A — Proyecto Playwright completo** *(recomendado para regresión)*
> Los tests quedan como código `.ts` reutilizable. Se pueden volver a correr en el futuro.
>
> 📋 **Lo que necesitas tener listo:**
> 1. Node.js 18+ instalado (el agente lo verifica automáticamente)
> 2. URL de la aplicación bajo prueba
> 3. Credenciales de login (si el TC lo requiere)
> 4. Decidir si grabarás el flujo con `codegen` o dejas que el agente lo explore solo
>
> ---
> **Escenario B — Ejecución directa, sin archivos** *(recomendado para evidencia rápida)*
> El agente navega la app, ejecuta cada paso y sube screenshots a ADO. Sin código generado.
>
> 📋 **Lo que necesitas tener listo:**
> 1. URL de la aplicación bajo prueba
> 2. Credenciales de login (si el TC lo requiere)
> 3. Eso es todo — el agente hace el resto automáticamente ✅

⛔ **No proceder hasta tener la respuesta del usuario.**

- **Escenario A** → continúa con Phase 1 → 2 → 3 → 4 → 5
- **Escenario B** → salta Phase 2 (sin setup de proyecto), va directo a Phase 1 → 3 (TC discovery) → ejecuta vía MCP Browser → Phase 5

---

## PHASE 1 — DATA COLLECTION

Collect ALL required data before doing anything else. Ask only for what is missing.

### 📢 SAY TO USER (single message asking for all missing data at once):

> Para comenzar necesito algunos datos. Por favor respóndeme en un solo mensaje:
>
> 1. **Org ADO** — nombre de tu organización en Azure DevOps (ej: `MiOrg`) `[OBLIGATORIO]`
> 2. **Test Plan ID** — ID del plan de pruebas (ej: `9412`) `[OBLIGATORIO]`
> 3. **Test Suite ID** — ID de la suite dentro del plan (ej: `9418`) `[OBLIGATORIO]`
> 4. **TC IDs específicos** — si quieres ejecutar solo algunos TCs y no toda la suite (ej: `9433, 9434`) `[OPCIONAL]`
> 5. **URL de la app** — URL base de la aplicación (ej: `https://miapp.com`) `[OBLIGATORIO]`
> 6. **Credenciales** — usuario y contraseña para el login (si el TC lo requiere) `[si hay login]`

⛔ Espera la respuesta antes de continuar.

### Required inputs

```
ADO_ORG       → Azure DevOps organization name (e.g. "AutoregPR")   [REQUIRED]
TEST_PLAN_ID  → Numeric ID of the Test Plan in ADO                  [REQUIRED]
SUITE_ID      → Numeric ID of the Test Suite inside the plan        [REQUIRED — cannot find TCs without it]
TC_IDS        → Optional specific TC IDs to run (subset of the suite)
               If not provided → execute ALL TCs in the suite
APP_URL       → Base URL of the app under test                      [REQUIRED]
               (try to infer from TC steps before asking)
CREDENTIALS   → Username + password if the app requires login
               (ask only if TCs include a login step)
```

> ⚠️ ADO hierarchy: **Test Plan → Test Suite → Test Cases**
> The agent navigates this hierarchy top-down. TC IDs alone are not enough — without PLAN + SUITE context, the agent cannot load the test steps.

### PAT — AUTO-EXTRACTION FROM MCP CONFIG (NO USER INTERVENTION)

⚠️ **NEVER ask the user for their PAT.**
⚠️ **NEVER store the PAT in any file.**

If `mcp_ado_testplan_list_test_cases` works in Phase 3, the MCP ADO server is authenticated.
That means `AZURE_DEVOPS_EXT_PAT` is already configured in VS Code's MCP settings.

**The agent MUST auto-extract it** before Phase 5 using this priority order:

1. Check VS Code user MCP config: `$env:APPDATA\Code\User\mcp.json`
2. Check VS Code user settings: `$env:APPDATA\Code\User\settings.json`
3. Check workspace MCP config: `.vscode/mcp.json` (relative to project root)
4. Check system env var directly: `$env:AZURE_DEVOPS_EXT_PAT`

To read and inject the PAT automatically, run this PowerShell before executing `upload-evidence.js`:

```powershell
# Read PAT from VS Code MCP config (try each location)
$pat = $null
$locations = @(
  "$env:APPDATA\Code\User\mcp.json",
  "$env:APPDATA\Code\User\settings.json",
  ".vscode\mcp.json"
)
foreach ($f in $locations) {
  if (Test-Path $f) {
    $content = Get-Content $f -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    # Try direct env key
    $pat = $content.servers."azure-devops".env.AZURE_DEVOPS_EXT_PAT
    if (-not $pat) { $pat = $content.mcp.servers."azure-devops".env.AZURE_DEVOPS_EXT_PAT }
    if ($pat -and $pat -notlike '${env:*}') { break }
  }
}
# Fallback: system env var
if (-not $pat) { $pat = $env:AZURE_DEVOPS_EXT_PAT }
if ($pat) { $env:ADO_PAT = $pat }
```

If `$pat` is found → proceed to Phase 5 immediately.
If NOT found → post results via `mcp_ado_wit_add_work_item_comment` (text-only fallback, no image attachments) and skip `upload-evidence.js`.

**Never block. Never ask the user. Always complete autonomously.**

---

## PHASE 2 — ENVIRONMENT VERIFICATION & SETUP

Before executing anything, verify the environment. Run checks sequentially.

### 2.1 — Node.js (auto-install if missing)

Run the following check:
```powershell
node --version
```

**Case A — Node.js not found:**
Attempt silent install via `winget` (Windows) or `brew` (macOS):
```powershell
# Windows
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
```
```bash
# macOS / Linux
brew install node@20
```
After install, close and reopen the terminal (or `refreshenv`) so `node` is on PATH.
Verify again: `node --version`
If still failing:

> 📢 **SAY TO USER:**
> No encontré Node.js en tu sistema y el intento de instalación automática falló.
> Por favor instálalo manualmente:
> 1. Ve a **https://nodejs.org** y descarga la versión **LTS**
> 2. Ejecuta el instalador y sigue los pasos (Next → Next → Install)
> 3. Cierra VS Code completamente y vuélvelo a abrir
> 4. Dime cuando esté listo y continuamos

Block until resolved.

**Case B — Node.js found but version < 18:**

> 📢 **SAY TO USER:**
> Tu versión de Node.js es `{VERSION}` pero Playwright requiere Node.js 18 o superior.
> Por favor actualízala:
> - **Windows:** abre una terminal y ejecuta `winget upgrade OpenJS.NodeJS.LTS`
> - **macOS:** ejecuta `brew upgrade node`
> - O descarga la versión LTS desde https://nodejs.org
> Cuando termines, cierra y vuelve a abrir VS Code, y dime para continuar.

Block until resolved.

**Case C — Node.js ≥ 18:**

> 📢 **SAY TO USER:**
> ✅ Node.js `{VERSION}` detectado. Instalando dependencias de Playwright...

Continue immediately.

### 2.2 — Working directory
Create (or reuse) a directory for this execution:
```
{project-root}/TPlans/
```
If it doesn't exist, create it.

### 2.3 — npm dependencies & Playwright project structure

> 📢 **SAY TO USER (before running):**
> Configurando el entorno de pruebas. Esto puede tardar 1-2 minutos en la primera vez. No necesitas hacer nada — te aviso cuando esté listo. ⏳

Set up a full Playwright test project inside `TPlans/` — not a single script.

```powershell
cd TPlans
npm init -y          # only if package.json doesn't exist
npm install --save-dev @playwright/test
npx playwright install chromium
```

> 📢 **SAY TO USER (after success):**
> ✅ Entorno listo. Playwright instalado y Chromium descargado.

Then create the project structure:
```
TPlans/
├── playwright.config.ts   ← config with baseURL, headless, reporter
├── package.json           ← with npm scripts for run/headed/headless/debug
├── tests/
│   └── {suite-name}.spec.ts   ← one spec per suite (or one per TC)
└── fixtures/
    └── base.fixture.ts    ← shared login helper and page setup
```

**`TPlans/playwright.config.ts`** (generate this file):
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: '{APP_URL}',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: parseInt(process.env.SLOW_MO || '0', 10),
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

**`TPlans/package.json` scripts** (update after npm init):
```json
"scripts": {
  "test": "npx playwright test",
  "test:headed": "npx playwright test --headed",
  "test:slow": "set SLOW_MO=800 && npx playwright test --headed",
  "test:debug": "npx playwright test --debug",
  "report": "npx playwright show-report"
}
```

> ⚠️ `test:slow` usa `set VAR=value &&` — sintaxis nativa de cmd.exe que npm usa internamente.
> NO usar `cross-env`, `$env:`, ni `export` — no están disponibles sin dependencias adicionales.
> El `SLOW_MO=800` agrega 800ms entre acciones para que el usuario pueda ver el proceso.
> El usuario puede ajustarlo desde PowerShell: `$env:SLOW_MO='500'; npm run test:headed`

Run these automatically. Do not ask the user — just do it and confirm when done.

### 2.3b — TPlans/tsconfig.json (REQUIRED — prevents TypeScript errors on `process`)

Create this file inside `TPlans/` immediately after creating `playwright.config.ts`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["playwright.config.ts", "tests/**/*", "fixtures/**/*"]
}
```

> ⚠️ Without this file, TypeScript cannot find `process` (Node.js global) and throws compile errors.
> The root `tsconfig.json` (from the Playwright template) does NOT cover `TPlans/` — this file is required.

### 2.4 — ADO MCP
Verify `mcp_ado_testplan_list_test_cases` is available.
If not:

> 📢 **SAY TO USER:**
> Para conectar con Azure DevOps necesito que configures el MCP server. Sigue estos pasos:
>
> 1. Abre VS Code → `Ctrl+Shift+P` → busca **"MCP: Open MCP Configuration"** (o abre el archivo `.vscode/mcp.json`)
> 2. Agrega esta configuración (reemplaza `YOUR_ORG` con tu organización):
> ```json
> "azure-devops": {
>   "command": "npx",
>   "args": ["-y", "@azure-devops/mcp", "YOUR_ORG"],
>   "env": { "AZURE_DEVOPS_EXT_PAT": "TU_PAT_AQUÍ" }
> }
> ```
> 3. Guarda el archivo y recarga VS Code (`Ctrl+Shift+P` → **"Developer: Reload Window"**)
> 4. Dime cuando esté listo y reintentamos

### 2.5 — PAT auto-extraction
Do NOT check `$env:ADO_PAT` here. PAT extraction happens automatically at the start of Phase 5,
after TC execution is complete. Continue immediately.

---

## PHASE 3 — TC DISCOVERY FROM ADO

Read all test cases dynamically. No project-specific data should be hardcoded.

```
1. mcp_ado_testplan_list_test_cases(planId=TEST_PLAN_ID) for each suite
2. For each TC:
   - Read title, ID, work item ID
   - Read steps (action + expected result)
   - Infer APP_URL from steps if not provided by user
   - Identify if login is required from steps
3. Build TC_MAP array:
   [{ tcId, wiId, title, suite, steps: [{action, expected}] }]
```

If the plan has many suites and the user didn't specify, show the list and ask:

> 📢 **SAY TO USER:**
> Encontré el plan **{PLAN_NAME}** con las siguientes suites:
>
> | # | Suite ID | Nombre | TCs |
> |---|----------|--------|-----|
> | 1 | {ID} | {NOMBRE} | {N} |
> | 2 | ... | ... | ... |
>
> ¿Quieres ejecutar **todas** o alguna en particular? (responde con el número o escribe "todas")

---

## PHASE 4 — SPEC GENERATION & EXECUTION

> ⚠️ **[SOLO ESCENARIO A]** — Esta fase completa aplica ÚNICAMENTE si el usuario eligió Escenario A.
> Si eligió Escenario B, saltar directamente a Phase 5. El agente ejecuta via MCP Browser sin generar specs.

### 4.0 — Ask the user how to build the regression flow

**BEFORE generating any spec**, ask the user:

> 📢 **SAY TO USER:**
> ¿Cómo quieres que construya el flujo de automatización?
>
> ---
> **Opción A — Tú grabas con `playwright codegen`** *(más preciso, recomendado)*
> Abre un browser interactivo donde tú navegas la app y yo capturo los selectores exactos.
>
> 📋 **Pasos que seguirás tú:**
> 1. Ejecuta en tu terminal: `npx playwright codegen {APP_URL}`
> 2. Se abrirá Chrome y el Inspector de Playwright
> 3. Navega la app exactamente como lo haría el TC (login, acciones, verificaciones)
> 4. Cuando termines, copia todo el código que aparece en el panel derecho
> 5. Pégalo aquí en el chat y yo lo convierto en un spec limpio ✅
>
> ---
> **Opción B — El agente explora solo** *(más lento, cero esfuerzo tuyo)*
> Yo navego la app vía MCP Browser, descubro los selectores y armo todo.
>
> 📋 **Pasos que seguirás tú:**
> 1. Solo espera — yo hago todo automáticamente
> 2. Te aviso cuando los specs estén listos para revisar ✅

⛔ Espera la respuesta antes de continuar.

- If **Opción A**: give the exact `npx playwright codegen <URL>` command, wait for the user to paste the recorded code, then go to 4.1.
- If **Opción B**: use MCP Browser to explore each TC flow, discover selectors, then go to 4.1.

### 4.1 — Generate Playwright specs (`.spec.ts`) dynamically

Generate spec files in `TPlans/tests/` based on TC_MAP.

**One spec per suite** (or one per TC for small plans). The spec must:
- Use `@playwright/test` — `import { test, expect } from '@playwright/test'`
- Name each test exactly with the TC title: `test('TC-001 — {título}', async ({ page }) => {`
- Capture screenshots at each step: `await page.screenshot({ path: 'TPlans/{WI_ID}/step{N}.png' })`
- Save step results to a JSON array and write `TPlans/results.json` in an `afterAll` hook
- Use the shared login helper from `fixtures/base.fixture.ts` if login is needed
- Use `headless: true` by default (from playwright.config.ts)

**`TPlans/fixtures/base.fixture.ts`** (generate this file if login is needed):
```ts
import { test as base } from '@playwright/test';

export const test = base.extend<{ loggedIn: void }>({  
  loggedIn: async ({ page }, use) => {
    await page.goto('{APP_URL}');
    // fill login from credentials
    await use();
  },
});
```

### 4.2 — Execute

> 📢 **SAY TO USER (before running):**
> Ejecutando los tests ahora. Puedes:
> - Ver progreso en la terminal
> - Correr con browser visible: `npm run test:headed`
> - Correr más lento para ver el proceso: `npm run test:slow`
> Te aviso cuando terminen. ⏳

```powershell
npx playwright test          # all TCs
npx playwright test --headed  # with visible browser
```
Or use npm scripts:
```powershell
npm run test
npm run test:headed
```

If a TC fails: do NOT abort. Playwright's `retries: 1` handles flaky failures automatically.
After the run, collect results from the JSON written by `afterAll`.

> 📢 **SAY TO USER (after run):**
> ✅ Ejecución completada: **{PASSED}/{TOTAL} PASSED**. Subiendo evidencia a ADO...

### 4.3 — Modos de ejecución: headed / slow

El `playwright.config.ts` (Phase 2.3) ya incluye `slowMo` via env var. Los npm scripts del `package.json` manejan headed:

```powershell
npm run test          # headless (default)
npm run test:headed   # browser visible
npm run test:slow     # browser visible a 800ms por acción
```

El usuario también puede controlar `SLOW_MO` desde PowerShell antes de correr:
```powershell
$env:SLOW_MO = '500'; npm run test:headed
```

> ⚠️ NO modificar `headless` en `playwright.config.ts` — está fijo en `true`. El CLI flag `--headed` (vía npm scripts) lo sobreescribe en tiempo de ejecución. No usar `process.env.HEADED` en el config.

---

## PHASE 5 — EVIDENCE UPLOAD TO ADO (FULLY AUTOMATIC)

### 5.0 — Preparar screenshots según escenario

**Escenario A:** Los screenshots ya existen en `TPlans/results/{WI_ID}/stepN.png` (generados por el spec en Phase 4). `results.json` ya existe. Continuar a 5.1.

**Escenario B — Guardar screenshots de MCP Browser a disco:**

El agente ejecutó cada paso via MCP Browser. Antes de subir evidencia:
1. Crear directorio `TPlans/results/{WI_ID}/` para cada TC (crear `TPlans/` si no existe — solo la carpeta, sin npm project)
2. Por cada screenshot capturado con `browser_take_screenshot`: guardar el archivo base64 como PNG usando PowerShell:
```powershell
# Guardar screenshot base64 a archivo PNG
[System.IO.File]::WriteAllBytes("{ruta}\stepN.png", [Convert]::FromBase64String("{base64_data}"))
```
3. Construir manualmente `TPlans/results.json` con la estructura:
```json
[
  {
    "tcId": 9433,
    "wiId": 9433,
    "title": "TC título",
    "suite": "Suite nombre",
    "steps": [
      { "step": 1, "action": "...", "expected": "...", "status": "PASSED", "screenshot": "TPlans/results/9433/step1.png" }
    ],
    "overall": "PASSED"
  }
]
```
4. Continuar a 5.1 — el resto del flujo (PAT + upload-evidence.js) es idéntico para ambos escenarios.

> ✅ `upload-evidence.js` solo usa módulos nativos de Node.js (`https`, `fs`, `path`) — no requiere `npm install`. Puede ejecutarse con `node TPlans/upload-evidence.js` directamente.

---

### 5.1 — Auto-extract PAT from MCP config

> 📢 **SAY TO USER:**
> Extrayendo credenciales ADO automáticamente de tu configuración MCP... 🔑

Run this PowerShell to read the PAT automatically from VS Code's MCP configuration:

```powershell
$pat = $null
$locations = @(
  "$env:APPDATA\Code\User\mcp.json",
  "$env:APPDATA\Code\User\settings.json",
  ".vscode\mcp.json"
)
foreach ($f in $locations) {
  if (Test-Path $f) {
    $content = Get-Content $f -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    $pat = $content.servers."azure-devops".env.AZURE_DEVOPS_EXT_PAT
    if (-not $pat) { $pat = $content.mcp.servers."azure-devops".env.AZURE_DEVOPS_EXT_PAT }
    if ($pat -and $pat -notlike '${env:*}') { break }
  }
}
if (-not $pat) { $pat = $env:AZURE_DEVOPS_EXT_PAT }
if ($pat) {
  $env:ADO_PAT = $pat
  Write-Host "PAT extraído automáticamente del MCP config."
} else {
  Write-Host "PAT no encontrado en MCP config. Usando fallback MCP comments."
}
```

### 5.2 — If PAT extracted → run upload-evidence.js

Generate `TPlans/upload-evidence.js` and execute automatically, no user input needed.

The script must:
1. **Read PAT from `process.env.ADO_PAT`** — never from a file or argument
2. For each TC in `results.json`:
   a. Upload each PNG to `https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/attachments` → receive back an attachment URL with a GUID
   b. **Do NOT PATCH the work item to add attachment relations** — not needed
   c. POST a single HTML comment to the work item using `mcp_ado_wit_add_work_item_comment` (or REST POST) with:
      - Result table (PASSED/FAILED per step)
      - Inline images using `<img src="{ATTACHMENT_URL}">` directly in the HTML
      - Execution timestamp and agent signature

> ✅ The images are visible inline in the comment. ADO stores the PNG in its attachment storage and serves it via the URL. No WI relation patching is required.
> ✅ Verified: WI relations count = 0 after successful execution — images still render correctly inline.

#### ⚠️ CRITICAL — adoRequest must handle Buffer bodies without string conversion

Binary files (PNG screenshots) MUST be sent as `Buffer`, never converted to string.
Use this exact `adoRequest` implementation in every generated upload script:

```js
function adoRequest(method, url, body, contentType) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    let postData;
    const headers = {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': contentType || 'application/json',
      Accept: 'application/json',
    };
    if (body) {
      if (Buffer.isBuffer(body)) {
        postData = body;
        headers['Content-Length'] = body.length;
      } else if (typeof body === 'string') {
        postData = body;
        headers['Content-Length'] = Buffer.byteLength(body);
      } else {
        postData = JSON.stringify(body);
        headers['Content-Length'] = Buffer.byteLength(postData);
      }
    }
    const options = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method, headers };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ✅ CORRECT: pass Buffer directly — never .toString('binary')
async function uploadAttachment(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath); // raw Buffer
  const url = `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.0`;
  const res = await adoRequest('POST', url, fileContent, 'application/octet-stream');
  return res.url;
}
```

> ❌ FORBIDDEN: `fileContent.toString('binary')` — corrupts PNG bytes above 127.

#### ✅ APPROVED COMMENT HTML TEMPLATE (use this exact structure)

This is the approved layout. Do NOT deviate from it.

Rules:
- **Headers row**: `background:#0078d4; color:white; font-size:16px; font-weight:bold; padding:12px`
- **PASSED cells**: `color:#1a7f37; font-weight:bold; text-align:center;` — NO background color on rows
- **FAILED cells**: `color:#c0392b; font-weight:bold; text-align:center;` — NO background color on rows
- **Images**: stacked in a **column** (one per `<p>` block), each `width=720`, wrapped in `<a href target=_blank>` for click-to-expand
- **Evidence section**: BELOW the table, never inside table cells

```html
<h2>📋 {TC_ID} — {TC_TITLE} {OVERALL_ICON}</h2>
<p style="font-size:14px;"><b>Plan:</b> {PLAN_ID} | <b>Suite:</b> {SUITE} | <b>Fecha:</b> {DATE} | <b>Usuario:</b> {USERNAME}</p>

<table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;font-size:15px;width:100%;">
  <thead>
    <tr style="background:#0078d4;color:white;font-size:16px;font-weight:bold;">
      <th style="width:10%;padding:12px;">Fase</th>
      <th style="width:38%;padding:12px;">Acción</th>
      <th style="width:38%;padding:12px;">Resultado Esperado</th>
      <th style="width:14%;padding:12px;">Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>STEP 1</b></td>
      <td>{ACTION_1}</td>
      <td>{EXPECTED_1}</td>
      <td style="color:#1a7f37;font-weight:bold;text-align:center;">✅ PASSED</td>
    </tr>
    <!-- repeat for each step — use color:#c0392b for ❌ FAILED -->
  </tbody>
</table>

<br/>
<b style="font-size:15px;">📎 Evidencia</b> &nbsp;<i style="font-size:12px;color:#666;">(clic para ver a tamaño completo)</i>
<br/><br/>

<p style="font-size:13px;margin:4px 0;"><b>STEP 1 — {STEP_1_LABEL}</b></p>
<a href="{ATTACHMENT_URL_1}" target="_blank">
  <img src="{ATTACHMENT_URL_1}" width="720" style="border:1px solid #ccc;display:block;" />
</a>

<br/>
<p style="font-size:13px;margin:4px 0;"><b>STEP 2 — {STEP_2_LABEL}</b></p>
<a href="{ATTACHMENT_URL_2}" target="_blank">
  <img src="{ATTACHMENT_URL_2}" width="720" style="border:1px solid #ccc;display:block;" />
</a>

<!-- repeat for each step screenshot -->

<hr/><small>🤖 GitHub Copilot Agent — {SCENARIO} — {DATE}</small>
```

**OVERALL_ICON**: `✅ PASSED` if all steps passed, `❌ FAILED` if any step failed.
**ATTACHMENT_URL pattern**: `https://dev.azure.com/{ORG}/{PROJECT_GUID}/_apis/wit/attachments/{GUID}?fileName={name}.png`
Note: ADO sanitizes these URLs internally to `\u0006/GUID` in `renderedText` JSON — this is normal. Images render correctly in the browser.

> 📢 **SAY TO USER (before uploading):**
> Subiendo screenshots a ADO e insertando evidencia inline en los comentarios. No cierres VS Code. ⏳

Run automatically:
```powershell
node TPlans/upload-evidence.js
```

> 📢 **SAY TO USER (progress — print for each TC):**
> 📤 TC-{N} ({WI_ID}) — Subiendo {TOTAL_STEPS} screenshots... ✅ Comentario publicado.

### 5.3 — If PAT NOT found → fallback via MCP comment (text-only attachments)

If PAT could not be auto-extracted, use `mcp_ado_wit_add_work_item_comment` directly.
Use the same **APPROVED COMMENT HTML TEMPLATE** from section 5.2 above.
Omit the `<img>` tags since there are no uploaded attachment URLs — include the steps table and Evidencia label with a note:
```html
<p style="font-size:13px;color:#888;"><i>Nota: adjuntos no disponibles (PAT no encontrado en MCP config).</i></p>
```
**Do NOT ask the user for anything. Complete silently with this fallback.**

---

## PHASE 6 — HANDOFF TO USER

When all phases complete, summarize with this exact message:

> 📢 **SAY TO USER:**
>
> ```
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ✅ Ejecución completada
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Plan:    {PLAN_ID} — {PLAN_NAME}
> Org:     {ORG}
> Suites:  {SUITE_COUNT}
> TCs:     {PASSED}/{TOTAL} PASSED
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ```
>
> 📁 **Screenshots locales guardados en:**
> `TPlans/{WI_ID}/` — una carpeta por TC con las fases
>
> 📋 **ADO actualizado — cómo verificar:**
> 1. Ve a: `https://dev.azure.com/{ORG}/{PROJECT}/_testPlans/execute?planId={PLAN_ID}`
> 2. Abre cualquier TC de la lista
> 3. En la sección **Discussion** verás el comentario con la tabla de resultados y las imágenes inline
>
> ¿Quieres ejecutar más TCs o hay algo que ajustar?

**Do NOT ask for further input unless the user replies.** The skill is complete.

---

## ERROR HANDLING

| Situation | Action |
|-----------|--------|
| PAT not in MCP config | Use `mcp_ado_wit_add_work_item_comment` fallback. Never block. |
| MCP ADO unavailable | Block — without MCP ADO, Phase 3 (TC discovery) already fails. Tell user to configure MCP. |
| TC not found in ADO | Warn user with TC ID. Skip. Continue. |
| App URL not inferable | Ask user once. |
| Playwright install fails | Show exact error. Ask user to run manually. |
| Screenshot upload fails | Warn per-file. Fall back to MCP comment for that TC. Continue. |
| All TCs fail | Still upload evidence. Report FAILED in ADO. |


