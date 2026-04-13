# playwright-agent-template V2

Arquitectura agéntica para automatizar pruebas E2E con **GitHub Copilot Agent + Playwright + Azure DevOps**.
Cada tarea es delegada a un agente especializado con contexto mínimo — sin monolitos, sin pérdida de estado entre sesiones.

---

## Instalación

```bash
npx github:jhongraph/playwright-agent-template
```

Esto hace lo siguiente automáticamente:
1. Copia los archivos de workspace (`copilot-instructions.md`, `agent-architecture.md`, etc.) al directorio actual.
2. Instala las skills en `~/.agents/skills/` para que GitHub Copilot las invoque en cualquier workspace.
3. Crea `.agent-state/` para el estado compartido entre agentes.
4. Crea `.env.playwright` (a partir del template example) para tus credenciales.

Para re-instalar sobre una instalación existente sin perder archivos:
```bash
npx github:jhongraph/playwright-agent-template --force
```

---

## Arquitectura V2 — Multi-agent con JSON handoffs

Cada agente es un SKILL.md con responsabilidad única. Se comunican via archivos JSON en `.agent-state/`.

```
Usuario → Orquestador (copilot-instructions.md)
               │
               ├─ tc-reader     → lee ADO, produce plan-<TC>.json
               ├─ discovery     → explora DOM, produce discovery-<TC>.json
               ├─ code-builder  → genera fixture + spec TypeScript
               ├─ executor      → corre npx playwright test, produce execution-<TC>.json
               ├─ debugger      → diagnostica fallos, aplica fix mínimo
               └─ reporter      → reporta en ADO (qa-execution-reporter)
```

Ver `agent-architecture.md` para la tabla completa de agentes, contratos y prohibiciones por rol.

---

## Contenido

### `Template/` — Archivos de workspace

| Archivo | Propósito |
|---|---|
| `copilot-instructions.md` | Orquestador puro: pipelines A/B, gestión de session.json |
| `agent-architecture.md` | Tabla de agentes reales, contratos JSON, flujo del pipeline |
| `execution-rules.md` | REGLA 0–13 de construcción de tests |
| `playwright-guide.md` | Implementación de helpers (waitForPageIdle, safeSetValue, etc.) |
| `selector-strategy.md` | Tabla de prioridad de selectores (PRIORITY 1–7) |
| `.env.playwright.example` | Template de credenciales — copiar como `.env.playwright` |
| `.agent-state/` | Schemas JSON de contratos entre agentes (versionar solo *.schema.json) |

### `skills/` — Skills de GitHub Copilot Agent

| Skill | Agente | Rol |
|---|---|---|
| `tc-reader` | QA Analyst | Lee TCs de ADO, produce plan estructurado |
| `discovery` | Auto Dev | Explora DOM vía MCP Browser, confirma selectores |
| `code-builder` | Auto Dev | Convierte plan+discovery en TypeScript fixture+spec |
| `executor` | QA Executor | Corre `npx playwright test`, captura resultados |
| `debugger` | Auto Dev | Diagnostica fallos, aplica fix mínimo en MCP Browser |
| `playwright-e2e` | Legacy | Flujo monolítico completo (sin ADO, sin pipeline) |
| `qa-execution-reporter` | QA Reporter | Sube evidencia y resultados a ADO |
| `create-test-cases` | QA Analyst | Crea TCs profesionales en ADO |

---

## Configuración inicial

### 1. Completar `.env.playwright`

```
APP_URL=https://tu-app.com
TEST_USER=mi-usuario
TEST_PASS=mi-contraseña
ADO_ORG=MiOrg
ADO_PROJECT=MiProyecto
```

> `.env.playwright` está en `.gitignore` — nunca se sube al repositorio.

### 2. Invocar el pipeline

En GitHub Copilot Agent (modo Agent), escribe:

```
Automatiza Suite 9363, org: AutoregPR, proyecto: AUTOREG, url: https://mi-app.com
```

El orquestador coordina tc-reader → discovery → code-builder → executor. El estado se persiste en `.agent-state/session.json` — puedes retomar sesiones interrumpidas.

---

## Seguridad

- Credenciales en `.env.playwright` — nunca en prompts ni en código
- `.agent-state/*.json` en `.gitignore` — no se versionan estados de sesión
- Solo los `*.schema.json` se versionan (documentan los contratos, sin datos)
