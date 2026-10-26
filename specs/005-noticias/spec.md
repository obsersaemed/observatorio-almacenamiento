# 005 · Noticias — Especificación

Estado: Aprobada
Fecha: 2026-10-26
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
La página `/noticias` muestra una lista de noticias sobre los SAEB en Colombia publicadas
desde 2025, de la más reciente a la más antigua. Cada noticia tiene su fecha, el medio, el
título, un resumen propio y un enlace a la nota original. Solo se publican las que aprueba
el editor.

## Historias de usuario
- **HU-01** Como *profesional del sector (empresa o ingeniero)*, quiero ver las novedades
  recientes de los SAEB en un solo lugar, para estar al día sin revisar muchos medios.
- **HU-02** Como *investigador*, quiero llegar a la nota original de cada noticia, para
  verificarla y citarla.
- **HU-03** Como *editor del observatorio*, quiero que las noticias propuestas entren como
  pendientes y aprobarlas en `/admin`, para que nada se publique sin revisión.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | La página debe mostrar las noticias aprobadas en una sola lista, de la más reciente a la más antigua por fecha de publicación. | HU-01 |
| RF-02 | Cada noticia debe mostrar la fecha (dd/mm/aaaa), el medio que la publicó, el título y el resumen. | HU-01, HU-02 |
| RF-03 | Cada noticia debe terminar con el texto «Si quieres saber más sobre esta noticia, haz clic en el enlace», con un enlace a la nota original que abre en una pestaña nueva. | HU-02 |
| RF-04 | Si no hay noticias aprobadas, la página debe decir «Todavía no hay noticias publicadas». | HU-01 |
| RF-05 | Solo deben aparecer las noticias con publicación `Aprobado`. Las `Pendiente` y `Rechazado` no se muestran. | HU-03 |
| RF-06 | La carga inicial (noticias desde el 1 de enero de 2025) debe entrar como aportes de tipo *Noticia*, con origen *agente* (`buscar-noticias`) y estado `Pendiente`; el editor las aprueba o rechaza en `/admin`. | HU-03 |
| RF-07 | La skill `buscar-noticias` debe proponer las noticias por la cola de aportes, no escribiendo en `datos/noticias.csv`. | HU-03 |
| RF-08 | Al aprobar una noticia en `/admin`, la página pública debe mostrarla en ≤ 5 minutos. | HU-03 |
| RF-09 | La página no ofrece descargas CSV. | HU-01 |
| RF-10 | La tarjeta de inicio y el menú deben llevar a la lista (deja de mostrarse «Sección en construcción»). | HU-01 |

## Criterios de aceptación
**RF-01**
- **CA-01.1** Dadas noticias aprobadas de fechas distintas, cuando se abre `/noticias`,
  entonces aparecen de la más reciente a la más antigua.
- **CA-01.2** Dadas dos noticias con la misma fecha, cuando se abre la página, entonces se
  ordenan por título (orden alfabético), según la aclaración 1.

**RF-02**
- **CA-02.1** Dada una noticia aprobada, cuando se mira su tarjeta, entonces se ven la fecha
  en formato dd/mm/aaaa, el medio, el título y el resumen.

**RF-03**
- **CA-03.1** Dada una noticia, cuando se mira el final de su tarjeta, entonces se lee «Si
  quieres saber más sobre esta noticia, haz clic en el enlace» y el enlace lleva a la URL de
  su columna `enlace` en una pestaña nueva.
- **CA-03.2** Dado un lector de pantalla, cuando recorre los enlaces de la página, entonces el
  nombre de cada enlace incluye el título de su noticia (no hay varios enlaces que se
  anuncien igual).

**RF-04**
- **CA-04.1** Dada la base sin noticias aprobadas, cuando se abre `/noticias`, entonces se lee
  «Todavía no hay noticias publicadas».

**RF-05**
- **CA-05.1** Dada una noticia `Pendiente`, cuando se abre la página, entonces no aparece.

