---
name: specdefinition
description: Fase 2 del flujo spec-driven. Convierte un brainstorm aprobado en una especificación verificable (qué debe hacer, no cómo) en specs/NNN-nombre/spec.md, con requisitos numerados y criterios de aceptación. Usar cuando el usuario pida definir o escribir la spec de una funcionalidad.
---

# Definición de la especificación (fase 2 de 4)

Flujo: brainstorm → **specdefinition** → planwriting → implementation.
La spec describe **qué** debe pasar y cómo se verifica. No dice cómo se programa:
nada de nombres de funciones, librerías ni estructura de archivos.

## Requisito de entrada
`specs/NNN-*/brainstorm.md` con `Estado: Aprobado`. Si no existe o no está aprobado,
dilo y ofrece correr `brainstorm`. Solo con una orden explícita del usuario se escribe la
spec sin ese paso, y se anota en la spec.

## Pasos

1. Lee `brainstorm.md`, `CLAUDE.md` y `datos/esquemas.json`.
2. Redacta `spec.md` con la plantilla [plantilla-spec.md](plantilla-spec.md):
   - **Historias de usuario** por público (empresa, ingeniero, academia).
   - **Requisitos funcionales** `RF-01`, `RF-02`…: una sola conducta observable cada uno,
     escrita con "debe".
   - **Criterios de aceptación** en formato *Dado / Cuando / Entonces*, al menos uno por RF.
     Deben poder comprobarse en el navegador o con `scripts/validar_datos.py`.
   - **Requisitos no funcionales** `RNF-xx`: móvil (ancho de 375 px), rendimiento,
     accesibilidad, idioma y formato numérico es-CO, funcionar como sitio estático.
   - **Datos**: columnas nuevas o modificadas en `datos/esquemas.json` (nombre, tipo,
     obligatorio, valores) y su fuente.
   - **Fuera de alcance**: lo que se deja explícitamente por fuera.
3. Toda ambigüedad se marca en el texto como `[ACLARAR: pregunta]`. No la resuelvas
   suponiendo.
4. **Autorrevisión** antes de mostrarla:
   - ¿Cada RF tiene criterio de aceptación?
   - ¿Hay detalles de implementación colados? Quítalos.
   - ¿Respeta las reglas de `CLAUDE.md` (MW y MWh no se suman, KPI de instalado solo con
     proyectos "En operación", fuentes trazables)?
5. Presenta al usuario los `[ACLARAR]` (máximo 5 a la vez) y actualiza la spec con las
   respuestas.
6. Cuando no queden `[ACLARAR]` y el usuario apruebe, cambia `Estado` a `Aprobada` y
   sugiere seguir con `planwriting`.

## Cambios posteriores
Si durante el plan o la implementación cambia un requisito, primero se edita `spec.md`
(sección "Historial de cambios") y luego el código. La spec es la fuente de verdad.
