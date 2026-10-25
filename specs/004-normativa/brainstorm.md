# 004 · Evolución normativa

Estado: Aprobado
Fecha: 2026-10-24

## Idea
Una línea de tiempo de las normas que regulan los SAEB en Colombia. Cada norma tiene un
resumen corto, una explicación para lectores que no son abogados y el enlace al documento
oficial. La línea de tiempo se puede filtrar.

## Problema y público
La regulación de los SAEB está dispersa entre CREG, MME, CNO, UPME y XM, en documentos
largos y técnicos. Desarrolladores, operadores, ingenieros y academia necesitan saber
qué norma aplica a su proyecto, si sigue vigente y qué cambia para ellos, sin leer cada
resolución completa.

## Preguntas que responde al usuario final
- ¿Qué normas regulan hoy el almacenamiento con baterías en Colombia y quién las expidió?
- ¿Cómo ha evolucionado la regulación en el tiempo y qué norma modificó o derogó a cuál?
- ¿Qué dice cada norma en pocas palabras y qué cambia para un proyecto SAEB?
- ¿Cuáles están vigentes y cuáles siguen en consulta?
- ¿Dónde está el documento oficial?

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|
| Listado de normas SAEB | Sí, en documentos: 20 documentos normativos y 2 académicos en `fuentes/normativa/` (fuera de git), con su enlace en «Gestor enlaces.docx». `datos/normativa.csv` y la tabla `normas` siguen vacíos | Documentación del usuario + búsqueda en CREG, MME, CNO, UPME y XM |
| id, fecha, emisor, tipo, número, título, estado | Columnas definidas en `datos/esquemas.json` | Documento oficial de cada norma |
| Resumen y explicación | Columnas definidas (`resumen`, `explicacion`) | Redacción propia a partir del texto oficial (skill `ficha-normativa`), revisada por el usuario |
| Relación entre normas (modifica, deroga) | Columna `relacionada_con` (ids separados por `;`) | Texto oficial de cada norma |
| Enlace oficial | Columna `enlace` (obligatoria) | Sitio de la entidad emisora o Gestor Normativo |
| Estado de revisión (Pendiente/Aprobada) | No existe en el esquema de normas | Hay que agregarlo, como en noticias |

## Documentación del usuario (2026-10-24)
Carpetas por entidad en `fuentes/normativa/`, cada documento con su enlace oficial en
«Gestor enlaces.docx»:

| Entidad | Documentos |
|---|---|
| CREG | Res. 127 de 2018; Documento 064 de 2019; Res. 098 de 2019; Res. 101 023 de 2022; Documento 901 225 de 2025; Proyecto de Res. 701 103 de 2025; Res. 101 113 de 2026 |
| CNO | Acuerdos 1354 de 2020, 1585 de 2022, 1816 de 2024, 1849 de 2024 y 1937 de 2025 |
| CND (XM) | Procedimientos de carga y descarga de SAEB; Modelo de optimización del despacho SAEB; Propuesta de requisitos grid-forming en el SIN |
| MME y Congreso | Ley 1715 de 2014; Ley 2099 de 2021; Res. MME 40156 de 2022; Decreto 2236 de 2023; Decreto 0393 de 2026 |
| Academia (UNAL) | «Barreras para la integración de los SAE en Colombia»; «Almacenamiento de energía en Colombia: claves para una regulación que habilite los SAEB» |

