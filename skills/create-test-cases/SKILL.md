---
name: create-test-cases
description: 'Crea Test Cases profesionales en Azure DevOps siguiendo estándares QA empresariales. Usar cuando el usuario pida crear, redactar, generar, dividir o corregir TCs, casos de prueba o test cases en cualquier organización/proyecto de ADO. Aplica nomenclatura Portal-Módulo-Pantalla-Funcionalidad [Escenario], estructura PRECOND 0/1/3, atomización máx. 15 pasos, y resultados esperados observables.'
argument-hint: 'Describe la funcionalidad a testear, pega pasos de un TC existente, o indica org/proyecto/plan/suite'
---

# Crear Test Cases Profesionales en Azure DevOps

Skill genérica para crear TCs de alta calidad en cualquier organización y proyecto de Azure DevOps, siguiendo estándares QA empresariales.

---

## 1. Recolectar contexto — SIEMPRE preguntar primero

Antes de crear cualquier TC, necesitas estos datos. **Pregunta todo lo que falte:**

| Dato | Ejemplo | Obligatorio |
|------|---------|-------------|
| **Organización ADO** | `MiOrg` | Sí |
| **Proyecto ADO** | `MiProyecto` | Sí |
| **Test Plan ID** | `9361` | Sí (para agregar al suite) |
| **Test Suite ID** | `9363` | Sí (para agregar al suite) |
| **User Story / Work Item** | `US 9313` | Recomendado |
| **Portal / Aplicación** | `AutoReg`, `MiPortal` | Sí (para el título) |
| **Módulo** | `Preventas`, `Ventas` | Sí (para el título) |
| **Pantalla / Funcionalidad** | `Proc. Preventas Excel` | Sí (para el título) |
| **URL de la pantalla** | `https://app.empresa.com/Forms/Modulo.aspx` | Sí — incluir en PRECOND 3 y en pasos de navegación. Requerida para automatización futura. |
| **Usuario de prueba** | `graciagc` | Sí (para PRECOND 3) |
| **Rol del usuario** | `CASE CREATOR` | Sí (para PRECOND 3) |
| **Escenarios a cubrir** | Happy path, errores, cancelar... | Sí |

> Si el usuario ya proporcionó esta información en mensajes previos o en el contexto de la conversación, no vuelvas a preguntar.

---

## 2. Nomenclatura del título (estándar empresa)

**Formato obligatorio:**
```
{Portal}-{Módulo}-{Pantalla}-{Funcionalidad} [{Escenario}]
```

**Reglas:**
- **Portal**: nombre del portal o aplicación bajo prueba
- **Módulo**: sección del menú principal
- **Pantalla**: nombre exacto como aparece en la UI
- **Funcionalidad**: qué se prueba específicamente
- **Escenario**: entre corchetes `[]`, describe la variante

**Ejemplos:**
```
MiPortal-Ventas-Gestión de Pedidos-Creación de Pedido [Happy Path]
MiPortal-Ventas-Gestión de Pedidos-Creación de Pedido [Datos inválidos]
MiPortal-Ventas-Gestión de Pedidos-Creación de Pedido [Cancelar]
```

---

## 3. Estructura de pasos — Sistema PRECOND

Todo TC debe comenzar con precondiciones en este orden exacto:

| Paso | Tipo | Contenido | Cuándo usarlo |
|------|------|-----------|---------------|
| **PRECOND 0** | Dependencias de TCs | TCs que deben ejecutarse antes para dejar el sistema en un estado dado | Cuando el TC depende de otro TC previo |
| **PRECOND 1** | Datos necesarios | Estado de archivos, usuarios creados, datos precargados, configuraciones | Cuando se necesitan datos específicos listos |
| **PRECOND 3** | Login | `Login - Usuario: X - Rol: Y - Acceso portal: Z - Acceso módulo: W` | SIEMPRE (todo TC requiere login) |

Después de los PRECONDs, continúan los **pasos de ejecución** numerados secuencialmente.

**Ejemplo completo:**
```
1. PRECOND 0: TC-A (ID XXXX) ejecutado hasta el paso 10; el sistema muestra la pantalla de resultados|
2. PRECOND 1: Archivo Excel con 3 registros válidos cargado en la sesión activa|
3. PRECOND 3: Login - Usuario: usuario01 - Rol: ADMIN - Acceso portal: MiPortal - Acceso módulo: Ventas / Gestión de Pedidos|
4. Clic en el botón "Crear Pedido"|Se presenta el formulario de creación con los campos Nombre, Cantidad y Fecha habilitados
5. Ingresar "Producto A" en el campo Nombre|El campo muestra el texto "Producto A" sin errores de validación
6. Clic en el botón "Guardar"|Se presenta mensaje de éxito "Pedido creado correctamente" y se redirige a la lista de pedidos
```

---

## 4. Reglas de calidad — OBLIGATORIO cumplir todas

### Hacer (obligatorio)

- **Máximo ~15 pasos por TC** — si son más, dividir en TCs separados
- **Cada paso = 1 acción + 1 resultado esperado observable**
- **Resultados específicos**: qué texto aparece, qué elementos se habilitan/deshabilitan, qué cambia en pantalla
- **Español correcto** con tildes y ortografía impecable (á, é, í, ó, ú, ñ)
- **Un solo concepto/escenario por TC** (principio de atomización)
- **Nombrar elementos UI exactamente** como aparecen en pantalla (botones, campos, labels)

### NO hacer (prohibido)

