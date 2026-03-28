# Selector Strategy

## ⛔ REGLA BLOQUEANTE: Verificar selectores via MCP Browser ANTES de escribir fixture

El código codegen y el YAML de referencia pueden tener IDs incorrectos/obsoletos.
JAMÁS copiar un ID sin verificarlo en el DOM real.

### Script de verificación (pegar en MCP evaluate cada pantalla)
```js
// Inventariar TODOS los controles interactivos con ID
Array.from(document.querySelectorAll('[id]'))
  .filter(e => ['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.tagName))
  .filter(e => e.offsetParent !== null)
  .map(e => ({ id: e.id, tag: e.tagName, type: e.type, value: e.value.slice(0,20),
               oninput: e.getAttribute('oninput'),
               onkeypress: e.getAttribute('onkeypress') }))
```

---

## Prioridad de selectores

| P | Tipo | Ejemplo | Condición |
|---|------|---------|----------|
| 1 | `#id` | `#MainContent_btnOK` | Existe `id` — **SIEMPRE** |
| 2 | `[name="x"]` | `[name="txtUser"]` | `name` único en página |
| 3 | `[data-x]` | `[data-action="submit"]` | Atributo semántico |
| 4 | role+name | `getByRole('button',{name:'OK'})` | Rol accesible |
| 5 | value | `input[value="Continuar"]` | Sin ID ni name |
| 6 | CSS estable | `#form1 input[type=text]` | Combinación estructural |
| 7 | texto | `button:has-text("Enviar")` | ⚠️ Último recurso |

**⛔ PROHIBIDO** usar P=7 si hay `id`, `name` o `value` disponible.

---

## Formato del banco de selectores en fixture

```ts
export const SEL = {
  // ── PANTALLA N — nombre ──────────────────────────────────
  // LOCATOR_EVIDENCE: id="MainContent_btnX" confirmado via MCP JS eval
  formN: {
    campo1:  '#MainContent_campo1',    // PRIORITY 1 — id confirmado
    campo2:  '#ctl00_Main_campo2',     // PRIORITY 1 — id confirmado — JS-RESTRICTED (oninput)
    btnOk:   'input[value="Aceptar"]', // PRIORITY 5 — sin id, tiene value
    continuar: '#PageFunctionsContent_ucRightFunctionBox_lvwFunctions_imbFunction_0',
  },
};
```

---

## Reglas del banco

- No duplicar selectores entre pantallas
- Si el selector cambia en un paso → actualizar el banco, no crear uno nuevo
- Si un campo es JS-RESTRICTED → comentarlo y usar `safeSetValue()` en el spec
- Si no se encuentra el elemento → buscar en MCP, nunca adivinar