# Execution Rules — Playwright E2E

## REGLA 1 — Esperas obligatorias

Siempre usar `waitForPageIdle()` — la variante depende de la tecnología detectada en FASE 1:

| Tecnología | Variante |
|---|---|
| ASP.NET WebForms / UpdatePanel | Variante A — `networkidle` + verificar `PageRequestManager` |
| React / Vue / Angular (SPA) | Variante B — `networkidle` + esperar que desaparezcan spinners / `[aria-busy]` |
| Tecnología desconocida | Variante C — combinar A + B con `.catch(() => {})` |

Ver implementación en `playwright-guide.md`.

Prohibido:
- `page.waitForTimeout()` — NUNCA

---

## REGLA 2 — Selectores (prioridad estricta)

Prohibido:
- nth-child, xpath dinámico, texto parcial si existe `id`

Obligatorio — jerarquía completa (ver `selector-strategy.md` para detalles):

| P | Tipo | Condición |
|---|---|---|
| 1 | `#id` | Existe `id` — **SIEMPRE usar** |
| 2 | `[name="x"]` | `name` único en página |
| 3 | `[data-x="y"]` | Atributo `data-*` semántico |
| 4 | `getByRole(role, {name})` | Elemento tiene role y label accesible |
| 5 | `input[value="x"]` | Sin ID ni name, tiene value estable |
| 6 | CSS estructural | Combinación estable sin texto |
| 7 | `button:has-text(...)` | ⚠️ ÚLTIMO RECURSO — solo sin id/name/value |

**⛔ BLOQUEANTE — ANTES de escribir cualquier selector:**
Verificar en MCP Browser que el `id` existe y es el correcto.
El YAML/código de referencia puede tener IDs obsoletos o incorrectos.

---

## REGLA 3 — Orden de llenado

> Un **campo reactivo** es cualquier campo cuya interacción dispara una llamada al servidor que puede resetear, rellenar o deshabilitar otros campos. Existe en WebForms (`__doPostBack`), React/Vue (`onChange` → fetch), Angular (`valueChanges` → HTTP), etc.

1. Identificar campos reactivos (FASE 1 — Detección de Campos Reactivos del skill)
2. Llenar primero los campos que NO son reactivos ni dependen de otros
3. Llenar campos reactivos → `waitForPageIdle()` después de cada uno
4. Llenar campos que dependen del resultado del reactivo DESPUÉS del `waitForPageIdle()`
5. Campos que el servidor puede resetear → llenar siempre AL FINAL

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
2. Leer errores UI (`[class*="error"]`, `[class*="alert"]`, `[aria-invalid]`, validators del framework visibles)
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
Si el valor quedó vacío o incorrecto → aplicar `safeSetValue()`.

> Implementación canónica en `playwright-guide.md` — usar esa versión, no duplicar aquí.
> Diferencia clave: usa `selector.startsWith('#') ? selector.slice(1) : selector` para extraer el ID limpio.

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

## REGLA 13 — Campos Reactivos: reseteo de formulario

Cualquier framework puede tener campos que al cambiar su valor disparan una solicitud al servidor que resetea otros campos:

| Framework | Señal en codegen | Mecanismo |
|---|---|---|
| ASP.NET WebForms | `page.goto(mismaURL)` después de `selectOption()` | `__doPostBack` — postback completo, todos los inputs se vacían |
| React / Vue | request XHR/fetch después de `selectOption()` o `fill()` | `onChange` → setState → re-render puede limpiar campos dependientes |
| Angular | request HTTP después de interacción | `valueChanges` → llamada a servicio → formulario parcialmente reseteado |

**Solución universal:** rellenar los campos dependientes SIEMPRE después del `waitForPageIdle()` del campo reactivo.