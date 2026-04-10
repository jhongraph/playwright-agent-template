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

### Automatizar TCs (playwright-e2e)
1. Instala el template en tu proyecto:
   ```bash
   npx github:jhongraph/playwright-agent-template
   ```

2. Abre VS Code con GitHub Copilot Agent y di:
   ```
   TC 1234, org: MiOrg, URL: https://miapp.com, user: qa01/pass123
   ```

3. El agente:
   - Fetcha el TC desde Azure DevOps automáticamente
   - Explora la app vía MCP Browser
   - Construye `fixtures/` + `tests/` con selectores óptimos (`#id` PRIORITY 1)
   - Ejecuta TC por TC hasta que todos pasen ✅
   - Marca el TC como `Automated` en ADO

### Ejecutar y documentar resultados (qa-execution-reporter)
1. Abre VS Code con GitHub Copilot Agent y di:
   ```
   Ejecutar test plan 9412, org: MiOrg
   ```

2. El agente te pregunta el escenario y recopila los datos necesarios

3. Luego hace todo automáticamente:
   - Lee los TCs desde ADO
   - Navega la app y toma screenshots por cada paso
   - Sube las imágenes y publica un comentario HTML con evidencia inline en cada WI
   - Resultado visible en la sección **Discussion** de cada TC en ADO ✅

---

## Input requerido para automatizar

```
TC IDs       → números de test case en ADO (ej: 9360, 9364)
org ADO      → organización de Azure DevOps (ej: MiOrg)
URL          → URL de la aplicación (OBLIGATORIO — el agente NO infiere)
Credenciales → usuario y contraseña de prueba
Archivos     → rutas a archivos Excel, PDF, etc. si el TC los necesita
```

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
