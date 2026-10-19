---
name: brainstorm
description: Fase 1 del flujo spec-driven. Explora una idea o funcionalidad del observatorio con el usuario (problema, público, alternativas, alcance) y deja specs/NNN-nombre/brainstorm.md. Usar cuando el usuario proponga una funcionalidad nueva, diga "brainstorm" o quiera pensar una sección antes de especificarla.
---

# Brainstorm (fase 1 de 4)

Flujo: **brainstorm** → specdefinition → planwriting → implementation (TDD + E2E limpio).
Aquí no se escribe código ni se modifican datos. Fase conversacional: necesita al usuario.

## Pasos

1. **Carpeta de la funcionalidad.** Busca en `specs/` el siguiente número libre y crea
   `specs/NNN-nombre-corto/` (ej. `specs/002-mapa-filtros/`). Si ya existe una carpeta
   para esta idea, retómala.
2. **Contexto.** Lee `CLAUDE.md` (alcance, arquitectura, reglas, cronograma), `BITACORA.md`,
   las specs aprobadas en `specs/` (sobre todo `001-arquitectura`) y lo que ya exista y
   toque la idea (`datos/esquemas.json`, la app web, `Mapa/`, `Vehiculos/`).
3. **Conversación.** Haz preguntas de **una en una o en grupos de máximo 3**, priorizando
   las que cambian el alcance:
   - ¿Qué problema resuelve y para quién (empresas, ingenieros, academia)?
   - ¿Qué decisión o pregunta del usuario final responde?
   - ¿Qué datos necesita? ¿Existen ya en `datos/` o en una fuente oficial (UPME, XM, CREG, CNO)?
   - ¿Qué es indispensable para el MVP (2026-10-27) y qué puede esperar?
4. **Alternativas.** Propón 2 o 3 enfoques con ventajas, costos y riesgos, y
   **recomienda uno**. Respeta la arquitectura y las reglas de `CLAUDE.md` (stack
   aprobado, solo SAEB, OSM, design system TEJ, moderación de aportes).
5. **Documento.** Escribe `brainstorm.md` con la plantilla de abajo y agrega o actualiza
   la fila de la funcionalidad en el índice de `specs/README.md`.
6. **Cierre.** Pide al usuario que apruebe el enfoque. Con su aprobación, cambia `Estado`
   a `Aprobado`, actualiza el índice y sigue con la skill `specdefinition`.

## Plantilla `brainstorm.md`

```markdown
# NNN · <Nombre>

Estado: Borrador | Aprobado
Fecha: AAAA-MM-DD

## Idea
Una o dos frases.

## Problema y público
Qué necesidad resuelve y para quién.

## Preguntas que responde al usuario final
- ...

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|

## Alternativas
### A. ...
Ventajas / costos / riesgos.
### B. ...

## Enfoque elegido
Cuál y por qué.

## Dentro del MVP / después
- MVP: ...
- Después: ...

## Preguntas abiertas
- ...
```

## Reglas
- No inventes datos ni normas para ilustrar la idea. Si hace falta un ejemplo, márcalo
  como ficticio.
- Si la idea se sale del alcance (p. ej. almacenamiento no SAEB), dilo y deja la decisión
  al usuario.
