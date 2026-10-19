---
name: implementation
description: Fase 4 del flujo spec-driven. Implementa las tareas de specs/NNN-nombre/plan.md una por una, verificando cada una contra su criterio de aceptación y registrando el avance. Usar cuando el usuario pida implementar, construir o avanzar con las tareas de una funcionalidad ya planeada.
---

# Implementación (fase 4 de 4)

Flujo: brainstorm → specdefinition → planwriting → **implementation**.

## Requisito de entrada
`specs/NNN-*/plan.md` con `Estado: Aprobado` o `En curso`. Si falta, dilo y ofrece
correr `planwriting`. Al empezar, cambia el estado a `En curso`.

## Ciclo por tarea

Toma la primera tarea `- [ ]` del plan (o la que indique el usuario) y:

1. **Releer**: la tarea, los RF/RNF que cubre y sus criterios de aceptación en `spec.md`.
2. **Prueba primero cuando aplique**: si la tarea toca datos o `scripts/`, agrega o
   ajusta primero la prueba en `pruebas/` y comprueba que falla.
3. **Implementar** solo lo que pide la tarea, siguiendo las reglas de `CLAUDE.md`:
   - Esquema, CSV, validador y página cambian juntos.
   - Nunca inventar ni modificar cifras, coordenadas o normas; los datos faltantes se
     dejan vacíos y se anotan.
   - Tokens del design system, formato es-CO y rutas relativas en `sitio/`.
4. **Verificar** con lo que dice la tarea:
   - `python scripts/validar_datos.py` y `python -m unittest discover pruebas`.
   - Si se ve en el sitio: levantar el servidor `sitio` de `.claude/launch.json`,
     revisar la consola sin errores, probar la interacción y el ancho de móvil (375 px).
   - Comprobar uno por uno los criterios *Dado / Cuando / Entonces* de los RF cubiertos.
5. **Registrar**: marcar `- [x]` en el plan y agregar una fila en "Registro de
   implementación" (fecha, tarea, resultado o desviación).
6. **Commit** solo si el usuario lo autorizó para esta sesión; un commit por tarea, con
   el ID en el mensaje (`T03: filtros por estado en el mapa`).

## Cuando algo no encaja
- Si la tarea revela que la spec está mal o incompleta, **para**: explica el problema,
  propón el cambio en `spec.md` y espera la aprobación. No implementes por fuera de la spec.
- Si una tarea resulta más grande de lo previsto, divídela en el plan antes de seguir.
- Si una verificación falla y no se resuelve, se reporta como falla; nunca se marca hecha.

## Al terminar todas las tareas
1. Recorre la matriz de trazabilidad: cada RF/RNF verificado.
2. Cambia el plan a `Terminado`, corre la skill `cierre-sesion` y actualiza el
   cronograma de `CLAUDE.md`.
3. Publicar sigue requiriendo confirmación explícita del usuario.
