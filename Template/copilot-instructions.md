# Copilot Execution Entry

## Protocolo principal — TC ID + Org → Test automatizado completo

El flujo estándar se activa cuando el usuario proporciona un **ID de Test Case** y la **organización ADO**.
El agente completa TODO el trabajo — el usuario solo ejecuta codegen y al final ejecuta los tests.

```
ENTRADA DEL USUARIO:
  "TC: 9360, org: AutoregPR"  (o cualquier variante)
       ↓
PASO 1 — Fetch automático del TC via ADO MCP
  mcp_ado_wit_get_work_item({ id: <TC_ID>, org: <ORG> })
  → Extraer: título, módulo, URL de la app, pasos, datos, resultado esperado
       ↓
PASO 2 — Preparar entorno (FASE 0.5 del skill playwright-e2e)
  → Verificar/crear proyecto Playwright
  → Instalar dependencias si faltan
  → Crear playwright.config.ts con baseURL de la app
  → Crear estructura de carpetas
       ↓
PASO 3 — PAUSA: Entregar comando codegen al usuario
  ┌─────────────────────────────────────────────────────┐
  │  ENTORNO LISTO — Ejecuta este comando:              │
  │  npx playwright codegen --viewport-size=1280,720 \  │
  │    <URL_DE_INICIO_DEL_FLUJO>                        │
  │                                                     │
  │  Graba el flujo del TC. Al terminar:                │
  │  - pega el código aquí, o                           │
  │  - escribe "sin codegen" para que continúe solo     │
  └─────────────────────────────────────────────────────┘
       ↓
PASO 4A — Usuario pega código codegen
  → Aplicar FASE 5: auditar + optimizar selectores via MCP browser
  → Convertir a fixture + spec con selectores PRIORITY 1 (#id)
  → Completar assertions, screenshots, helpers
       ↓
PASO 4B — Usuario dice "sin codegen" / no responde con código
  → Aplicar FASE 1: navegar la app via MCP, descubrir selectores
  → Construir fixture + spec desde cero usando el TC como guía
       ↓
PASO 5 — Completar el test autónomamente
  → Implementar TODOS los pasos del TC
  → Verificar compile (tsc --noEmit)
  → Ejecutar: npx playwright test <archivo> --headed
  → Si falla: diagnosticar, corregir, re-ejecutar
  → Repetir hasta que pase ✅
       ↓
RESULTADO FINAL:
  → Test pasa en verde ✅
  → Entregar al usuario: comando de ejecución final
    "npx playwright test tests/<archivo>.spec.ts --headed"
```

> **Regla absoluta:** El agente NO pide al usuario que instale nada, cree carpetas
> ni configure nada. Toda preparación técnica es responsabilidad del agente.
> El usuario solo hace DOS cosas: ejecutar codegen + ejecutar los tests al final.

---

## Flujos de entrada alternativos

| Entrada del usuario | Flujo |
|---|---|
| ID de TC + org ADO | Protocolo principal (arriba) |
| Código codegen pegado | FASE 5 directa (auditoría + conversión) |
| "Automatiza este flujo" sin TC ni código | FASE 0.5 → codegen → FASE 5 |
| Código existente con errores/fallas | FASE 5 (diagnóstico + corrección) |

---

## MCP Azure DevOps — OBLIGATORIO para TCs

TODO acceso a Test Cases, Work Items o información del proyecto
**DEBE** realizarse vía el MCP de Azure DevOps. Prohibido copiar/pegar pasos manualmente.

### Inferir org y proyecto

- Si el usuario da solo el ID → usar org/proyecto por defecto: **AutoregPR / AUTOREG**
- Si el usuario da org diferente → usar la indicada
- **NUNCA** pedir al usuario que copie y pegue los pasos del TC manualmente

### Comandos MCP disponibles

```
# Obtener un TC por ID
mcp_ado_wit_get_work_item({ id: <TC_ID>, project: "AUTOREG" })

# Obtener múltiples TCs en batch
mcp_ado_wit_get_work_items_batch_by_ids({ ids: [9360, 9364, ...], project: "AUTOREG" })

# Buscar TCs por texto
mcp_ado_search_workitem({ searchText: "Preventas Excel", project: "AUTOREG" })

# Marcar TC como automatizado al terminar
mcp_ado_wit_update_work_item({
  id: <TC_ID>, project: "AUTOREG",
  fields: { "Microsoft.VSTS.TCM.AutomationStatus": "Automated" }
})
```

### Campos relevantes de un TC
- `System.Title` — nombre del test case
- `Microsoft.VSTS.TCM.Steps` — pasos en HTML (parsear `<parameterizedString>`)
- `Microsoft.VSTS.TCM.LocalDataSource` — datos de prueba
- `Microsoft.VSTS.Common.Priority` — prioridad
- `System.AreaPath` — módulo/área del sistema

---

## Reglas críticas

- No saltar fases del skill playwright-e2e
- No usar selectores débiles (texto) si hay `id` disponible
- No duplicar lógica entre fixture y spec
- No pedir al usuario que prepare el entorno
- No detenerse hasta que el test pase en verde ✅
