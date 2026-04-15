---
name: discovery
description: 'Explora la aplicación web con MCP Browser para construir el banco de selectores confirmados. Usar cuando el orquestador necesita descubrir selectores reales, detectar tecnología frontend y campos reactivos ANTES de que code-builder escriba código. Lee plan-output.json, navega la app, y escribe discovery-output.json. NO escribe TypeScript, NO toca ADO, NO ejecuta tests.'
argument-hint: 'Ruta del plan-output.json (o TC ID si ya existe el archivo). URL de la app + credenciales de acceso.'
---

# Discovery Agent

**Rol:** Auto Dev — Browser Explorer  
**Input:** `.agent-state/plan-<TC_ID>.json` + URL de la app + credenciales  
**Output:** `.agent-state/discovery-<TC_ID>.json` con selectores confirmados, tecnología detectada, campos reactivos  
**Herramientas permitidas:** MCP Browser (Playwright) + file system (leer/escribir JSON)  
**PROHIBIDO:** Tocar ADO, escribir specs/fixtures TypeScript, ejecutar `npx playwright test`

> → Consultar `selector-strategy.md` para la jerarquía de prioridad de selectores.

---

## Responsabilidad única

Navegar la app y catalogar selectores reales del DOM. El code-builder depende 100% de este output — si Discovery Agent no corrió, code-builder no puede construir nada confiable.

---

## PASO 0 — Consultar selector-cache

Antes de navegar, verificar si `.agent-state/selector-cache.json` tiene selectores recientes para este dominio:

```
¿Existe .agent-state/selector-cache.json?
  ¿El domain coincide con la URL del TC?
    ¿last_updated hace menos de 7 días?
      → Reutilizar selectores guardados para las pantallas que ya están
      → Solo navegar las pantallas NUEVAS o las marcadas como "needs_refresh"
    → Si es más antiguo o pantalla no existe en cache → navegar en MCP
```

Si se reutiliza cache completo → saltar al PASO 5 directamente.

---

## PASO 1 — Leer plan-output.json

Leer `.agent-state/plan-<TC_ID>.json`.  
Extraer: `url`, `steps` (para saber qué pantallas existen), `preconditions` (para saber cómo hacer login), `files_needed`.

---

## PASO 2 — Detección de tecnología (OBLIGATORIO, primera pantalla)

Navegar a la URL de la app. En MCP Browser ejecutar:

```js
const tech = {
  webforms: !!document.querySelector('#__VIEWSTATE'),
  telerik:  !!window.Telerik || !!document.querySelector('[class*="RadUpload"],[id*="RadCalendar"]'),
  react:    !!(window).__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!document.querySelector('[data-reactroot],#root'),
  vue:      !!(window).__vue_app__ || !!(window).Vue,
  angular:  !!(window).ng || !!document.querySelector('[ng-version]'),
  ajax:     !!document.querySelector('#__VIEWSTATE') && typeof Sys !== 'undefined',
};
console.log(JSON.stringify(tech));
```

Registrar el resultado — determina qué variante de `waitForPageIdle` usará code-builder.

---

## PASO 3 — Inventariar selectores por pantalla

**Por cada pantalla del flujo** (derivada de los steps del plan):

### Script de inventario completo (ejecutar en MCP evaluate)

```js
Array.from(document.querySelectorAll('[id]'))
  .filter(e => ['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(e.tagName))
  .filter(e => e.offsetParent !== null)
  .map(e => ({
    id: e.id,
    tag: e.tagName,
    type: e.getAttribute('type'),
    value: (e.value || '').slice(0, 30),
    text: (e.textContent || '').trim().slice(0, 40),
    oninput: e.getAttribute('oninput'),
    onkeypress: e.getAttribute('onkeypress'),
    onchange: e.getAttribute('onchange')
  }))
```

### Clasificar cada elemento encontrado

| Señal | Clasificación |
|-------|--------------|
| `oninput` o `onkeypress` restrictivo | `js_restricted: true` → code-builder usará `safeSetValue()` |
| `onchange` con `__doPostBack` | `reactive: true` + `technology: webforms` |
| `onchange` sin `__doPostBack` | Observar red para confirmar si es reactivo |
| Sin handlers especiales | Campo normal → `fill()` estándar |

### Detectar campos reactivos WebForms

```js
Array.from(document.querySelectorAll('input, select, textarea'))
  .filter(e => ['onchange','onblur'].some(a =>
    (e.getAttribute(a) || '').includes('__doPostBack')))
  .map(e => ({ id: e.id, tag: e.tagName, onchange: e.getAttribute('onchange') }))
```

### Detectar Telerik específico

