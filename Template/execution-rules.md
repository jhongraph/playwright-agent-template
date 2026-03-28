# Execution Rules — Playwright E2E

## REGLA 1 — Esperas obligatorias

Siempre usar:
- waitForLoadState('networkidle')
- Validaciones de UI (visible/enabled)

Prohibido:
- waitForTimeout()

---

## REGLA 2 — Selectores

Prohibido:
- nth-child
- xpath dinámico
- texto parcial

Obligatorio:
- usar prioridad definida

---

## REGLA 3 — Orden de llenado

1. Selects primero
2. Inputs después
3. Campos críticos al final

---

## REGLA 4 — No sobrescribir datos

Usar:
- setIfBlank()

---

## REGLA 5 — Click seguro

- Verificar visible + enabled
- Nunca hacer click ciego

---

## REGLA 6 — Validación pre-submit

Detectar:
- campos vacíos
- valores inválidos

---

## REGLA 7 — Diagnóstico obligatorio

Si falla:
1. Capturar screenshot
2. Leer errores UI
3. Corregir antes de reintentar

---

## REGLA 8 — Uploads

Debe:
- verificar request de red
- validar que el archivo llegó al servidor

---

## REGLA 9 — Screenshots

Obligatorio en:
- inicio de pantalla
- antes de continuar

---

## REGLA 10 — Auto-mejora

Cada error corregido:
→ debe actualizar este archivo