**RF-06**
- **CA-06.1** Dada la carga inicial, cuando el editor abre `/admin`, entonces ve cada noticia
  como un aporte *Noticia* pendiente de origen *agente* (`buscar-noticias`), con su enlace,
  y ninguna aparece todavía en `/noticias`.

**RF-07**
- **CA-07.1** Dada la skill `buscar-noticias`, cuando se lee su procedimiento, entonces envía
  las propuestas con `scripts/proponer_aporte.py` y no edita `datos/noticias.csv`.

**RF-08**
- **CA-08.1** Dada una noticia pendiente, cuando el editor la aprueba en `/admin`, entonces
  aparece en `/noticias` en ≤ 5 minutos.

**RF-09**
- **CA-09.1** Dada la página `/noticias`, cuando se busca una descarga, entonces no hay botón ni
  enlace de descarga CSV.

**RF-10**
- **CA-10.1** Dado el inicio, cuando se usa la tarjeta «Noticias» o el menú, entonces se llega a
  la lista y no a «Sección en construcción».

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | A 375 px de ancho la lista se lee sin desplazamiento horizontal. |
| RNF-02 | Fechas en formato dd/mm/aaaa y textos en español de Colombia. |
| RNF-03 | Con movimiento reducido activado no hay animaciones. |
| RNF-04 | Contraste WCAG AA, sin errores de axe, todo se usa con el teclado y el foco es visible. |
| RNF-05 | LCP ≤ 2,5 s en la página publicada (mediana de 3 mediciones). |
| RNF-06 | Consola del navegador sin errores. |
| RNF-07 | Colores de los tokens del design system TEJ. |
| RNF-08 | Ninguna noticia se inventa: cada una tiene fecha, medio y enlace verificados en la nota original, y el resumen es propio (no copia el texto del medio). |

## Datos
Tabla y archivo existentes: `noticias` / `datos/noticias.csv` (`datos/esquemas.json`). No hay
columnas nuevas.

| Archivo | Columna | Tipo | Obligatorio | Valores / rango | Fuente |
|---|---|---|---|---|---|
| noticias.csv | fecha | fecha | Sí | Fecha de publicación de la nota | La nota original |
| noticias.csv | titulo | texto | Sí | Título de la nota (o uno descriptivo propio si es un comunicado sin título) | La nota original |
| noticias.csv | medio | texto | Sí | Nombre del medio o de la entidad | La nota original |
| noticias.csv | enlace | urls | Sí | URL de la nota original | La nota original |
| noticias.csv | resumen | texto | No en el esquema; sí en la carga inicial | 1 o 2 frases propias | Redacción propia, revisada por el editor |
| noticias.csv | etiquetas, proyecto_relacionado, norma_relacionada | texto | No | Se pueden llenar; no se muestran en el MVP | Redacción propia |
| (tabla) | publicacion | enum | Sí | Pendiente, Aprobado, Rechazado | Decisión del editor en `/admin` |

## Fuera de alcance
- Filtros, búsqueda y paginación.
- Etiquetas visibles y enlaces a la norma o al proyecto relacionado.
- Descargas CSV.
- Búsqueda automática programada de noticias.
- Noticias anteriores a 2025.

## Aclaraciones
1. Orden de dos noticias con la misma fecha → por título, en orden alfabético. (aceptada,
   2026-10-26)
2. Qué cuenta como noticia SAEB → notas sobre almacenamiento con baterías en Colombia
   (proyectos, subastas, regulación, empresas, red). Se excluyen el hidrógeno, el bombeo y
   las baterías de vehículos (estas ya tienen su sección), salvo que traten de
   almacenamiento conectado a la red. (aceptada, 2026-10-26)

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-26 | Versión inicial | Brainstorm 005 aprobado |
| 2026-10-26 | Aclaraciones 1 y 2 resueltas con las propuestas; spec aprobada | Decisión del usuario |
