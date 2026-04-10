# playwright-agent-template

Estructura y skills para automatizar pruebas E2E con **GitHub Copilot Agent + Playwright**.

---

## Instalación

```bash
npx github:jhongraph/playwright-agent-template
```

Esto hace DOS cosas automáticamente:

1. **Copia los archivos de workspace** (`copilot-instructions.md`, `agent-architecture.md`, etc.) al directorio actual del proyecto.
2. **Instala las skills** en `~/.agents/skills/` para que GitHub Copilot las use en cualquier workspace.

---

## Contenido

### `Template/` — Archivos de workspace
Se copian a la raíz del proyecto. Le dicen a Copilot cómo comportarse en este workspace:

| Archivo | Propósito |
|---|---|
| `copilot-instructions.md` | Protocolo principal: TC ID + Org → test automatizado |
| `agent-architecture.md` | Arquitectura de agentes (Planner, Discovery, Selector, Data) |
| `execution-rules.md` | Reglas de implementación resumidas |
| `playwright-guide.md` | Guía de estructura de fixtures y specs |
| `selector-strategy.md` | Estrategia de selectores (prioridad de locators) |

### `skills/` — Skills de GitHub Copilot Agent
Se instalan en `~/.agents/skills/`. Son los playbooks detallados que el agente invoca:

| Skill | Propósito |
|---|---|
| `playwright-e2e` | Automatizar TCs manuales como E2E con Playwright + patrones AJAX/PostBack |
| `qa-execution-reporter` | Ejecutar Test Plans de ADO, capturar screenshots y subir evidencia inline a ADO. Zero pasos manuales |
| `create-test-cases` | Crear Test Cases profesionales en Azure DevOps |
| `find-skills` | Descubrir e instalar otras skills disponibles |

---

## Uso rápido

### Paso 1 — Dile a Copilot qué quieres hacer

Abre VS Code con GitHub Copilot Agent en modo **Agent** y escribe algo como:

```
Ejecutar test plan 9412, suite 9418, org: MiOrg, URL: https://miapp.com, user: qa01/pass123
```

> ⚠️ **Siempre incluye TP + TS.** Sin el Test Plan ID el agente no puede encontrar la Suite, y sin la Suite no puede acceder a los TCs.
> Si quieres ejecutar TCs específicos (no toda la suite), agrégalos también:
> ```
> Ejecutar TP 9412, TS 9418, TCs: 9433 y 9434 — org: MiOrg, URL: https://miapp.com, user: qa01/pass123
> ```

---

### Paso 2 — Lo primero que pregunta el agente: ¿A o B?

Antes de hacer cualquier cosa, el agente te pregunta **cómo quieres ejecutar**:

```
¿Cómo quieres ejecutar estos TCs?

Escenario A — Proyecto Playwright completo
Crea archivos .spec.ts reutilizables en TPlans/.
Ideal para regresión — los tests quedan como código.

Escenario B — Ejecución directa, sin archivos
El agente navega la app, ejecuta los pasos y sube screenshots a ADO.
No genera código. Solo evidencia. Listo en minutos.
```

**Responde A o B** y el agente continúa solo.

---

### Escenario A — Proyecto Playwright completo
El agente:
- Verifica Node.js (y te guía a instalarlo si falta)
- Crea `TPlans/` con `playwright.config.ts`, specs y fixtures
- Te pregunta si grabarás con `codegen` o deja que él explore la app solo
- Ejecuta los tests y sube evidencia a ADO con screenshots inline ✅

### Escenario B — Ejecutar y documentar
El agente:
- Lee los TCs desde ADO
- Navega la app vía MCP Browser y toma screenshots por cada paso
- Sube las imágenes y publica un comentario HTML con evidencia inline en cada WI
- Resultado visible en la sección **Discussion** de cada TC en ADO ✅

---

## Input recomendado

```
org ADO         → organización de Azure DevOps (ej: MiOrg)          [OBLIGATORIO]
Test Plan ID    → ID del plan de pruebas (ej: 9412)                  [OBLIGATORIO]
Test Suite ID   → ID de la suite dentro del plan (ej: 9418)          [OBLIGATORIO — sin esto no encuentra los TCs]
TC IDs          → IDs específicos si no quieres ejecutar toda la suite (ej: 9433, 9434) [OPCIONAL]
URL             → URL de la aplicación                               [OBLIGATORIO]
Credenciales    → usuario y contraseña de prueba                     [si hay login]
Archivos        → rutas a archivos Excel, PDF, etc.                  [si el TC los necesita]
```

> **Jerarquía ADO:** Test Plan → Test Suite → Test Cases
> El agente necesita bajar por esa jerarquía. Si solo das TC IDs sin TP y TS, no puede ubicar el contexto del test.

---

## Requisitos

- Node.js 18+
- VS Code con GitHub Copilot Chat (Agent mode)
- MCP de Azure DevOps configurado
- MCP de Playwright configurado

---

## Actualizar skills

```bash
# Re-ejecutar para obtener la versión más reciente de skills y Template:
npx github:jhongraph/playwright-agent-template
```
