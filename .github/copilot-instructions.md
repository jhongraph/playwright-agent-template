# Playwright E2E Agent — Instrucciones del Workspace

> ⚠️ **ESTE ARCHIVO SE LEE AUTOMÁTICAMENTE.** Seguir TODOS los pasos antes de actuar.

---

## 🚦 PASO 0 — PREGUNTAR ESCENARIO (SIEMPRE, SIN EXCEPCIÓN)

**ANTES de hacer CUALQUIER cosa**, el agente DEBE preguntar:

> Para asegurarme de entender correctamente tu solicitud, necesito que confirmes:
>
> **¿Qué escenario necesitas?**
>
> **A** — Proyecto Playwright completo
> - Genera archivos `.spec.ts` y `.fixture.ts` reutilizables
> - Los tests quedan como código para regresión futura
> - Ideal si quieres automatización permanente
>
> **B** — Ejecución directa (sin código)
> - Navego la app vía MCP Browser
> - Ejecuto los pasos del TC manualmente, capturo screenshots
> - Subo evidencia a ADO sin generar código TypeScript
> - Más rápido, pero no deja tests reutilizables
>
> Responde **A** o **B** para continuar.

### ⛔ PROHIBICIÓN ABSOLUTA

- **NO ejecutar ninguna acción hasta recibir respuesta A o B**
- **NO asumir el escenario** basándose en las palabras del usuario
- **NO saltarse esta pregunta** aunque el usuario parezca claro en su intención
- Si el usuario no responde A o B, **volver a preguntar**

---

## 🔒 PASO 1 — ROUTING AL SKILL CORRECTO

**Solo después de recibir A o B**, identificar el skill según el request:

| Si el usuario menciona... | Skill a cargar con `read_file` | Ruta |
|---------------------------|-------------------------------|------|
| "ejecutar", "correr", "run" + TP/Suite/TC | `qa-execution-reporter` | `~/.agents/skills/qa-execution-reporter/SKILL.md` |
| "automatizar", "convertir TC a código", "crear tests" | `playwright-e2e` | `~/.agents/skills/playwright-e2e/SKILL.md` |
| "crear test case", "escribir TC", "redactar caso" | `create-test-cases` | `~/.agents/skills/create-test-cases/SKILL.md` |
| "leer TCs de ADO" (sin ejecutar) | `tc-reader` | `~/.agents/skills/tc-reader/SKILL.md` |
| "reportar resultados", "subir evidencia" | `qa-execution-reporter` | `~/.agents/skills/qa-execution-reporter/SKILL.md` |

### Reglas adicionales:

1. **NO actuar sin cargar el skill correcto primero**
2. **NO ejecutar código sin haber leído el skill completo**
3. **NO subir evidencia sin screenshots** — el skill define el formato exacto

---

## 📋 PASO 2 — SEGUIR EL SKILL FASE POR FASE

Cada skill tiene fases numeradas (PHASE 0, 1, 2...). El agente DEBE:

1. **Leer la fase completa** antes de ejecutar acciones de esa fase
2. **Completar TODAS las acciones** de una fase antes de pasar a la siguiente
3. **Verificar** que la fase se completó correctamente
4. **No saltarse fases** — el orden existe por una razón

### Ejemplo de flujo correcto:

```
Usuario: "Ejecuta la Suite 9418 del TP 9412"

Agente:
1. PREGUNTA: "¿Escenario A o B?" (PASO 0 — siempre primero)
2. Usuario responde: "B"
3. Detecta keywords: "ejecuta" + "Suite" → skill qa-execution-reporter
4. Carga skill: read_file("~/.agents/skills/qa-execution-reporter/SKILL.md")
5. Sigue las PHASES del skill en orden
6. Captura screenshots por paso
7. Sube evidencia a ADO con formato correcto
```

### Ejemplo de flujo INCORRECTO (lo que NO hacer):

