# NNN · <Nombre> — Plan

Estado: Borrador | Aprobado | En curso | En E2E | Terminado
Fecha: AAAA-MM-DD
Spec: [spec.md](spec.md)

## Enfoque técnico
Cómo se construye, en un par de párrafos. Qué se reutiliza.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `web/...` | Crear / Modificar | ... |

## Cambios de datos
- Esquema: ...
- Validación (zod / restricciones SQL): ...
- Importación y pruebas: ...

## Tareas
- [ ] **T01 · S** · Descripción
  - Cubre: RF-01 · CA-01.1
  - Prueba primero (RED): `web/src/.../x.test.ts`, prueba que ... (hoy falla porque ...)
  - Hecho cuando (GREEN): ...
  - Depende de: —
  - Archivos: `...`
- [ ] **T02 · M** · ...
  - Cubre: RF-02, RNF-01 · CA-02.1, CA-02.2
  - Prueba primero (RED): ...
  - Hecho cuando (GREEN): ...
  - Depende de: T01
  - Archivos: `...`

Estimación total: N tareas · X h

## Escenarios E2E
Entrada del agente E2E limpio. Solo pasos y resultados observables, sin detalles internos.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1 | 1. Abrir `/` 2. ... | Se ve ... |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1 | T01 | E2E-01 |

## Riesgos
| Riesgo | Mitigación |
|---|---|

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|

## Informe E2E
Enlace a `e2e-informe.md` cuando exista.
