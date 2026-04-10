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
> **Escenario A — Proyecto Playwright completo** *(recomendado para regresión)*
> Crea estructura `TPlans/` con specs `.ts` reutilizables, fixtures y npm scripts.
> Los tests quedan como código y se pueden volver a correr en el futuro.
>
> **Escenario B — Ejecución directa, sin archivos**
> El agente navega la app vía MCP Browser, ejecuta cada paso del TC y toma screenshots.
> No genera ningún archivo de código. Solo sube evidencia a ADO.

⛔ **No proceder hasta tener la respuesta del usuario.**

- **Escenario A** → continúa con Phase 1 → 2 → 3 → 4 → 5
- **Escenario B** → salta Phase 2 (sin setup de proyecto), va directo a Phase 1 → 3 (TC discovery) → ejecuta vía MCP Browser → Phase 5

---

## PHASE 1 — DATA COLLECTION

Collect ALL required data before doing anything else. Ask only for what is missing.

### Required inputs

```
ADO_ORG       → Azure DevOps organization name (e.g. "AutoregPR")
TEST_PLAN_ID  → Numeric ID of the Test Plan in ADO
APP_URL       → Base URL of the app under test
               (try to infer from TC steps before asking)
CREDENTIALS   → Username + password if the app requires login
               (ask only if TCs include a login step)
SUITE_IDS     → Optional. If not provided, execute ALL suites in the plan.
```

### PAT — SECURITY PROTOCOL (CRITICAL)

⚠️ **NEVER ask the user to paste their PAT here in the chat.**
⚠️ **NEVER store the PAT in any file.**

When the PAT is needed, say EXACTLY this to the user:

---
> **Necesito que configures tu Personal Access Token de ADO.**
> 
> 1. Abre tu terminal **de forma privada** (no aquí en el chat).
> 2. Ejecuta: `$env:ADO_PAT = "TU_PAT_AQUI"`
> 3. **Nunca compartas tu PAT en el chat** — es una credencial secreta.
> 4. Si no tienes un PAT aún, créalo en: `https://dev.azure.com/TU_ORG/_usersSettings/tokens`
>    Permisos mínimos requeridos: **Work Items (Read & Write)**, **Test Management (Read & Write)**.
> 5. Avísame cuando lo hayas configurado para continuar.
---

All scripts MUST read the PAT exclusively via `process.env.ADO_PAT`. Never hardcode, never log it.

When the user confirms the PAT is set: acknowledge briefly ("Perfecto, continuando...") and immediately proceed to execute `upload-evidence.js` — do NOT ask again or wait for further input.

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
If still failing: tell the user to install manually from https://nodejs.org (LTS button) and reload VS Code. Block until resolved.

**Case B — Node.js found but version < 18:**
Tell the user:
> "Tu versión de Node.js es demasiado antigua (`{VERSION}`). Playwright requiere Node.js 18+.
> Actualízala con: `winget upgrade OpenJS.NodeJS.LTS` (Windows) o `brew upgrade node` (macOS).
> Avísame cuando hayas actualizado."
Block until resolved.

**Case C — Node.js ≥ 18:** Continue immediately. ✅

### 2.2 — Working directory
Create (or reuse) a directory for this execution:
```
{project-root}/TPlans/
```
If it doesn't exist, create it.

### 2.3 — npm dependencies & Playwright project structure

Set up a full Playwright test project inside `TPlans/` — not a single script.

```powershell
cd TPlans
npm init -y          # only if package.json doesn't exist
npm install --save-dev @playwright/test
npx playwright install chromium
```

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

### 2.4 — ADO MCP
Verify `mcp_ado_testplan_list_test_cases` is available.
If not: tell the user to configure the Azure DevOps MCP server:
```json
"azure-devops": {
  "command": "npx",
  "args": ["-y", "@azure-devops/mcp", "YOUR_ORG"],
  "env": { "AZURE_DEVOPS_EXT_PAT": "set-via-env-not-here" }
}
```

### 2.5 — PAT env var
Check: `$env:ADO_PAT` is set (non-empty).
If not: trigger PAT Security Protocol from Phase 1.

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
> "El plan tiene estas suites: [lista]. ¿Quieres ejecutar todas o solo alguna en particular?"

---

## PHASE 4 — SPEC GENERATION & EXECUTION

### 4.0 — Ask the user how to build the regression flow

**BEFORE generating any spec**, ask the user:

> **¿Cómo quieres construir el flujo de regresión?**
>
> **Opción A — `playwright codegen`** (recomendada para usuarios nuevos)
> Tú grabas el flujo en el browser, me pegas el código, y yo lo convierto en specs limpios.
> Comando: `npx playwright codegen {APP_URL}`
>
> **Opción B — Agente autónomo**
> El agente navega la app vía MCP Browser, descubre los selectores y arma los specs solo.
> Requiere más tiempo pero no necesitas hacer nada.

