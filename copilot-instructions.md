# Copilot Execution Entry

## Flujo principal — Conversational Step-by-Step

El agente opera en **fases conversacionales**. Cada fase espera una señal del usuario antes de avanzar.
El usuario nunca necesita instalar nada, crear carpetas ni configurar nada — eso es responsabilidad del agente.

---

### FASE 0 — Activación ("comienza" / "start" / "inicio" / "init" / similar)

Cuando el usuario dice cualquier variante de inicio, el agente:

1. Prepara el entorno Playwright completo:
   - Verificar/crear proyecto Playwright (`npm init playwright@latest` si no existe)
   - Instalar dependencias si faltan
   - Crear `playwright.config.ts` con baseURL de la app
   - Crear estructura de carpetas (`tests/`, `fixtures/`, `helpers/`, `data/`)
2. Al terminar, imprime el bloque de espera con el comando codegen:

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ ENTORNO LISTO                                           │
│                                                             │
│  PASO 1 — Ejecuta el codegen para grabar el flujo:         │
│  npx playwright codegen --viewport-size=1280,720 <URL>     │
│                                                             │
│  Cuando termines, pega aquí el código generado.            │
└─────────────────────────────────────────────────────────────┘
```

> El agente NO avanza hasta que el usuario pegue el código codegen.

---

### FASE 1 — Código Codegen (Happy Path)

El usuario pega el código generado por `playwright codegen`.

El agente:
- Recibe y almacena el código como **happy path base**
- NO lo convierte aún — espera el contexto del Test Plan o instrucción directa
- Confirma recepción e indica el siguiente paso:

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ CÓDIGO RECIBIDO                                         │
│                                                             │
│  PASO 2 — Proporciona el contexto del test:                │
│  - ID de Test Plan/Case en ADO (ej: "TP: 9361, org: AutoregPR") │
│  - O describe directamente qué se quiere probar            │
└─────────────────────────────────────────────────────────────┘
```

---

### FASE 2 — Contexto: Test Plan ADO o Instrucción Directa

**Opción A — Test Plan / Test Case ADO:**
- El usuario provee un TC ID o TP ID + org
- El agente hace fetch via MCP:
  ```
  mcp_ado_wit_get_work_item({ id: <ID>, org: <ORG> })
  ```
- Extrae: título, módulo, URL de la app, pasos, datos, resultado esperado
- Combina los pasos del TC con el happy path del codegen

**Opción B — Instrucción directa:**
- El usuario describe en lenguaje natural qué se quiere probar
- El agente usa esa descripción como guía para construir el test
- Al finalizar el test → **el agente pregunta**:
  ```
  ¿Quieres que cree los Test Cases en Azure DevOps para este flujo?
  (Si/No + suite ID si aplica)
  ```

Después de procesar el contexto, el agente confirma y pide variantes:

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ CONTEXTO PROCESADO                                      │
│                                                             │
│  PASO 3 (opcional) — Pasa variantes o escenarios           │
│  alternos que debo considerar. Ejemplo:                    │
│  - "paso 3: VIN inválido → aparece warning"                │
│  - "si la placa no existe → mensaje de error"              │
│                                                             │
│  O escribe "continuar" para generar el test con solo       │
│  el happy path.                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### FASE 3 — Variantes / Escenarios Alternativos (Opcional)

El usuario describe casos alternativos al happy path. Ejemplos:
- `"paso 3: VIN inválido → aparece warning, insertar otro VIN"`
- `"si la placa ya está registrada → modal de error, cerrar y reintentar"`
- `"campo fecha vacío → validación roja"`

El agente interpreta cada variante como una **condición de resiliencia** en el test:
- Detecta el elemento de advertencia/error en la UI
- Agrega lógica condicional (`if (await warning.isVisible()) { ... }`) para que el test **no falle** sino que maneje el caso
- Documenta el escenario como un paso condicional en el spec

> **Regla:** Las variantes NO crean tests separados. Se incorporan como lógica
> defensiva dentro del mismo flujo, para que el test sea robusto ante datos reales.

Cuando el usuario termina de dar variantes (o dice "continuar"), avanza a FASE 4.

---