```
Usuario: "Ejecuta la Suite 9418"

Agente:
1. Asume que es automatización → carga playwright-e2e ❌
2. Escribe specs y ejecuta tests ❌
3. Después de ejecutar, carga qa-execution-reporter ❌
4. Intenta "parchar" con upload de evidencia sin screenshots ❌
```

---

## � PASO 3 — SCREENSHOTS OBLIGATORIOS

### ⛔ SIN SCREENSHOTS = REPORTE INCOMPLETO

Los screenshots son **OBLIGATORIOS** para cualquier reporte en ADO. No hay excepción.

### Escenario A — Captura durante ejecución Playwright

Agregar en el spec:
```typescript
// Al inicio del test
const ss = async (name: string) => {
  await page.screenshot({ path: `results/${tcId}/${name}.png`, fullPage: true });
};

// Después de cada paso
await ss('step1-login');
await ss('step2-menu');
await ss('step3-resultado');
```

### Escenario B — Captura con MCP Browser

Por cada paso del TC:
1. Ejecutar la acción en MCP Browser
2. Capturar screenshot con `browser_take_screenshot`
3. Guardar el base64 como PNG:
```powershell
[System.IO.File]::WriteAllBytes("results/{TC_ID}/step{N}.png", [Convert]::FromBase64String("{base64}"))
```

### ⛔ NUNCA reportar sin haber capturado screenshots primero

---

## 📤 PASO 4 — FORMATO DE EVIDENCIA EN ADO

### Template HTML obligatorio para comentarios

```html
<h2>📋 {TC_ID} — {TC_TITLE} {OVERALL_ICON}</h2>
<p><b>Plan:</b> {PLAN_ID} | <b>Suite:</b> {SUITE} | <b>Fecha:</b> {DATE}</p>

<table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;">
  <thead>
    <tr style="background:#0078d4;color:white;font-weight:bold;">
      <th style="width:10%;">Fase</th>
      <th style="width:38%;">Acción</th>
      <th style="width:38%;">Resultado Esperado</th>
      <th style="width:14%;">Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>STEP 1</b></td>
      <td>{ACTION}</td>
      <td>{EXPECTED}</td>
      <td style="color:#1a7f37;font-weight:bold;">✅ PASSED</td>
    </tr>
    <!-- repetir por cada paso -->
  </tbody>
</table>

<br/>
<b>📎 Evidencia</b>
<br/><br/>

<p><b>STEP 1 — {LABEL}</b></p>
<a href="{ATTACHMENT_URL}" target="_blank">
  <img src="{ATTACHMENT_URL}" width="720" style="border:1px solid #ccc;" />
</a>
<!-- repetir por cada screenshot -->

<hr/><small>🤖 GitHub Copilot Agent — Escenario {A|B} — {DATE}</small>
```

### Reglas del template:
- **OVERALL_ICON**: `✅ PASSED` si todos los pasos pasaron, `❌ FAILED` si alguno falló
- **Color PASSED**: `#1a7f37` (verde)
- **Color FAILED**: `#c0392b` (rojo)
- **Las imágenes van DEBAJO de la tabla**, no dentro de las celdas
- **Cada imagen lleva su label** indicando qué paso representa

---

## 🔄 PASO 5 — UPLOAD A ADO

### Orden de operaciones:

1. **Subir cada PNG** como attachment:
   ```
   POST https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/attachments?fileName={name}.png&api-version=7.0
   Content-Type: application/octet-stream
   Body: [bytes del PNG]
   ```
   → Recibir URL del attachment

2. **Construir el HTML** con las URLs de los attachments

3. **Publicar comentario** en el Work Item:
   ```
   POST https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/workItems/{WI_ID}/comments?api-version=7.0-preview.3
   Body: { "text": "{HTML}" }
   ```

### ⛔ NUNCA ejecutar el upload dos veces

