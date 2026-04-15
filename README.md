# 🤖 Playwright Agent — Guía de Operación

> Este archivo se instaló automáticamente con `npx github:jhongraph/playwright-agent-template`.  
> Léelo antes de empezar. Contiene todo lo que necesitas para operar el agente.

---

## 📂 Estructura del Template

```
.github/
  copilot-instructions.md   ← 🔴 SE LEE AUTOMÁTICAMENTE — routing y reglas del agente
.agent-state/
  *.schema.json             ← Schemas de contratos JSON
playwright-guide.md         ← Helpers y estructura de código
execution-rules.md          ← Reglas de construcción de tests
selector-strategy.md        ← Prioridad de selectores
agent-architecture.md       ← Pipeline de agentes especializados
README.md                   ← Este archivo (para el usuario)
```

> ⚠️ **El archivo `.github/copilot-instructions.md` es el cerebro del agente.**  
> Copilot lo lee automáticamente antes de cada respuesta. Ahí está el routing de skills.

---

## ✅ Requisitos previos

Antes de usar el agente, verifica que tienes:

| Requisito | Cómo verificar |
|---|---|
| **Node.js 18+** | `node -v` en terminal |
| **VS Code** con extensión **GitHub Copilot** | Busca el ícono de Copilot en la barra lateral |
| **MCP Azure DevOps** configurado | El agente puede conectarse a ADO sin errores |
| **MCP Playwright (Browser)** configurado | El agente puede abrir navegador |

> Si falta alguno, el agente te lo indicará al empezar.

---

## 🚀 Cómo ejecutar — 3 pasos

### Paso 1 — Abre VS Code en esta carpeta

```
code .
```

Tambien usando el ide puedes abrir esta carpeta directamente.

Asegúrate de que el workspace sea la carpeta raíz donde se instaló el template (donde está este README).

---

### Paso 2 — Abre GitHub Copilot en modo Agent

- Presiona `Ctrl+Shift+I` (Windows/Linux) o `Cmd+Shift+I` (Mac)
- O haz clic en el ícono de Copilot → selecciona **Agent mode**

---

### Paso 3 — Dile al agente qué ejecutar

Escribe en el chat (ajusta con tus datos reales):

```
Ejecutar Test Plan 9412, Suite 9418
URL: https://www.saucedemo.com
Usuario: standard_user / Contraseña: secret_sauce
```

Si quieres ejecutar **TCs específicos** (no toda la suite):

```
Ejecutar TP 9412, TS 9418, TCs: 9433 y 9434
 URL: https://www.saucedemo.com
user: standard_user / pass: secret_sauce
```

---

## ❓ Primera pregunta del agente: ¿A o B?

Al iniciar, el agente **siempre pregunta** cómo quieres ejecutar:

```
¿Cómo quieres ejecutar estos TCs?

  A — Proyecto Playwright completo
      Crea archivos .spec.ts reutilizables en TPlans/
      Ideal para regresión — los tests quedan como código

  B — Ejecución directa, sin archivos
      Navega la app, ejecuta los pasos y sube screenshots a ADO
      No genera código. Solo evidencia. Listo en minutos.
```

**Responde `A` o `B`** y el agente continúa solo.

---

## 🔠 Qué datos necesitas tener a mano

```
org ADO        →  Organización de Azure DevOps        [OBLIGATORIO]
                  Ejemplo: MiOrg dependiendo de la config podria estar fija en el mcp o ser resivida en el chat para inyectarla al mcp ADO

Test Plan ID   →  ID del plan de pruebas               [OBLIGATORIO]
                  Ejemplo: 9412

Test Suite ID  →  ID de la suite dentro del plan       [En caso de no querer ejecutarlos todos]
                  Ejemplo: 9418

TC IDs         →  IDs de TCs específicos               [OPCIONAL]
                  Ejemplo: 9433, 9434

URL            →  URL de la aplicación bajo prueba     [OBLIGATORIO] (si ya esta en el Test Pan no es nesesario pasarselo en el prompt)
                  Ejemplo: https://www.saucedemo.com

Credenciales   →  Usuario y contraseña de la app       [si hay login]
                  Ejemplo: standard_user / secret_sauce

Archivos       →  Rutas a archivos a subir (Excel, PDF) [si el TC los necesita] o indicar usar archivos Dummy
                  Ejemplo: C:\datos\archivo.xlsx
```

> ⚠️ **Sin Test Plan + Test Suite el agente no puede ubicar los TCs.**  
> La jerarquía en ADO es: `Test Plan → Test Suite → Test Cases`

---

## 📂 ¿Qué hará el agente por escenario?

### Escenario A — Código reutilizable

1. Verifica Node.js (lo instala si falta)
2. Crea `TPlans/` con `playwright.config.ts`, specs y fixtures
3. Te pregunta: ¿codegen o exploración automática?
4. Ejecuta los tests
5. Sube screenshots como evidencia a ADO ✅

### Escenario B — Solo evidencia (más rápido)

1. Lee los TCs desde ADO
2. Navega la app con MCP Browser
3. Toma screenshot por cada paso del TC
4. Publica un comentario HTML con evidencia inline en cada TC de ADO ✅

---

## 🔄 Actualizar el template y skills

Si hay una nueva versión disponible, vuelve a ejecutar el mismo comando:

```bash
npx github:jhongraph/playwright-agent-template
```

Esto actualiza tanto los archivos de workspace como las skills instaladas en `~/.agents/skills/`.

---

## 🧩 Skills instaladas

Las siguientes skills se instalaron en `~/.agents/skills/` y el agente las usa automáticamente:

| Skill | Para qué sirve |
|---|---|
| `playwright-e2e` | Automatizar TCs manuales como pruebas E2E con Playwright |
| `qa-execution-reporter` | Ejecutar TCs, tomar screenshots y subir evidencia a ADO |
| `create-test-cases` | Crear Test Cases profesionales en Azure DevOps |
| `find-skills` | Descubrir e instalar otras skills disponibles |

---

## 🆘 Solución de problemas comunes

| Problema | Solución |
|---|---|
| El agente no encuentra los TCs | Verifica que tienes Test Plan ID + Test Suite ID correctos |
| Error de MCP ADO | Verifica que el MCP de Azure DevOps esté configurado y autenticado |
| El browser no abre | Verifica que el MCP de Playwright (Browser) esté activo |
| Node.js no encontrado | Instala Node.js 18+ desde https://nodejs.org |
| Skills no funcionan | Re-ejecuta `npx github:jhongraph/playwright-agent-template` |

---

*Generado por [playwright-agent-template](https://github.com/jhongraph/playwright-agent-template)*