## Posibles faltantes encontrados en la búsqueda (por verificar)
Aparecen en fuentes públicas, pero no están en la documentación del usuario. Antes de
cargarlos hay que leer el documento oficial y confirmar número, fecha y enlace.
- CREG 074 de 2021: exigencias de calidad para los SAEB de la Res. 098 de 2019
  ([gestor CREG](https://gestornormativo.creg.gov.co/gestor/entorno/docs/resolucion_creg_0074_2021.htm)).
- CREG 110 de 2021: ingreso del SAEB del Atlántico (convocatoria UPME STR 01-2021)
  ([PDF CREG](https://gestornormativo.creg.gov.co/Publicac.nsf/1c09d18d2d5ffb5b05256eee00709c02/cbc964c13016f17f05258766007d0fc6/$FILE/Creg110-2021.pdf)).
- UPME: convocatorias STR 01-2020 y STR 01-2021 (SAEB del Atlántico, 45 MW) y la
  Res. UPME 000065 de 2021 (interventor).
- MME Res. 40178 de 2026: subastas de largo plazo con almacenamiento (solo hay notas de
  prensa; falta el texto oficial). Se apoya en el Decreto 1091 de 2025, que es general.
- Concepto CREG 005850 de 2024: SAEB para regulación secundaria de frecuencia (un
  concepto no es norma; el esquema no tiene ese tipo).
- Dato relevante para la línea de tiempo: la CREG indica que la Res. 101 113 de 2026
  deroga la Res. 098 de 2019.

## Referencia: normograma de Transforma
[observatorio-tej-transforma.com/normograma](https://observatorio-tej-transforma.com/normograma):
línea de tiempo vertical con tarjetas alternadas a cada lado, separadores por año, barra
de años arriba para saltar, y búsqueda por temática y por rango normativo (tipo). Cada
tarjeta muestra el título, la descripción y «Expedida por».

## Alternativas
### A. Una sola línea de tiempo con filtros y fichas desplegables (recomendada)
Una línea de tiempo vertical, de la más reciente a la más antigua, con separadores por año
y una barra de años para saltar (como Transforma). En escritorio las tarjetas se alternan a
cada lado; en móvil van en una columna. Cada tarjeta lleva el color de su entidad. Cada norma muestra fecha, emisor, tipo,
número, título y estado, y se despliega para mostrar el resumen, la explicación, las
normas relacionadas y el enlace oficial. Filtros desplegables por entidad
(CREG, MME, CNO, XM, UPME, Congreso), tipo, estado y año, que se guardan en la URL, como en `/mapa`. Descarga CSV del resultado.
- Ventajas: responde a «evolución» de un vistazo y reutiliza los filtros, el formato y
  la descarga de 002 y 003. Funciona bien en móvil (una columna).
- Costos: un componente nuevo de línea de tiempo y la tabla de normas con estado de revisión.
- Riesgos: si hay pocas normas, los filtros aportan poco. Se mitiga mostrando los filtros
  plegados.

### A2. Una línea de tiempo por entidad (carriles)
Una columna o carril por entidad, todas sobre el mismo eje de años.
- Ventajas: muestra a la vez quién regula qué y cuándo.
- Costos y riesgos: con 6 entidades no cabe en móvil; obliga a desplazarse de lado. El
  filtro por entidad de A da lo mismo sin ese costo.

### B. Solo línea de tiempo, sin filtros
- Ventajas: la más rápida de construir.
- Costos y riesgos: con 20 o más normas se vuelve difícil encontrar una en particular, y
  no permite responder «¿qué emitió la CREG?» sin recorrer toda la lista.

### C. Tabla filtrable con ficha por norma
- Ventajas: reutiliza TanStack Table. Buena para buscar una norma concreta.
- Costos y riesgos: se pierde la lectura de «evolución». La ficha en página aparte suma
  rutas y pruebas.

## Enfoque elegido
Pendiente de aprobación. Se recomienda **A**: una sola línea de tiempo con la entidad
como filtro y como color. Organizar por año o por entidad no son opciones excluyentes: los
años son el eje y los separadores, y la entidad es el filtro principal.

## Decisiones del usuario (2026-10-24)
- **Fuente:** las dos. El usuario comparte su documentación y Claude busca en las fuentes
  oficiales para encontrar lo que falte. No se inventa ningún número, fecha ni enlace.
- **Vista:** línea de tiempo con filtros.
- **Alcance:** solo normas que regulan expresamente los SAEB (habilitación, remuneración,
  conexión y operación). Las normas generales (autogeneración, subastas, mercado) quedan
  fuera del MVP.
- **Publicación con revisión:** las normas propuestas entran como `Pendiente` y solo se
  publican las que el usuario aprueba, como en noticias.
- **Explicación breve:** resumen de 1 o 2 frases y explicación de 1 o 2 párrafos sobre
  qué cambia para un proyecto SAEB y a quién aplica.
- **Documento:** enlace al documento oficial, sin copia en PDF (recomendación aceptada o
  por confirmar; ver preguntas abiertas).

## Dentro del MVP / después
- MVP: línea de tiempo, ficha desplegable, filtros (emisor, tipo, estado, año) en la URL,
  enlace oficial, descarga CSV, revisión Pendiente/Aprobada, carga inicial de las normas
  del usuario más las que se encuentren.
- Después: copia en PDF de documentos con enlace inestable, alertas de normas nuevas,
  búsqueda de texto, normas relacionadas no SAEB, vínculo entre proyectos y la norma que
  los habilita.

## Decisiones del usuario (2026-10-24, segunda ronda)
- **Organización:** una sola línea de tiempo, con la entidad como filtro y como color de
  cada tarjeta. Separadores por año y barra para saltar de año.
- **Documentos de XM (CND):** van en la línea de tiempo como tipo «Documento», porque son
  relevantes para la operación de los SAEB.
- **Estudios académicos:** se publican, pero fuera de la línea, en una sección
  «Documentos de referencia».
- **Faltantes de la búsqueda:** se incluyen como `Pendiente`, después de leer el documento
  oficial y confirmar número, fecha y enlace.
- **Tema:** sin filtro por tema en el MVP.

## Preguntas abiertas (con propuesta, para resolver en la spec)
- Documento: enlace al documento oficial, sin copia en PDF. Propuesta: aceptar.
- Normas en consulta: van en la misma línea de tiempo, marcadas «En consulta». Propuesta:
  aceptar.
- Aprobación: en `/admin`, con la misma cola de aportes de la 001. Propuesta: aceptar.
- Varios acuerdos CNO comparten el mismo enlace (el índice SAEB del manual del CNO). Hay
  que confirmar si cada acuerdo tiene un enlace propio.
