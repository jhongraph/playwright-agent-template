# Copilot Execution Entry

---

## ⚡ SELECTOR DE SKILL — Leer PRIMERO antes de cualquier acción

| Si el usuario menciona... | Skill a cargar |
|---------------------------|---------------|
| "inicia", "automatiza", "convierte a código", TC ID + codegen | `playwright-e2e` → seguir Protocolo principal abajo |
| "ejecuta test plan", "corre TP", "documenta resultados", "sube evidencia", "reportar en ADO", Plan ID / Suite ID sin "automatizar" | `qa-execution-reporter` → cargar skill y seguir sus fases al pie de la letra |
| "crea test cases", "redacta TCs", "genera casos de prueba" | `create-test-cases` → cargar skill |

⛔ **No mezclar flujos.** Si la instrucción activa `qa-execution-reporter`, ignorar el Protocolo principal de esta página.

---

## Protocolo principal — TC ID + Org → Test automatizado completo

El flujo estándar se activa cuando el usuario dice "inicia" o indica que quiere automatizar.
El agente completa TODO el trabajo — el usuario hace DOS cosas: ejecutar el codegen y proveer el TC ID.
El agente construye, ejecuta y verifica el test. El usuario solo recibe el resultado cuando está en verde ✅.

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
PASO 4A — Usuario pegó código codegen  ⛔ BLOQUEANTE — NO escribir fixture sin completar este paso
  → El codegen es el MAPA DEL FLUJO (qué pantallas, qué interacciones)
     NO es la fuente de selectores — sus IDs/clases pueden estar desactualizados
  → Para CADA pantalla del flujo:
       1. Navegar con MCP Browser
       2. Ejecutar JS inventory: Array.from(document.querySelectorAll('[id]'))
          .filter(e=>['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(e.tagName))
          .map(e=>({id:e.id,tag:e.tagName,type:e.type}))
       3. Asignar selector PRIORITY 1 (#id real del DOM) — no copiar del codegen ni del YAML
       4. Si el codegen usó clase CSS → buscar el id real del mismo elemento
  → Recién entonces: escribir fixture con selectores 100% confirmados
  → Completar assertions, screenshots, helpers
       ↓
PASO 4B — Usuario dice "sin codegen" / no responde con código
  → Aplicar FASE 1: navegar la app via MCP, descubrir selectores
  → Construir fixture + spec desde cero usando el TC como guía
       ↓
PASO 4C — ⛔ BLOQUEANTE — Verificación en vivo de TODOS los selectores antes de construir
  Con todos los selectores catalogados en mano, usar MCP Browser para recorrer el flujo
  COMPLETO sin escribir código — solo confirmando que cada selector responde:

  Por cada pantalla del flujo, en MCP Browser:
    1. Navegar a la pantalla
    2. Para cada selector del catálogo, ejecutar:
       document.querySelector('#el-id-del-selector')  →  ¿retorna el elemento correcto?
    3. Para campos reactivos: interactuar y observar si el network request se dispara
    4. Para botones de navegación: verificar que son clickeables (visible + enabled)
    5. Para uploads: verificar que el input file existe y es accesible
    6. Si algún selector NO responde como se espera:
       → Investigar POR QUÉ antes de continuar
       → Revisar si el elemento está dentro de un iframe, shadow DOM, o carga dinámica
       → Ajustar el selector en el catálogo
       → Re-verificar hasta que responda correctamente
  ⛔ NO pasar a construcción hasta que el 100% de selectores estén verificados en vivo
  ⛔ NO adivinar ni asumir — si un selector falla en esta fase, fallará en el test
       ↓
PASO 5 — El agente ejecuta y verifica el test (autonomamente)
  → Verificar compile: tsc --noEmit
  → El AGENTE ejecuta: npx playwright test <archivo> --headed
  → Leer la salida completa del test
  → Si falla:
       1. Leer el reporte HTML + screenshots adjuntos para entender el estado visual
       2. Leer el error exacto del terminal
       3. ⛔ ANTES de tocar el código — volver a MCP Browser:
          → Navegar a la pantalla donde falló
          → Ejecutar el selector que falló: ¿sigue respondiendo?
          → Si es un campo reactivo: ¿sigue disparando el request esperado?
          → Si es un elemento de resultado: ¿apareció en el DOM? ¿con qué selector?
          → Reproducir manualmente la acción que falló y observar
       4. Solo cuando hay una causa clara y confirmada en el DOM real:
          → Corregir el fixture/spec
          → Re-ejecutar
       5. NUNCA refactorizar ni hacer cambios sin diagnóstico previo confirmado en MCP
       6. NUNCA repetir el mismo click/acción sin cambio previo
  → Repetir hasta que el agente vea ✅ en la salida del terminal
  ⛔ PROHIBIDO decirle al usuario "ya está listo, córrelo" si el agente
     no ejecutó el test o si el último resultado fue un fallo
       ↓
RESULTADO FINAL:
  → El agente confirma: test pasó en verde ✅ (con evidence del output)
  → Entregar al usuario SOLO el comando de re-ejecución:
    "npx playwright test tests/<archivo>.spec.ts --headed"
```

> **Regla absoluta:** El agente NO pide al usuario que instale nada, cree carpetas,
> configure nada ni ejecute tests para verificar. Toda preparación técnica y verificación
> es responsabilidad del agente.
> El usuario hace DOS cosas: ejecutar codegen + proveer TC ID.
> El agente hace todo lo demás: verificar selectores en vivo, construir, correr, corregir,
> y solo entregar el comando final cuando el test ya pasó verde.

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

## Manejo de TCs Variantes — Enriquecer el test, no replicarlo

Cuando el usuario provee un conjunto de TCs que incluye un **Happy Path + Variantes** (validaciones, errores, casos límite):

> ⛔ **PROHIBIDO** crear archivos de test separados para cada variante.
> Las variantes NO se automatizan por separado. Son conocimiento del sistema.

### Qué hacer con las variantes

1. Leer TODOS los TCs del conjunto antes de escribir una línea de código
2. Extraer de cada variante la **condición adversa** que el sistema maneja:
   - ¿Qué campo lo dispara?
   - ¿Qué mensaje o bloqueo presenta el sistema?
   - ¿Bajo qué condición ocurre?
3. Traducir ese conocimiento en **lógica de resiliencia** dentro del spec del happy path:
   - Detección del error → reintento con dato alternativo
   - Verificación de que el sistema bloqueó correctamente → continuar si no bloqueó
4. El resultado final es UN solo spec más robusto, no múltiples specs

**Ejemplo:** Si una variante dice "VIN duplicado → sistema bloquea y no avanza" →
el spec del happy path debe detectar ese bloqueo tras un Continuar y reintentar con otro VIN del pool.

### Patrón de Reintento por VIN (hasta 5 intentos)

Cuando el sistema rechaza un VIN (formato inválido, ya registrado, u otro error en Paso 1):

```ts
const MAX_VIN_RETRIES = 5;
let vinAttempts = 0;
let paso1Ok = false;

while (!paso1Ok && vinAttempts < MAX_VIN_RETRIES) {
  const vin = consumeItem('vins');
  vinAttempts++;
  console.log(`[VIN intento ${vinAttempts}/${MAX_VIN_RETRIES}] ${vin}`);

  // Llenar Paso 1 con el nuevo VIN
  await fillPaso1(page, vin);
  await clickContinuar(page);

  // Detectar si el sistema bloqueó por error de VIN
  // (mensaje de advertencia visible en los primeros 3 segundos)
  const vinBloqueado = await page.locator('#selector-del-mensaje-vin-error')
    .isVisible({ timeout: 3_000 }).catch(() => false);

  if (!vinBloqueado) {
    paso1Ok = true; // avanzó correctamente → VIN aceptado
  } else {
    console.log(`[VIN intento ${vinAttempts}] Rechazado: ${vin}`);
    await page.reload(); // o volver al estado inicial del paso 1
    await waitForPageIdle(page);
  }
}

if (!paso1Ok) {
  throw new Error(`VIN rechazado en los ${MAX_VIN_RETRIES} intentos. Revisar pool de VINs.`);
}
```

> **Nota:** El selector del mensaje de error de VIN debe ser verificado en MCP Browser
> durante la FASE 1 — no asumir su ID. Agregar al catálogo de selectores con comentario
> `// ⚠️ Selector de advertencia VIN`.

### Regla general para otros campos con resiliencia similar

El mismo patrón aplica a cualquier campo con datos consumibles de un solo uso:
- Detectar el mensaje de rechazo del sistema
- Consumir el siguiente ítem del pool
- Reintentar hasta N veces configurables
- Fallar con mensaje claro si se agotan los intentos

---

## MCP Azure DevOps — OBLIGATORIO para TCs

TODO acceso a Test Cases, Work Items o información del proyecto
**DEBE** realizarse vía el MCP de Azure DevOps. Prohibido copiar/pegar pasos manualmente.

### Inferir org y proyecto

- Si el usuario da solo el ID → usar org/proyecto por defecto: **`<TU_ORG>` / `<TU_PROYECTO>`**
- Si el usuario da org diferente → usar la indicada
- **NUNCA** pedir al usuario que copie y pegue los pasos del TC manualmente

### Comandos MCP disponibles

```
# Obtener un TC por ID
mcp_ado_wit_get_work_item({ id: <TC_ID>, project: "<TU_PROYECTO>" })

# Obtener múltiples TCs en batch
mcp_ado_wit_get_work_items_batch_by_ids({ ids: [9360, 9364, ...], project: "<TU_PROYECTO>" })

# Buscar TCs por texto
mcp_ado_search_workitem({ searchText: "Preventas Excel", project: "<TU_PROYECTO>" })

# Marcar TC como automatizado al terminar
mcp_ado_wit_update_work_item({
  id: <TC_ID>, project: "<TU_PROYECTO>",
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

---

## ⛔ PASOS BLOQUEANTES — No avanzar sin completarlos

### Al recibir código codegen (PASO 4A):
Ver PASO 4A y PASO 4C del protocolo principal — el proceso completo está definido allí.
Resumen: codegen = mapa del flujo → descubrir selectores reales en MCP (PASO 4A) → verificar en vivo que todos responden (PASO 4C) → solo entonces construir.
⛔ PROHIBIDO copiar IDs del codegen o del YAML sin verificarlos en el DOM real.

### Al llenar campos:
- Usar `safeSetValue()` para campos JS-RESTRICTED (ver `playwright-guide.md`)
- Verificar con `inputValue()` que el valor quedó después de `fill()`
- Si `fill()` deja el campo vacío → aplicar fallback `page.evaluate` automáticamente

### Al ejecutar el test y fallar:
Seguir el flujo completo definido en PASO 5 del protocolo principal (arriba).
Resumen: reporte + screenshot → MCP Browser para confirmar causa → corregir → re-ejecutar.
⛔ NUNCA corregir sin diagnóstico previo confirmado en MCP Browser.

### Señales de Campos Reactivos en el codegen:
Detectar si un campo dispara una solicitud al servidor observando el codegen:

| Señal en codegen | Framework | Significado |
|---|---|---|
| `page.goto(mismaURL)` después de `selectOption()` | ASP.NET WebForms | PostBack completo — todos los inputs se resetean |
| Request XHR/fetch en Network tras `selectOption()` o `fill()` | React / Vue | `onChange` → fetch → re-render puede limpiar dependientes |
| Request HTTP tras interacción con campo | Angular | `valueChanges` → servicio → formulario parcialmente reseteado |

**Solución universal:** llenar los campos dependientes SIEMPRE DESPUÉS del `waitForPageIdle()` del campo reactivo.