Antes de ejecutar `upload-evidence.js`:
1. Verificar que no se haya ejecutado ya revisando la terminal
2. Si no hay output pero el comando corrió, **verificar en ADO antes de re-ejecutar**
3. Un comentario duplicado = error del agente

---

## 🔑 PASO 6 — PAT AUTOMÁTICO

### Extraer PAT del MCP config (NUNCA pedir al usuario)

```powershell
$content = Get-Content "$env:APPDATA\Code\User\mcp.json" -Raw | ConvertFrom-Json
$env:ADO_PAT = $content.servers.ado.env.AZURE_DEVOPS_EXT_PAT
# O buscar en $content.servers."azure-devops".env.AZURE_DEVOPS_EXT_PAT
```

Si no se encuentra:
- Intentar en `.vscode/mcp.json`
- Intentar en `$env:AZURE_DEVOPS_EXT_PAT`
- Si no hay PAT → usar fallback MCP comment (sin imágenes inline)

---

## �📁 ARCHIVOS DE REFERENCIA

Estos archivos contienen implementaciones y reglas que los skills referencian:

| Archivo | Contenido | Cuándo leer |
|---------|-----------|-------------|
| `playwright-guide.md` | Helpers: `waitForPageIdle`, `safeSetValue`, estructura de fixtures | Cuando code-builder o playwright-e2e lo referencie |
| `execution-rules.md` | REGLA 1-12: esperas, selectores, uploads, screenshots | Cuando se escriba código de test |
| `selector-strategy.md` | Prioridad de selectores, verificación MCP | Cuando discovery lo requiera |
| `agent-architecture.md` | Arquitectura de agentes y contratos JSON | Para entender el pipeline completo |

**NO duplicar contenido de estos archivos.** Referenciar con `→ ver archivo.md`.

---

## 🔄 ESCENARIOS A Y B — Definición

El usuario SIEMPRE debe elegir uno antes de que el agente actúe:

### Escenario A — Proyecto Playwright completo
- Genera archivos `.spec.ts` y `.fixture.ts` reutilizables
- Los tests quedan como código para regresión futura
- Requiere: tc-reader → discovery → code-builder → executor → reporter

### Escenario B — Ejecución directa
- El agente navega la app vía MCP Browser
- Ejecuta los pasos del TC manualmente, captura screenshots
- Sube evidencia a ADO sin generar código TypeScript
- Más rápido, pero no deja tests reutilizables

---

## 📊 CONTRATOS JSON (.agent-state/)

El estado del pipeline se guarda en `.agent-state/`:

```
.agent-state/
  session.json              ← Estado global del pipeline
  plan-<TC_ID>.json         ← Salida de tc-reader
  discovery-<TC_ID>.json    ← Salida de discovery
  execution-<TC_ID>.json    ← Salida de executor
  selector-cache.json       ← Cache de selectores (TTL 7 días)
```

Schemas de referencia en `.agent-state/*.schema.json`.

---

## ⚠️ RECORDATORIOS CRÍTICOS

1. **Screenshots son OBLIGATORIOS** para reportar en ADO — sin ellos, el reporte está incompleto
2. **El PAT de ADO se extrae automáticamente** del MCP config — nunca pedir al usuario
3. **Los TCs se leen de ADO** vía MCP — nunca pedir que el usuario copie/pegue pasos
4. **Procesar TCs de uno en uno** — no paralelizar sobre el mismo TC
5. **Preguntar A o B es OBLIGATORIO** — nunca inferir del contexto

---

## 🎯 RESUMEN: Flujo mental del agente

```
1. Usuario envía mensaje
2. PREGUNTAR "¿Escenario A o B?" (SIEMPRE — sin excepción)
3. Esperar respuesta del usuario
4. ¿Contiene keywords de ejecución/automatización/creación?
   → SÍ: Identificar skill correcto, cargarlo con read_file
   → NO: Responder normalmente
5. Seguir las PHASES del skill en orden
6. No saltar pasos
7. Reportar resultado al final
```
