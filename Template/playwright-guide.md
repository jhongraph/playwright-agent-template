# Playwright Implementation Guide

## Estructura de carpetas

```
fixtures/
  <flujo>.fixture.ts   ← SEL, TEST_DATA, helpers
  files/
    dummy.pdf
helpers/
  data-manager.ts      ← consumeItem() para datos de pool
tests/
  <flujo>.spec.ts
data/
  test-data.json
```

---

## Fixture — estructura obligatoria

```ts
export const TEST_DATA = { /* todos los valores del TC */ };

export const SEL = {
  // comentario: id="xxx" confirmado via MCP Browser JS eval
  login: { username: '#LoginUser_UserName', ... },
  form1: { campo: '#id-real-confirmado', ... },  // JS-RESTRICTED si tiene oninput/onkeypress
};
```

---

## Spec — estructura obligatoria

```ts
test.describe('Flujo', () => {
  test('HP-01 | descripcion', async ({ page }, testInfo) => {
    const ss = makeScreenshot(page, testInfo);
    await loginFlujo(page);
    await ss('00-home');
    // ... pantallas
  });
});
```

---

## Helpers obligatorios

### `waitForPageIdle(page)` — ASP.NET UpdatePanel
```ts
async function waitForPageIdle(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => {
    const prm = (window as any).Sys?.WebForms?.PageRequestManager?.getInstance?.();
    return !prm || !prm.get_isInAsyncPostBack();
  }, { timeout });
}
```

### `safeSetValue(page, selector, value)` — REGLA 11 ⚠️
```ts
async function safeSetValue(page: Page, selector: string, value: string): Promise<void> {
  const loc = page.locator(selector);
  await loc.click();
  await loc.fill(value);
  const current = await loc.inputValue().catch(() => '');
  if (!current || current.replace(/[^a-zA-Z0-9]/g, '') === '') {
    // fill() no funcionó (oninput/onkeypress restrictivo) → evaluate como fallback
    const rawId = selector.startsWith('#') ? selector.slice(1) : selector;
    await page.evaluate((args: { id: string; val: string }) => {
      const el = document.getElementById(args.id) as HTMLInputElement;
      if (!el) return;
      el.value = args.val;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { id: rawId, val: value });
  }
}
```

### `setIfBlank(page, locator, value)` — REGLA 4
```ts
async function setIfBlank(page: Page, locator: Locator, value: string,
  opts: { isSelect?: boolean; allowZero?: boolean } = {}): Promise<void> {
  const current = await locator.inputValue().catch(() => '');
  const isBlank = !current || current === '' || current === 'Seleccionar';
  const isZero  = !opts.allowZero && ['0','$0','0.00','$0.00'].includes(current);
  if (!isBlank && !isZero) return;
  if (opts.isSelect) {
    await locator.selectOption(value);
    await waitForPageIdle(page);
  } else {
    await locator.fill(value);
  }
}
```

### `logEmptyFields(page, formSelector)` — REGLA 6 (diagnóstico, no assert)
```ts
async function logEmptyFields(page: Page, formSel: string, ss: Function): Promise<void> {
  const empties = await page.evaluate((sel: string) => {
    const c = document.querySelector(sel) ?? document;
    return Array.from(c.querySelectorAll('input[type="text"]:not([disabled]),select:not([disabled])'))
      .filter(el => (el as HTMLElement).offsetParent !== null)
      .filter(el => { const v = (el as HTMLInputElement).value; return !v || v === '' || v === 'Seleccionar' || v === '0'; })
      .map(el => ({ id: el.id, value: (el as HTMLInputElement).value }));
  }, formSel);
  if (empties.length > 0) {
    console.warn('[EMPTY-FIELDS]', JSON.stringify(empties));
    await ss('warn-campos-vacios');
  }
}
```

### `clickContinuar(page, selector)`
```ts
async function clickContinuar(page: Page, selector: string): Promise<void> {
  await waitForPageIdle(page);
  const btn = page.locator(selector);
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await expect(btn).toBeEnabled({ timeout: 10_000 });
  await btn.click();
  await waitForPageIdle(page);
}
```

---

## Flujo por pantalla (checklist)

1. `await ss('NN-nombre-pantalla-inicio')`
2. Llenar todos los `<select>` primero (pueden disparar AutoPostBack)
3. Esperar `waitForPageIdle` tras cada select
4. Llenar inputs de texto con `safeSetValue()` para campos JS-RESTRICTED
5. Usar `setIfBlank()` para el resto
6. `await logEmptyFields(page, '#form1')` — diagnóstico visual
7. `await ss('NN-nombre-pantalla-antes-continuar')`
8. `await clickContinuar(page, SEL.formN.continuar)`

---

## Detección de campos JS-RESTRICTED (hacer en MCP antes de escribir fixture)

```js
// Pegar en MCP Browser evaluate()
Array.from(document.querySelectorAll('input[oninput],input[onkeypress]'))
  .map(e => ({ id: e.id, oninput: e.getAttribute('oninput'), onkeypress: e.getAttribute('onkeypress') }))
```

Resultado → marcar esos campos como `// JS-RESTRICTED` en SEL y usar `safeSetValue()`.