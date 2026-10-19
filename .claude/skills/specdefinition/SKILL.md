---
name: specdefinition
description: Fase 2 del flujo spec-driven. Convierte un brainstorm aprobado en una especificación verificable (qué debe hacer, no cómo) en specs/NNN-nombre/spec.md, con requisitos numerados y criterios de aceptación con ID que luego se vuelven pruebas. Usar cuando el usuario pida definir o escribir la spec de una funcionalidad.
---

# Definición de la especificación (fase 2 de 4)

Flujo: brainstorm → **specdefinition** → planwriting → implementation (TDD + E2E limpio).
La spec describe **qué** debe pasar y cómo se verifica. No dice cómo se programa:
nada de nombres de funciones, librerías ni estructura de archivos. Fase conversacional.

## Requisito de entrada
`specs/NNN-*/brainstorm.md` con `Estado: Aprobado`. Si no existe o no está aprobado,
dilo y ofrece correr `brainstorm`. Solo con una orden explícita del usuario se escribe la
spec sin ese paso, y se anota en la spec.

## Pasos

1. Lee `brainstorm.md`, `CLAUDE.md`, la spec de arquitectura (`specs/001-arquitectura/spec.md`)
   y `datos/esquemas.json`.
2. Redacta `spec.md` con la plantilla [plantilla-spec.md](plantilla-spec.md):
   - **Historias de usuario** por público (empresa, ingeniero, academia, editor).
   - **Requisitos funcionales** `RF-01`, `RF-02`…: una sola conducta observable cada uno,
     escrita con "debe".
   - **Criterios de aceptación** con ID `CA-<RF>.<n>` (ej. `CA-03.1`) en formato
     *Dado / Cuando / Entonces*, al menos uno por RF. Cada CA debe poder comprobarse
     **desde fuera**, como lo haría un usuario (navegador, descarga, respuesta visible),
     porque el agente E2E limpio los ejecuta sin leer el código.
   - **Requisitos no funcionales** `RNF-xx` medibles (ancho de 375 px, LCP, WCAG AA,
     formato es-CO, movimiento reducido, secretos fuera del navegador).
   - **Datos**: entidades y columnas nuevas o modificadas, con tipo, obligatorio, valores y fuente.
   - **Fuera de alcance**: lo que se deja explícitamente por fuera.
3. Toda ambigüedad se marca como `[ACLARAR n: pregunta. Propuesta: …]`. No la resuelvas
   suponiendo; ofrece siempre una propuesta.
4. **Autorrevisión** antes de mostrarla:
   - ¿Cada RF tiene al menos un CA con ID?
   - ¿Cada CA se puede observar sin mirar el código?
   - ¿Hay detalles de implementación colados? Quítalos.
   - ¿Respeta las reglas de `CLAUDE.md` (MW y MWh no se suman, KPI de instalado solo
     `En operación`, fuentes trazables, moderación de aportes)?
5. **Revisión adversarial (opcional, recomendada en specs grandes):** ofrece correr el
   workflow `/sdd-revisar` con `{ "documento": "specs/NNN-…/spec.md" }`, que revisa la
   spec desde varios ángulos en paralelo y devuelve hallazgos ordenados.
6. Presenta al usuario los `[ACLARAR]` (máximo 5 a la vez) y actualiza la spec con las
   respuestas.
7. Cuando no queden `[ACLARAR]` y el usuario apruebe, cambia `Estado` a `Aprobada`,
   actualiza el índice de `specs/README.md` y sigue con la skill `planwriting`.

## Cambios posteriores
Si durante el plan o la implementación cambia un requisito, primero se edita `spec.md`
(sección "Historial de cambios") y luego el código. La spec es la fuente de verdad.
