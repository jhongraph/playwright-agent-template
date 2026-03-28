# Execution Rules — Playwright E2E

## REGLA 1 — Esperas obligatorias

Siempre usar:
- `waitForLoadState('networkidle')`
- Para ASP.NET: también esperar que UpdatePanel no esté en postback

Prohibido:
- `page.waitForTimeout()` — NUNCA

---

## REGLA 2 — Selectores (prioridad estricta)

Prohibido:
- nth-child, xpath dinámico, texto parcial si existe `id`

Obligatorio:
- PRIORITY 1: `#id` si el elemento tiene `id`
- PRIORITY 2: `[name="x"]` si no hay id pero hay name único
- PRIORITY 7 (último recurso): `button:has-text(...)` solo sin id/name/value

**⛔ BLOQUEANTE — ANTES de escribir cualquier selector:**
Verificar en MCP Browser que el `id` existe y es el correcto.
El YAML/código de referencia puede tener IDs obsoletos o incorrectos.

---

## REGLA 3 — Orden de llenado

1. Selects primero (cada uno puede disparar AutoPostBack)
2. Inputs de texto DESPUÉS del último select
3. Campos críticos / consumibles AL FINAL

Si hay AutoPostBack en un select → todos los inputs se resetean.
Rellenar inputs SIEMPRE después del último select con postback.

---

## REGLA 4 — No sobrescribir datos pre-llenados

Usar `setIfBlank()` — solo llena si el campo está vacío o en '0'.

---

## REGLA 5 — Click seguro

- Verificar `toBeVisible` + `toBeEnabled` antes de click
- Nunca hacer click ciego

---

## REGLA 6 — Validación pre-submit (DIAGNÓSTICO, no assert duro)

Antes de Continuar, ejecutar `logEmptyFields()` que:
- Imprime los campos vacíos como `console.warn`
- Toma screenshot para diagnóstico
- **NO** lanza `expect().toHaveLength(0)` — ese assert bloquea corrección automática

Usar assert duro SOLO en el resultado final (número de caso, confirmación).

---

## REGLA 7 — Diagnóstico obligatorio ante fallo

1. Capturar screenshot
2. Leer errores UI (`[class*="error"]`, validators ASP.NET visibles)
3. Diagnosticar causa (postback? selector? handler JS?)
4. Corregir Y LUEGO reintentar
5. Nunca repetir el mismo click sin cambio previo

---

## REGLA 8 — Uploads

- Input nativo: `setInputFiles()`
- Telerik RadAsyncUpload: esperar `WebResource.axd` response
- Validar que el archivo llegó al servidor antes de continuar

---

## REGLA 9 — Screenshots

Obligatorio en:
- Inicio de cada pantalla (después de navigate)
- Antes de cada click Continuar
- Cuando ocurre cualquier error

---

## REGLA 10 — Auto-mejora

Cada error corregido → actualizar este archivo con la regla aprendida.

---

## REGLA 11 — Verificar fill() exitoso ⚠️ CRÍTICA

Después de cada `fill()` o `selectOption()`, leer el valor con `inputValue()`.
Si el valor quedó vacío o incorrecto → aplicar estrategia `safeSetValue()`:

```ts
async function safeSetValue(page: Page, selector: string, value: string): Promise<void> {
  const loc = page.locator(selector);
  await loc.click();
  await loc.fill(value);
  const current = await loc.inputValue();
  if (!current || current === '') {
    // Fallback: asignar via evaluate (evita onkeypress/oninput restrictivos)
    await page.evaluate((args) => {
      const el = document.getElementById(args.id) as HTMLInputElement;
      if (el) {
        el.value = args.val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { id: selector.replace('#', ''), val: value });
  }
}
```

Campos con `oninput="validateInput(this)"` o `onkeypress="return allowAlphaNumericOnly(event)"` → siempre usar `safeSetValue()`.

---

## REGLA 12 — Campos con validadores JS restrictivos

Detectar con MCP Browser antes de escribir el test:
```js
const el = document.getElementById('ID_DEL_CAMPO');
console.log(el.getAttribute('oninput'), el.getAttribute('onkeypress'));
```

Si tiene `onkeypress` o `oninput` restrictivos:
- Usar `safeSetValue()` (REGLA 11) en lugar de `fill()`
- Documentar el campo en el fixture con comentario `// JS-RESTRICTED`

---

## REGLA 13 — AutoPostBack: recarga completa del formulario

En ASP.NET WebForms, un `<select>` con AutoPostBack hace postback COMPLETO:
- Todos los `<input>` quedan vacíos tras el postback
- Solución: rellenar inputs SIEMPRE después del último select
- Si el codegen muestra `page.goto(mismaURL)` después de un select → es señal de AutoPostBack con reseteo de campos