- ❌ `"Vuelve al paso X"` — no es observable, no sirve como resultado esperado
- ❌ Copiar/pegar criterios de aceptación como pasos del TC
- ❌ Pasos sin resultado esperado (excepto PRECONDs)
- ❌ Combinar varias acciones distintas en un solo paso
- ❌ Mezclar más de 2 escenarios en un mismo TC
- ❌ Resultados vagos como "funciona correctamente" o "se actualiza la página"
- ❌ Usar comillas dobles `"` dentro del texto de pasos (causa problemas de escape XML/JSON) — preferir comillas simples o describir sin comillas

---

## 5. Procedimiento técnico en ADO (vía MCP)

### Paso A — Crear el TC (solo título)

```
mcp_ado_testplan_create_test_case(
  project = "<PROYECTO>",
  title   = "{Portal}-{Módulo}-{Pantalla}-{Funcionalidad} [{Escenario}]"
)
→ guardar el ID devuelto
```

> **IMPORTANTE:** NO pasar los steps en `create_test_case`. Si se pasan como array/string en la creación, se almacenan como JSON crudo en vez de XML válido de pasos de ADO. Los pasos SIEMPRE se cargan en un segundo llamado.

### Paso B — Cargar los pasos (separado, obligatorio)

```
mcp_ado_testplan_update_test_case_steps(
  id    = <ID del paso anterior>,
  steps = "1. acción|resultado esperado\n2. acción|resultado esperado\n..."
)
```

**Formato del string `steps`:**
- Cada paso: `N. texto de la acción|texto del resultado esperado`
- Separador entre pasos: `\n` (salto de línea real)
- Separador acción/resultado: `|` (pipe)
- PRECONDs sin resultado: dejar vacío después del `|` (ADO agrega texto genérico automáticamente)
- NO usar comillas dobles dentro del contenido de los pasos

### Paso C — Agregar al Test Suite (opcional)

```
mcp_ado_testplan_add_test_cases_to_suite(
  project      = "<PROYECTO>",
  planId       = <PLAN_ID>,
  suiteId      = <SUITE_ID>,
  testCaseIds  = [id1, id2, ...]
)
```

> Si falla con error 401/403 (permisos insuficientes), indicar al usuario que los agregue manualmente:
> **Test Plans → [Plan] → [Suite] → Add test cases → buscar IDs**

---

## 6. Escenarios típicos a cubrir

Para cualquier funcionalidad, considerar al menos estos escenarios:

| Categoría | Escenario sugerido | Ejemplo de título |
|-----------|--------------------|-------------------|
| Éxito | Flujo completo exitoso | `[Happy Path]` |
| Validación | Datos inválidos o formato incorrecto | `[Datos inválidos]` |
| Cancelación | Cancelar en medio del proceso | `[Cancelar]` |
| Navegación | Volver atrás conservando datos | `[Volver al paso anterior]` |
| Eliminación | Quitar un ítem de una lista | `[Eliminar elemento]` |
| Incompleto | Proceso con datos parciales | `[Registros incompletos]` |
| Omisión | Finalizar sin completar opcional | `[Sin campo opcional]` |
| Reanudación | Retomar proceso interrumpido | `[Reanudación automática]` |
| Duplicado | Intentar crear registro existente | `[Registro duplicado]` |
| Vacío | Sin resultados o lista vacía | `[Sin resultados]` |
| Permisos | Usuario sin permisos suficientes | `[Sin permisos]` |
| Límites | Valores máximos/mínimos | `[Valor límite]` |

> No todos aplican siempre. Seleccionar los relevantes según la funcionalidad.

---

## 7. Flujo de trabajo completo

```
1. Recolectar contexto (sección 1)
   ↓
2. Identificar escenarios a cubrir (sección 6)
   ↓
3. Para cada escenario:
   a. Redactar título con nomenclatura (sección 2)
   b. Redactar pasos con PRECONDs (secciones 3-4)
   c. Verificar ≤15 pasos, resultados observables
   ↓
4. Presentar resumen al usuario para aprobación
   ↓
5. Crear TCs en ADO (sección 5, pasos A→B→C)
   ↓
6. Reportar IDs creados y estado final
```

### Presentar resumen antes de crear

Antes de ejecutar llamadas a ADO, mostrar al usuario una tabla con:
- Letra/código del TC (TC-A, TC-B, etc.)
- Título completo
- Cantidad de pasos
- Escenarios cubiertos

Esperar confirmación ("dale", "sí", "ok") antes de crear en ADO.

---

## 8. Ejemplo completo de TC bien escrito

**Título:** `MiPortal-Ventas-Gestión Pedidos-Creación de Pedido [Cancelar a mitad del proceso]`

**Pasos:**
```
1. PRECOND 3: Login - Usuario: admin01 - Rol: VENDEDOR - Acceso portal: MiPortal - Acceso módulo: Ventas / Gestión de Pedidos|
2. Clic en el botón 'Crear Pedido'|Se presenta el formulario de creación de pedido con campos Nombre, Cantidad, Fecha y botones 'Guardar' y 'Cancelar'
3. Ingresar 'Producto de Prueba' en el campo 'Nombre'|El campo muestra el texto ingresado sin errores de validación
4. Ingresar '5' en el campo 'Cantidad'|El campo muestra '5' y no presenta alertas
5. Clic en el botón 'Cancelar'|Se presenta un diálogo de confirmación con texto 'Tiene cambios sin guardar. ¿Desea cancelar?' y botones 'Sí' y 'No'
6. Clic en el botón 'Sí'|El diálogo se cierra; se redirige a la lista de pedidos; el pedido NO aparece en la lista
```

---

## Notas técnicas

- Los TCs se crean con estado `Design` por defecto
- El campo `steps` en ADO usa formato XML interno (`<steps>` con `<step>` tags)
- La tool `update_test_case_steps` convierte el formato `N. acción|resultado` a XML automáticamente
- Si un PRECOND no tiene resultado esperado, ADO agrega "Verify step completes successfully" — esto es aceptable para precondiciones
