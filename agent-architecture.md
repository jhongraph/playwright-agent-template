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
2.2 Discovery Agent (Modelo tipo Sonnet + Playwright MCP)

Responsabilidad:

Navegar la app
Extraer selectores reales
Detectar tecnología frontend

Regla:

SIEMPRE usar Playwright MCP
2.3 Selector Manager Agent

Responsabilidad:

Construir banco central de selectores
Reutilizar selectores existentes

Prioridad:

id
name
data-testid
aria-label
css estable
xpath (último recurso)
2.4 Data Agent

Responsabilidad:

Manejar datos de prueba
Pools consumibles
Retry logic
2.5 Test Builder Agent

Responsabilidad:

Generar fixture + spec
Aplicar reglas de implementación
2.6 QA Validator Agent

Responsabilidad:

Detectar anti-patterns
Validar calidad del test
Rechazar código incorrecto
3. Flujo Obligatorio
Orquestador recibe test case
Planner Agent crea plan
Discovery Agent explora
Selector Manager consolida
Data Agent prepara datos
Test Builder genera código
QA Validator valida
Ejecutar test
Si falla → volver SOLO a fase necesaria