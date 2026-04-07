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

## PHASE 0 — CASE DETECTION

Read the user's first message and determine:

| Signal | Case |
|--------|------|
| Test Plan ID / suite ID mentioned | ✅ This skill (qa-execution-reporter) |
| TC IDs + "automatizar" / "automate" | → `playwright-e2e` skill |
| Ambiguous | Ask: "¿Quieres ejecutar el plan y documentar los resultados en ADO, o quieres convertir los TCs en scripts automatizados reutilizables?" |

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

### 2.3 — npm dependencies
```powershell
cd TPlans
npm init -y          # only if package.json doesn't exist
npm install playwright
npx playwright install chromium
```

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

## PHASE 4 — SCRIPT GENERATION & EXECUTION

### 4.1 — Generate run-tests.js

Generate a `TPlans/run-tests.js` script dynamically based on TC_MAP.
The script must:
- Be **fully dynamic** — no hardcoded test case names, IDs, or selectors
- Read APP_URL and credentials from variables at the top (set from collected data)
- Use `headless: true` for execution
- Save screenshots as-is (no post-processing or annotation)
- Save screenshots to `TPlans/{TC_ID}/`
- Save `TPlans/results.json` at the end

### 4.2 — Execute
```powershell
node TPlans/run-tests.js
```

If a TC fails: do NOT abort. Continue with remaining TCs. Collect all results.

### 4.3 — On timeout/flaky failures
If a TC fails due to timeout or element-not-visible:
- Retry once with `slowMo: 400`
- If still fails: mark as FAILED, capture error screenshot, continue

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


