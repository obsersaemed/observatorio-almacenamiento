---
name: planwriting
description: Fase 3 del flujo spec-driven. A partir de una spec aprobada escribe el plan técnico en specs/NNN-nombre/plan.md, con tareas dimensionadas (XS/S/M), la prueba que se escribe primero en cada una (TDD), sus dependencias y los escenarios E2E derivados de los criterios de aceptación. Usar cuando el usuario pida planear, escribir el plan, dimensionar o descomponer en tareas una funcionalidad.
---

# Escritura del plan (fase 3 de 4)

Flujo: brainstorm → specdefinition → **planwriting** → implementation (TDD + E2E limpio).
El plan dice **cómo** se cumple la spec: archivos, datos, tareas, pruebas y orden.
Todavía no se escribe código. Fase conversacional.

## Requisito de entrada
`specs/NNN-*/spec.md` con `Estado: Aprobada` y sin `[ACLARAR]` pendientes. Si falta,
dilo y ofrece correr `specdefinition`.

## Pasos

1. Lee `spec.md`, `CLAUDE.md` (arquitectura y comandos), la spec de arquitectura y el
   código que se va a tocar o reutilizar. **Reutiliza lo que exista antes de proponer
   código nuevo.**
2. Redacta `plan.md` con la plantilla [plantilla-plan.md](plantilla-plan.md):
   - **Enfoque técnico** dentro del stack aprobado en `CLAUDE.md`. Una librería nueva
     requiere justificación y aprobación aparte.
   - **Archivos**: qué se crea o se modifica y por qué.
   - **Cambios de datos**: esquema SQL, esquemas de validación, importación y pruebas, siempre juntos.
   - **Tareas** (ver "Dimensionar las tareas").
   - **Escenarios E2E**: uno o más por cada `CA-xx.n` de la spec, escritos como pasos de
     un usuario (abrir, hacer clic, escribir, ver). Son la entrada del agente E2E limpio.
   - **Matriz de trazabilidad** RF/RNF → tareas → escenarios E2E. Si un RF o un CA queda
     sin tarea o sin escenario, el plan no está completo.
   - **Riesgos** y cómo se mitigan.
3. Revisa el cronograma de `CLAUDE.md`: si el plan no cabe en la fecha, propón qué
   recortar (y que el recorte se anote en la spec como fuera de alcance).
4. **Revisión adversarial (opcional, recomendada):** ofrece correr `/sdd-revisar` con
   `{ "documento": "specs/NNN-…/plan.md" }` para revisar tamaño, trazabilidad y probabilidad
   de que cada tarea tenga una prueba que falle primero.
5. Presenta el plan resumido (tareas, tallas, estimación total). Con la aprobación del
   usuario, cambia `Estado` a `Aprobado`, actualiza el índice de `specs/README.md` y sigue
   con la skill `implementation`.

## Dimensionar las tareas

Cada tarea debe caber en **un ciclo TDD de un solo agente** con contexto limpio:

| Talla | Tiempo | Archivos de producción | Alcance |
|---|---|---|---|
| **XS** | ≤ 15 min | 1 | Ajuste puntual: un campo, un estilo, una regla |
| **S** | ≤ 45 min | ≤ 3 | Un CA o un RF pequeño |
| **M** | ≤ 90 min | ≤ 5 | Un RF completo |
| **L** | > 90 min o > 5 archivos | — | **No se permite: se divide** |

Una tarea está bien definida si tiene:
- **ID y talla**: `T03 · S`.
- **Cubre**: los RF/RNF y los `CA-xx.n` que satisface.
- **Prueba primero (RED)**: qué prueba se escribe antes del código, de qué tipo
  (unitaria, de componente, de base de datos o E2E) y por qué falla hoy.
- **Hecho cuando (GREEN)**: la condición que la hace pasar.
- **Depende de**: tareas previas (o "—"). El orden de la lista respeta las dependencias.
- **Archivos**: los que toca. Dos tareas que tocan los mismos archivos no pueden
  marcarse como paralelizables.

Las tareas de andamiaje (crear el proyecto, configurar las pruebas) también llevan
prueba: por ejemplo, "la suite corre y una prueba de humo pasa".

## Reglas
- Nada en el plan contradice la spec. Si hace falta cambiar un requisito, se vuelve a
  `specdefinition`.
- No planear tareas que publiquen o desplieguen a producción sin confirmación explícita del usuario.
