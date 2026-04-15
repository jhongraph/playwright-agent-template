# Agent Architecture V2 — Playwright E2E System

## Arquitectura real: Skills como agentes

Cada agente es un archivo SKILL.md en `~/.agents/skills/<name>/SKILL.md`.
Los agentes se comunican via JSON en `.agent-state/` — no hay estado volátil en memoria del LLM.

---

## Agentes disponibles

| Skill | Rol | Input | Output |
|-------|-----|-------|--------|
| `tc-reader` | QA Analyst — lee ADO | TC ID, org, project | `plan-<TC_ID>.json` |
| `discovery` | Auto Dev — explora DOM | `plan-<TC_ID>.json` + URL | `discovery-<TC_ID>.json` + `selector-cache.json` |
| `code-builder` | Auto Dev — genera código | `plan-<TC_ID>.json` + `discovery-<TC_ID>.json` | `TPlans/fixtures/*.ts` + `TPlans/tests/*.spec.ts` |
| `executor` | QA Executor — corre tests | `session.json` + spec path | `execution-<TC_ID>.json` |
| `debugger` | Auto Dev — diagnostica | `execution-<TC_ID>.json` | fix aplicado + `session.json` actualizado |
| `playwright-e2e` | Legacy monolítico | Todo — flujo completo sin ADO | specs completos |
| `create-test-cases` | QA — crea TCs en ADO | descripción del flujo | TCs creados en ADO |
| `qa-execution-reporter` | QA — reporta resultados | resultados de ejecución | reporte en ADO |

---

## Contratos JSON (.agent-state/)

```
.agent-state/
  session.json                 ← Estado del pipeline completo (un objeto)
  plan-<TC_ID>.json            ← Salida de tc-reader (pasos, precondiciones, datos)
  discovery-<TC_ID>.json       ← Salida de discovery (selectores, tecnología, wait_strategy)
  execution-<TC_ID>.json       ← Salida de executor (pass/fail, terminal_output, screenshots)
  selector-cache.json          ← Cache de selectores por dominio (TTL 7 días)
  *.schema.json                ← Schemas JSON de cada contrato (versionar)
```

---

## Flujo Pipeline A (Escenario nuevo)

```
Usuario: "automatiza TC 9400 org AutoregPR proyecto AUTOREG url https://app.com"

Orquestador (copilot-instructions.md)
    │
    ├─► tc-reader ──────────────────► plan-9400.json
    │
    ├─► discovery ──────────────────► discovery-9400.json
    │         (usa selector-cache si disponible y < 7 días)
    │
    ├─► code-builder ───────────────► TPlans/fixtures/flujo.fixture.ts
    │                                 TPlans/tests/9400-slug.spec.ts
    │
    ├─► executor ───────────────────► execution-9400.json
    │         (si PASS → reporter)
    │         (si FAIL → debugger)
    │
    ├─► debugger ───────────────────► fix aplicado en fixture/spec
    │         (si fixed → executor nuevamente)
    │         (si fail_count >= 3 → escalar)
    │
    └─► reporter ────────────────────► ADO actualizado (status Automated / Pass)
```

---

## Prohibiciones por rol

| Agente | No puede |
|--------|----------|
| tc-reader | Usar MCP Browser, escribir TypeScript, ejecutar terminal |
| discovery | Usar ADO MCP, escribir TypeScript, ejecutar `npx playwright test` |
| code-builder | Usar MCP Browser, usar ADO MCP, ejecutar tests |
| executor | Usar MCP Browser, usar ADO, modificar código |
| debugger | Reportar en ADO, corregir sin ver DOM en MCP Browser antes |
| orquestador | Ejecutar lógica de dominio, consultar DOM, escribir selectors |

---

## Archivos de referencia compartidos (no duplicar en skills)

- `playwright-guide.md` → implementación de helpers (waitForPageIdle, safeSetValue, etc.)
- `execution-rules.md` → REGLA 0–13 de construcción de tests
- `selector-strategy.md` → tabla de prioridad de selectores

Los skills referencian estos archivos con `→ ver playwright-guide.md` en lugar de duplicar contenido.
