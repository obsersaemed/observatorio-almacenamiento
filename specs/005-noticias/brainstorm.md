# 005 · Noticias

Estado: Aprobado
Fecha: 2026-10-26

## Idea
Una lista simple de noticias sobre almacenamiento de energía con baterías (SAEB) en Colombia,
de la más reciente a la más antigua. Cada noticia muestra su título, un resumen corto propio
y un enlace a la nota original para quien quiera leer más.

## Problema y público
Las novedades del sector (proyectos, subastas, regulación, empresas) están dispersas en
medios y comunicados. Empresas, ingenieros y academia necesitan un lugar donde ver de un
vistazo qué ha pasado recientemente y llegar a la fuente original.

## Preguntas que responde al usuario final
- ¿Qué ha pasado recientemente con los SAEB en Colombia?
- ¿Dónde leo la noticia completa? (enlace a la fuente)
- ¿Cuándo pasó y quién lo publicó?

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|
| Noticias | No: la tabla `noticias` y `datos/noticias.csv` están vacías | Búsqueda con la skill `buscar-noticias` desde 2025, en medios especializados y fuentes oficiales (CREG, MME, UPME, XM, empresas) |
| fecha, titulo, medio, enlace | Columnas obligatorias en `datos/esquemas.json` | La nota original |
| resumen | Columna existente | Redacción propia de 1 o 2 frases, sin copiar el texto del medio |
| etiquetas, proyecto_relacionado, norma_relacionada | Columnas existentes, opcionales | No se muestran en el MVP |
| Estado de publicación | Columna `publicacion` (Pendiente/Aprobado/Rechazado) | Decisión del editor en `/admin` |

## Alternativas
### A. Lista simple ordenada por fecha (recomendada y elegida)
Tarjetas de la más reciente a la más antigua. Cada una lleva la fecha, el medio, el título, el
resumen y el texto «Si quieres saber más sobre esta noticia, haz clic en el enlace», con el
enlace a la nota original en una pestaña nueva. Sin filtros.
- Ventajas: la más rápida de construir, cabe en el plazo del MVP (2026-10-27) y es fácil de
  leer en móvil. Reutiliza la lectura de datos aprobados, la cola de aportes y `/admin`.
- Costos y riesgos: con muchas noticias la lista crece. Se mitiga más adelante con paginación
  o filtros.

### B. Lista con filtros por etiqueta, medio y año
- Ventajas: ayuda a encontrar una noticia cuando hay muchas.
- Costos: filtros, URL y conteos (como `/normativa`). El usuario consideró que no hace falta
  para esta sección.

### C. Noticia destacada y lista
- Ventajas: más visual.
- Costos: más diseño y pruebas; no aporta información nueva.

## Enfoque elegido
**A**, por decisión del usuario: sin filtros, ordenada por fecha, con resumen propio y enlace
a la fuente.

## Decisiones del usuario (2026-10-26)
- **Fuente:** Claude busca con la skill `buscar-noticias` y propone; el usuario aprueba en
  `/admin`. Solo se publican las aprobadas.
- **Vista:** lista sin filtros, de la más reciente a la más antigua.
- **Cada noticia:** título, resumen corto y enlace a la nota original, con un texto del tipo
  «Si quieres saber más sobre esta noticia, haz clic en el enlace».
- **Periodo:** desde 2025.

## Dentro del MVP / después
- MVP: página `/noticias` con la lista, lectura de lo aprobado, carga inicial desde 2025
  como aportes `Pendiente`, y actualización de la skill `buscar-noticias` para que proponga
  por la cola de aportes (hoy dice que escribe en el CSV, que ya no es la vía).
- Después: filtros o paginación, etiquetas visibles, enlaces a la norma o al proyecto
  relacionado, búsqueda automática programada.

## Preguntas abiertas (con propuesta, para la spec)
- ¿Se muestran la fecha y el medio en cada tarjeta? Propuesta: sí, porque dan contexto y
  atribuyen la fuente (regla de CLAUDE.md: toda información publicada tiene fuente).
- ¿Cuántas noticias como mínimo para publicar? Propuesta: las que se encuentren desde 2025
  con fecha y fuente verificables; sin cuota.
- ¿Descarga CSV? Propuesta: no, como en `/normativa`.
