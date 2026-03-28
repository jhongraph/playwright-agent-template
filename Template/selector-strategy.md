# Selector Strategy

## Prioridad

1. id
2. name
3. data-testid
4. aria-label
5. css estable
6. xpath (último recurso)

---

## Banco de Selectores

Formato:

```ts
export const SEL = {
  login: {
    username: '',
    password: '',
    submit: ''
  }
};
Reglas
No duplicar selectores
Reutilizar siempre
No re-explorar si ya existe
Exploración incremental
Guardar selectores en cada paso
Si falla:
→ continuar desde último punto válido