Wait for the user's choice before continuing.

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

### 4.3 — SLOW_MO / headed mode via env var
The generated `playwright.config.ts` should support env-driven overrides:
```ts
use: {
  headless: process.env.HEADED !== '1',
  launchOptions: {
    slowMo: parseInt(process.env.SLOW_MO || '0', 10),
  },
}
```
So the user can run:
```powershell
$env:HEADED = '1'; $env:SLOW_MO = '700'; npm run test
```

---

## PHASE 5 — EVIDENCE UPLOAD TO ADO

Use the REST API via a generated `TPlans/upload-evidence.js` script.
The script must:

1. **Read PAT from `process.env.ADO_PAT`** — never from a file or argument
2. For each TC in results.json:
   a. Upload each PNG to `https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/attachments`
   b. Get the attachment URL back
   c. POST a comment to the work item with:
      - Result table (PASSED/FAILED per phase)
      - Inline image previews using the attachment URLs
      - Execution timestamp and agent signature

### ⚠️ CRITICAL — PAT check must print plain-text instructions

When `process.env.ADO_PAT` is not set, the generated script MUST print step-by-step
instructions to the terminal (NOT ask the user inside Copilot chat). Use this exact pattern:

```js
const PAT = process.env.ADO_PAT;
if (!PAT) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Configuración requerida: ADO Personal Token        ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║                                                          ║');
  console.log('║  1. Crea tu PAT en ADO (si aún no tienes uno):           ║');
  console.log('║     https://dev.azure.com/{ORG}/_usersSettings/tokens    ║');
  console.log('║     Permisos: Work Items (Read & Write)                  ║');
  console.log('║                                                          ║');
  console.log('║  2. Abre PowerShell y ejecuta (NO en el chat):           ║');
  console.log('║     $env:ADO_PAT = "PEGA_TU_PAT_AQUI"                   ║');
  console.log('║                                                          ║');
  console.log('║  3. Luego ejecuta de nuevo en la misma terminal:         ║');
  console.log('║     node TPlans/upload-evidence.js                       ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  process.exit(1);
}
```

### ⚠️ CRITICAL — adoRequest must handle Buffer bodies without string conversion

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
        // Binary data — use length in bytes, do NOT convert to string
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

// ✅ CORRECT: pass Buffer directly — no .toString('binary')
async function uploadAttachment(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath); // raw Buffer
  const url = `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.0`;
  const res = await adoRequest('POST', url, fileContent, 'application/octet-stream');
  return res.url;
}
```

> ❌ FORBIDDEN: `fileContent.toString('binary')` — corrupts PNG bytes above 127 when Node.js
> re-encodes the string to UTF-8 for the socket write. Use the Buffer directly.

3. Execution report format for each comment:
```html
<h3>📋 Resultado E2E — {TC_ID} {ICON}</h3>
<p><b>Plan:</b> {PLAN_ID} | <b>Suite:</b> {SUITE} | <b>Fecha:</b> {DATE}</p>
<table>
  <tr><th>Fase</th><th>Estado</th><th>Detalle</th></tr>
  {rows}
</table>
<h4>📸 Evidencia</h4>
{inline image table}
```

After generating the script, print these instructions in the chat as plain text (not inside a Copilot run block):

```
Para subir la evidencia a ADO:

1. Abre PowerShell (NO el chat de Copilot)
2. Configura tu PAT (una sola vez por sesión):
   $env:ADO_PAT = "TU_PAT_AQUI"
3. Ejecuta el upload:
   cd "{project-root}/TPlans"
   node upload-evidence.js
```

Execute:
```powershell
node TPlans/upload-evidence.js
```

---

## PHASE 6 — HANDOFF TO USER

When all phases complete, summarize:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ejecución completada
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan:    {PLAN_ID} — {PLAN_NAME}
Org:     {ORG}
Suites:  {SUITE_COUNT}
TCs:     {PASSED}/{TOTAL} PASSED

📁 Screenshots locales:
   TPlans/TC-XXX/ (cada carpeta tiene las fases)

📋 ADO actualizado:
   Cada TC tiene comentario con resultado + evidencia inline.
   Verifica en: https://dev.azure.com/{ORG}/{PROJECT}/_testPlans/...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Tell the user:
> "Ya puedes ir a ADO a verificar los resultados. Están documentados en la sección **Discussion** de cada Test Case con los screenshots adjuntos."

**Do NOT ask for further input.** The skill is complete.

---

## ERROR HANDLING

| Situation | Action |
|-----------|--------|
| `ADO_PAT` not set | Trigger PAT Security Protocol. Block. |
| TC not found in ADO | Warn user with TC ID. Skip. Continue. |
| App URL not inferable | Ask user once. |
| Playwright install fails | Show exact error. Ask user to run manually. |
| Screenshot upload fails | Warn per-file. Continue with rest. |
| All TCs fail | Still upload evidence. Report FAILED in ADO. |


