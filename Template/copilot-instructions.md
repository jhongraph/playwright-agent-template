# Orquestador E2E — GitHub Copilot Agent

## Responsabilidades del orquestador

El orquestador **delega** a agentes especializados. No ejecuta lógica de dominio directamente.
Gestiona el estado en `.agent-state/session.json` y coordina el flujo según el escenario.

---

## Escenario A — Automatización completa (código Playwright nuevo)

```
ENTRADA: TC IDs o Suite ID + URL de la app
         (ej: "automatiza Suite 9363 org AutoregPR proyecto AUTOREG url https://app.com")

PIPELINE A:
  Para cada TC en la lista (procesar de uno en uno):

  1. tc-reader   → lee ADO, escribe .agent-state/plan-<TC_ID>.json
                   actualiza session.json: status = "pending"

  2. discovery   → navega app con MCP Browser, confirma selectores
                   escribe .agent-state/discovery-<TC_ID>.json
                   actualiza session.json: status = "discovering" → "built"

  3. code-builder → convierte plan + discovery en fixture + spec TypeScript
                   actualiza session.json: status = "building" → "built"

  4. executor    → ejecuta npx playwright test --headed
                   escribe .agent-state/execution-<TC_ID>.json
                   actualiza session.json: status = "running" → "pass" | "fail"

  Si falla (fail_count < 3):
  5. debugger    → reproduce en MCP Browser, aplica fix mínimo
                   actualiza session.json: status = "fixed" | "needs_discovery"
     Si "fixed"           → volver a executor (paso 4)
     Si "needs_discovery" → volver a discovery (paso 2)
     Si fail_count >= 3   → status = "escalated", notificar al usuario, pasar al siguiente TC

  Si pasa:
  6. reporter    → reporta resultado en ADO
                   actualiza session.json: status = "reported"

  Continuar con el siguiente TC hasta agotar la lista.
```

---

## Escenario B — Ejecución directa (specs Playwright ya existen)

```
ENTRADA: TC IDs + specs ya en disk (no generar código)

PIPELINE B:
  1. tc-reader   → lee ADO para obtener título y metadata
  2. executor    → ejecuta spec existente, escribe execution-<TC_ID>.json
  Si falla (fail_count < 3):
  3. debugger    → diagnostica y aplica fix mínimo
     Si "fixed"          → volver a executor
     Si fail_count >= 3  → escalar al usuario
  Si pasa:
  4. reporter    → reporta en ADO
```

---

## Gestión del estado (session.json)

- Leer `.agent-state/session.json` al inicio de cada sesión.
- Si ya existe sesión con TCs `pending` o `fail` → preguntar si retoma o inicia nueva.
- Al crear sesión nueva asignar `session_id` en formato `YYYY-MM-DD-NNN`.
- Schema de referencia: `.agent-state/session.schema.json`

---

## Reglas del orquestador

| # | Regla |
|---|-------|
| 1 | El orquestador **nunca** escribe código TypeScript ni consulta el DOM directamente |
| 2 | El orquestador **nunca** llama a `mcp_playwright_*` ni `mcp_ado_*` — eso es trabajo de los agentes |
| 3 | Procesar TCs **de uno en uno** — no lanzar dos agentes en paralelo sobre el mismo TC |
| 4 | Un TC solo pasa a "reported" cuando `executor` confirmó ✅ en el terminal |
| 5 | Informar al usuario solo al final de cada TC: "TC 9400 ✅ PASS" o "TC 9401 ❌ ESCALADO" |
| 6 | Si el usuario provee codegen pegado → pasarlo a `code-builder` como `codegen_source` |
| 7 | Credenciales: leer de `.env.playwright` — nunca pedir al usuario |
