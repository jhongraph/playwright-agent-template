# Agent Architecture — Playwright E2E System

## 1. Orquestador (MANDATORIO)

Responsabilidad:
- Controlar el flujo completo
- Delegar tareas a agentes
- Reintentar SOLO fases necesarias

Prohibido:
- Ejecutar lógica de negocio
- Crear código directamente

---

## 2. Agentes

### 2.1 Planner Agent (Modelo tipo OX)

Responsabilidad:
- Interpretar test case
- Dividir flujo en pantallas
- Identificar datos y validaciones

Output:
```json
{
  "screens": [],
  "fields": {},
  "validations": []
}
```

### 2.2 Discovery Agent (Modelo tipo Sonnet + Playwright MCP) ⚠️ OBLIGATORIO

Responsabilidad:
- Navegar la app con MCP Browser BEFORE escribir cualquier selector
- Extraer selectores reales con JS eval en cada pantalla
- Detectar tecnología frontend (ASP.NET WebForms / SPA / Angular)
- Detectar campos JS-RESTRICTED (oninput / onkeypress)
- Detectar AutoPostBack en selects (señal: codegen registra goto a misma URL)

**REGLA DE ORO:** Si el Discovery Agent no fue ejecutado, el Selector Manager
Agent NO puede construir el banco de selectores. Esta es una dependencia BLOQUEANTE.

Script obligatorio por pantalla:
```js
Array.from(document.querySelectorAll('[id]'))
  .filter(e => ['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.tagName))
  .filter(e => e.offsetParent !== null)
  .map(e => ({ id: e.id, tag: e.tagName, type: e.type,
               oninput: e.getAttribute('oninput'),
               onkeypress: e.getAttribute('onkeypress') }))
```

### 2.3 Selector Manager Agent

Responsabilidad:
- Construir banco central de selectores SOLO con IDs confirmados por Discovery Agent
- Reutilizar selectores existentes
- Marcar campos JS-RESTRICTED con comentario

Prioridad: id > name > data-testid > aria-label > css estable > xpath (último recurso)

### 2.4 Data Agent

Responsabilidad:
- Manejar datos de prueba
- Pools consumibles (VINs, placas, números de contrato)
- Retry logic

### 2.5 Test Builder Agent

Responsabilidad:
- Generar fixture + spec con helpers del playwright-guide.md
- Campos JS-RESTRICTED → usar `safeSetValue()` automáticamente
- Verificar `inputValue()` después de cada fill
- Usar `logEmptyFields()` como diagnóstico (no assert duro) antes de submit

### 2.6 QA Validator Agent

Responsabilidad:
- Detectar anti-patterns (selector de texto cuando hay id, waitForTimeout, etc.)
- Validar que todos los selectors tienen evidencia de Discovery Agent
- Rechazar fixture sin LOCATOR_EVIDENCE comments

---

## 3. Flujo Obligatorio

```
1. Orquestador recibe TC + codegen
2. Discovery Agent → inventariar selectores + detectar JS-RESTRICTED + AutoPostBack
3. Selector Manager → banco de selectores con evidencia
4. Planner Agent → plan de pantallas
5. Test Builder → fixture + spec usando safeSetValue donde aplica
6. Compile check (tsc --noEmit)
7. Ejecutar → si falla: Discovery Agent diagnostica → Test Builder corrige → repetir
```
Discovery Agent explora
Selector Manager consolida
Data Agent prepara datos
Test Builder genera código
QA Validator valida
Ejecutar test
Si falla → volver SOLO a fase necesaria