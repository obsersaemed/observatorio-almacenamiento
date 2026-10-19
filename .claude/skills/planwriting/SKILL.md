---
name: planwriting
description: Fase 3 del flujo spec-driven. A partir de una spec aprobada escribe el plan técnico y la lista de tareas pequeñas y verificables en specs/NNN-nombre/plan.md, con trazabilidad a los requisitos. Usar cuando el usuario pida planear, escribir el plan o descomponer en tareas una funcionalidad.
---

# Escritura del plan (fase 3 de 4)

Flujo: brainstorm → specdefinition → **planwriting** → implementation.
El plan dice **cómo** se cumple la spec: archivos, datos, orden y verificación.
Todavía no se escribe código del sitio.

## Requisito de entrada
`specs/NNN-*/spec.md` con `Estado: Aprobada` y sin `[ACLARAR]` pendientes. Si falta,
dilo y ofrece correr `specdefinition`.

## Pasos

1. Lee `spec.md`, `CLAUDE.md`, `datos/esquemas.json` y el código que se va a tocar o
   reutilizar (`sitio/`, `Mapa/index.html`, `Vehiculos/dashboard/`, `scripts/`).
   **Reutiliza lo que exista antes de proponer código nuevo.**
2. Redacta `plan.md` con la plantilla [plantilla-plan.md](plantilla-plan.md):
   - **Enfoque técnico** dentro del stack fijado en `CLAUDE.md` (HTML, CSS y JS sin
     framework; Python estándar en `scripts/`; OSM/Leaflet; tokens del design system).
     Si una librería externa es indispensable, justifícala y pide aprobación aparte.
   - **Archivos**: tabla de qué se crea o se modifica y por qué.
   - **Cambios de datos**: esquema, CSV, validador y pruebas, siempre juntos.
   - **Tareas** `T01`, `T02`…: cada una cabe en una sesión corta (≤ ~1 h), deja el
     sitio funcionando, cita los RF/RNF que cubre y dice **cómo se verifica**
     (prueba, validador o comprobación en el navegador). Las tareas de datos van primero.
   - **Matriz de trazabilidad**: cada RF y RNF de la spec aparece en al menos una tarea.
     Si alguno queda sin tarea, el plan no está completo.
   - **Riesgos** y cómo se mitigan.
3. Revisa el cronograma de `CLAUDE.md`: si el plan no cabe antes del 2026-10-27, propón
   qué recortar (y que ese recorte se anote en la spec como fuera de alcance).
4. Presenta el plan resumido (tareas y estimación). Con la aprobación del usuario,
   cambia `Estado` a `Aprobado` y sugiere seguir con `implementation`.

## Reglas
- Nada en el plan contradice la spec. Si hace falta cambiar un requisito, se vuelve a
  `specdefinition`.
- No planear tareas que publiquen o despliegue sin confirmación explícita del usuario.
