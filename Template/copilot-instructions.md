# Copilot Execution Entry

## Protocolo principal — TC ID + Org → Test automatizado completo

El flujo estándar se activa cuando el usuario dice "inicia" o indica que quiere automatizar.
El agente completa TODO el trabajo — el usuario solo ejecuta codegen, provee el TC y al final ejecuta los tests.

```
ENTRADA DEL USUARIO:
  "inicia"  (o cualquier variante para arrancar)
       ↓
PASO 1 — Preparar entorno (FASE 0.5 del skill playwright-e2e)
  → Verificar/crear proyecto Playwright
  → Instalar dependencias si faltan
  → Crear playwright.config.ts con baseURL base de la app
  → Crear estructura de carpetas
       ↓
PASO 2 — PAUSA: Entregar comando codegen al usuario
  ┌─────────────────────────────────────────────────────┐
  │  ENTORNO LISTO — Ejecuta este comando:              │
  │  npx playwright codegen --viewport-size=1280,720 \  │
  │    <URL_DE_INICIO_DEL_FLUJO>                        │
  │                                                     │
  │  Graba el flujo que quieres automatizar.            │
  │  Al terminar, pega el código aquí junto con         │
  │  el ID del TC (ej: "TC: 9360") o describe           │
  │  el flujo si no tienes TC.                          │
  └─────────────────────────────────────────────────────┘
       ↓
PASO 3 — Fetch automático del TC via ADO MCP + recibir código codegen
  mcp_ado_wit_get_work_item({ id: <TC_ID>, org: <ORG> })
  → Extraer: título, módulo, URL de la app, pasos, datos, resultado esperado
  → Combinar con el código codegen recibido del usuario
       ↓
PASO 4A — Usuario pegó código codegen
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
> El usuario hace TRES cosas: ejecutar codegen + proveer TC ID + ejecutar los tests al final.

---

## Flujos de entrada alternativos

| Entrada del usuario | Flujo |
|---|---|
| "inicia" | Protocolo principal: entorno → codegen → TC → test |
| Código codegen + TC ID | PASO 3 directo (saltar entorno y codegen) |
| Código codegen pegado sin TC | FASE 5 directa (auditoría + conversión) |
| TC ID sin código codegen | Entorno → codegen → PASO 3 → FASE 1 si "sin codegen" |
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