### FASE 4 — Construcción y Ejecución del Test

El agente genera el test completo:

1. Convierte el código codegen a estructura `fixture + spec`
2. Incorpora selectores optimizados (prioridad: `#id > name > data-testid > css estable`)
3. Inyecta lógica condicional de cada variante recibida
4. Agrega assertions y screenshots por pantalla
5. Verifica compile: `tsc --noEmit`
6. Ejecuta: `npx playwright test <archivo> --headed`
7. Si falla → diagnostica, captura screenshot, corrige, re-ejecuta
8. Repite hasta verde ✅

**Resultado final:**
```
✅ TEST PASANDO

Ejecuta con:
npx playwright test tests/<archivo>.spec.ts --headed
```

---

### FASE 5 — Alta en ADO (si aplica)

Si el contexto fue una **instrucción directa** (sin TC/TP ID), el agente pregunta:

```
¿Deseas que cree los Test Cases en Azure DevOps?
Provee: Suite ID, org y título base (o confirma los valores por defecto).
```

Si el usuario confirma, usa:
```
mcp_ado_testplan_create_test_case({ ... })
mcp_ado_testplan_add_test_cases_to_suite({ suiteId: <SUITE_ID>, ... })
```

Si el contexto fue un **TC/TP ADO existente**, marca el TC como automatizado:
```
mcp_ado_wit_update_work_item({
  id: <TC_ID>, project: "AUTOREG",
  fields: { "Microsoft.VSTS.TCM.AutomationStatus": "Automated" }
})
```

---

## Resumen del flujo conversacional

```
Usuario: "comienza" / "start" / "inicio"
    ↓
Agente prepara entorno → imprime comando codegen → PAUSA
    ↓
Usuario pega código codegen
    ↓
Usuario pasa TC/TP de ADO  ──OR──  descripción directa
    ↓
Usuario pasa variantes (opcional)  ──OR──  "continuar"
    ↓
Agente construye, ejecuta y corrige el test
    ↓
Test verde ✅
    ↓
Si vino de instrucción directa → preguntar si crear TCs en ADO
Si vino de ADO → marcar TC como Automated
```

---

## Tabla de entradas reconocidas

| Entrada del usuario | Acción del agente |
|---|---|
| "comienza" / "start" / "inicio" / "init" | FASE 0: preparar entorno + imprimir codegen |
| Código Playwright pegado | FASE 1: almacenar happy path |
| "TC: 9360" / "TP: 9361, org: AutoregPR" | FASE 2A: fetch ADO MCP |
| Descripción en lenguaje natural | FASE 2B: usar como guía directa |
| "paso N: condición → resultado" | FASE 3: agregar lógica condicional |
| "continuar" / sin variantes | FASE 4: build + ejecutar |
| "sin codegen" | Omitir FASE 1, ir directo a FASE 2 |
| Errores / código roto | FASE 4: diagnóstico + corrección |

---

## MCP Azure DevOps — Comandos disponibles

```
# Obtener un TC por ID
mcp_ado_wit_get_work_item({ id: <TC_ID>, org: "AutoregPR", project: "AUTOREG" })

# Obtener múltiples TCs en batch
mcp_ado_wit_get_work_items_batch_by_ids({ ids: [9360, 9364], project: "AUTOREG" })

# Buscar TCs por texto
mcp_ado_search_workitem({ searchText: "Preventas Excel", project: "AUTOREG" })

# Crear TC nuevo
mcp_ado_testplan_create_test_case({ title: "...", project: "AUTOREG" })

# Agregar TC a suite
mcp_ado_testplan_add_test_cases_to_suite({ planId: 9361, suiteId: 9363, testCaseIds: [...] })

# Marcar TC como automatizado
mcp_ado_wit_update_work_item({
  id: <TC_ID>, project: "AUTOREG",
  fields: { "Microsoft.VSTS.TCM.AutomationStatus": "Automated" }
})
```

> **Regla absoluta:** El agente NUNCA pide al usuario que copie pasos manualmente.
> TODO fetch de TC/TP se hace vía MCP.
> Org/proyecto por defecto: **AutoregPR / AUTOREG** si no se indica otro.

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