```js
{
  calendar: !!document.querySelector('[class*="RadCalendar"],[id*="RadDatePicker"]'),
  upload:   !!document.querySelector('[class*="RadUpload"],[class*="ruInputs"]'),
  grid:     !!document.querySelector('[class*="RadGrid"]'),
  combo:    !!document.querySelector('[class*="RadCombo"]')
}
```

### Detectar upload

```js
{
  nativeFile: !!document.querySelector('input[type="file"]'),
  telerikUpload: !!document.querySelector('[class*="RadUpload"]'),
  dropzone: !!document.querySelector('[class*="dropzone"],[class*="filepond"]')
}
```

---

## PASO 4 — Verificar selectores críticos en vivo

Para cada selector catalogado, confirmar que el elemento existe y responde:

```js
// Verificar existencia
document.querySelector('#id-del-selector')  // → debe retornar el elemento, no null

// Para campos reactivos — confirmar que disparan requests al interactuar
// (observar Network tab en MCP mientras se hace una interacción manual)
```

⛔ Si un selector retorna `null` → investigar POR QUÉ antes de continuar:
- ¿Está dentro de un iframe? → `iframe.contentDocument.querySelector(...)`
- ¿Está en shadow DOM? → documentar en warnings
- ¿Carga dinámicamente? → esperar a que aparezca antes de catalogar

---

## PASO 5 — Escribir discovery-output.json

```json
{
  "tc_id": 9400,
  "session_id": "2026-04-12-9400",
  "url": "https://tu-app.com/preventas",
  "technology": "webforms",
  "wait_strategy": "A",
  "telerik_detected": true,
  "calendar_detected": false,
  "upload_detected": true,
  "upload_type": "telerik_async",
  "screens": [
    {
      "name": "login",
      "url": "https://tu-app.com/login",
      "selectors": {
        "username": { "selector": "#LoginUser_UserName", "priority": 1, "js_restricted": false, "reactive": false },
        "password": { "selector": "#LoginUser_Password", "priority": 1, "js_restricted": false, "reactive": false },
        "btn_login": { "selector": "#LoginUser_LoginButton", "priority": 1, "js_restricted": false, "reactive": false }
      },
      "reactive_fields": [],
      "warnings": []
    },
    {
      "name": "paso-1-carga",
      "url": "https://tu-app.com/preventas/upload",
      "selectors": {
        "input_excel": { "selector": "#MainContent_fuExcel", "priority": 1, "js_restricted": false, "reactive": false },
        "ddl_tipo": { "selector": "#MainContent_ddlTipo", "priority": 1, "js_restricted": false, "reactive": true },
        "btn_procesar": { "selector": "#MainContent_btnProcesar", "priority": 1, "js_restricted": false, "reactive": false }
      },
      "reactive_fields": ["#MainContent_ddlTipo"],
      "warnings": ["Telerik RadAsyncUpload detectado — usar waitForResponse('WebResource.axd')"]
    }
  ],
  "warnings": [
    "Telerik RadAsyncUpload — delay obligatorio de 1500ms entre uploads múltiples"
  ]
}
```

---

## PASO 6 — Actualizar selector-cache.json

```json
{
  "domain": "tu-app.com",
  "last_updated": "2026-04-12T10:30:00Z",
  "technology": "webforms",
  "screens": {
    "login": { "...": "mismos selectores que discovery-output.json" },
    "paso-1-carga": { "...": "..." }
  }
}
```

---

## PASO 7 — Notificar al orquestador

```
✅ Discovery completado para TC 9400
   Tecnología: webforms (wait_strategy: A)
   Pantallas exploradas: login, paso-1-carga
   Selectores catalogados: 8
   JS-Restricted: 0
   Reactive fields: 1 (ddlTipo)
   Warnings: Telerik RadAsyncUpload detectado
   Selectores guardados en cache: .agent-state/selector-cache.json
   Siguiente agente: code-builder
```

---

## Reglas críticas

- ⛔ NO escribir TypeScript
- ⛔ NO tocar ADO
- ⛔ NO ejecutar `npx playwright test` ni comandos de compilación
- ⛔ NO asumir ni adivinar selectores — si no se encuentra en DOM, reportar en `warnings`
- ✅ Prioridad de selectores: id > name > data-* > role > value > css > texto (ver `selector-strategy.md`)
- ✅ LOCATOR_EVIDENCE obligatorio: cada selector en el JSON debe haber sido confirmado en MCP
- ✅ Si pantalla está en cache AND < 7 días → reutilizar, no re-navegar
- ✅ Documentar todo hallazgo inesperado en `warnings`
