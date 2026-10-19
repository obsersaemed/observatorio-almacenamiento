---
name: implementation
description: Fase 4 del flujo spec-driven. Implementa las tareas de specs/NNN-nombre/plan.md con desarrollo guiado por pruebas (RED → GREEN → REFACTOR), preferiblemente con el workflow /sdd-implementar, y cierra con el agente E2E limpio que prueba los criterios de aceptación sin conocer el código. Usar cuando el usuario pida implementar, construir o avanzar con las tareas de una funcionalidad ya planeada.
---

# Implementación con TDD (fase 4 de 4)

Flujo: brainstorm → specdefinition → planwriting → **implementation** (TDD + E2E limpio).

## Requisito de entrada
`specs/NNN-*/plan.md` con `Estado: Aprobado` o `En curso`, sin tareas de talla L. Si
falta, dilo y ofrece correr `planwriting`. Al empezar, cambia el estado a `En curso`.

## Modo recomendado: workflow dinámico
Con el plan aprobado ya no hacen falta decisiones del usuario hasta el final, así que la
fase se ejecuta como workflow (sin interacción a mitad de la corrida):

```
/sdd-implementar {"spec": "specs/NNN-nombre", "commit": false}
```

El workflow (`.claude/workflows/sdd-implementar.js`) toma las tareas en orden de
dependencias y, para cada una, usa **agentes distintos** para escribir la prueba y para
escribir el código, de modo que quien implementa no puede ajustar la prueba a su gusto:

1. **RED**: un agente escribe solo la prueba y confirma que falla por la razón esperada.
2. **GREEN**: otro agente escribe el código mínimo para que pase, sin tocar la prueba, y
   corre la suite completa.
3. **REFACTOR y registro**: un revisor limpia el código sin cambiar el comportamiento,
   comprueba las reglas de `CLAUDE.md`, marca `- [x]` y llena el registro del plan.
4. Al final, el **agente E2E limpio** (`.claude/agents/e2e-limpio.md`) ejecuta los
   escenarios E2E del plan contra la app en marcha y escribe `e2e-informe.md`.
5. Un verificador revisa que el agente E2E no haya modificado código de producción.

Si una tarea no logra pasar a GREEN en 2 intentos, el workflow se detiene, la deja
marcada como bloqueada en el registro y reporta por qué.

Si los workflows no están disponibles (por ejemplo, desactivados en `/config`), usa el
modo manual.

## Modo manual (una tarea a la vez)
Para cada tarea `- [ ]` en orden:

1. **Releer** la tarea, sus RF y sus `CA-xx.n` en `spec.md`.
2. **RED**: escribe solo la prueba indicada en "Prueba primero". Córrela y **comprueba
   que falla por la razón esperada**. Una prueba que pasa de entrada no sirve: reescríbela.
3. **GREEN**: escribe el código mínimo para que pase. No modifiques la prueba (si está
   mal, vuelve a RED y explícalo en el registro). Corre la suite completa.
4. **REFACTOR**: limpia sin cambiar el comportamiento; la suite sigue en verde.
5. **Reglas de `CLAUDE.md`**: tokens del design system, formato es-CO, MW y MWh por
   separado, datos sin inventar, llaves fuera del navegador, `prefers-reduced-motion`.
6. **Registrar**: marca `- [x]` y agrega la fila al "Registro de implementación"
   (RED, GREEN, refactor o desviación).
7. **Commit** solo si el usuario lo autorizó en esta sesión: uno por tarea, con el ID en
   el mensaje (`T03: filtros por estado en el mapa`).

Al terminar las tareas, lanza el agente E2E limpio con la herramienta Agent
(`subagent_type: "e2e-limpio"`) y pásale **solo** la ruta de la carpeta de la spec.

## Cuando algo no encaja
- Si una tarea revela que la spec está mal o incompleta, **para**: propone el cambio en
  `spec.md` y espera la aprobación. No implementes por fuera de la spec.
- Si una tarea resulta más grande que su talla, divídela en el plan antes de seguir.
- Una verificación que falla se reporta como falla; nunca se marca como hecha.

## Cierre
1. Si el informe E2E tiene fallas, cada falla se vuelve una tarea nueva en el plan
   (con su prueba RED) y se repite el ciclo.
2. Con el E2E en verde: plan en `Terminado`, matriz de trazabilidad completa, índice de
   `specs/README.md` actualizado y skill `cierre-sesion`.
3. Publicar en producción sigue requiriendo confirmación explícita del usuario.
