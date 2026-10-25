# 004 · Evolución normativa — Especificación

Estado: Aprobada
Fecha: 2026-10-24
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
La página `/normativa` muestra en una sola línea de tiempo las normas y documentos que
regulan los SAEB en Colombia (CREG, MME, Congreso, CNO, XM y UPME). Cada norma se
condensa en un resumen, se explica en lenguaje claro y enlaza al documento oficial. Se
puede filtrar por entidad, tipo, estado y año. Los estudios académicos se publican aparte,
como documentos de referencia. Solo se publica lo que el editor aprueba.

## Historias de usuario
- **HU-01** Como *desarrollador u operador de un proyecto SAEB*, quiero ver qué normas
  están vigentes y qué cambia cada una para mi proyecto, para cumplirlas sin leer cada
  resolución completa.
- **HU-02** Como *ingeniero de planeación, conexión u operación*, quiero filtrar por
  entidad (por ejemplo, solo los acuerdos del CNO o los documentos de XM), para encontrar
  las reglas técnicas que aplican a mi trabajo.
- **HU-03** Como *investigador*, quiero recorrer la evolución de la regulación año por año
  y ver qué norma modificó o derogó a cuál, para analizar el marco habilitante.
- **HU-04** Como *editor del observatorio*, quiero que las normas propuestas entren como
  pendientes y aprobarlas en `/admin`, para que nada se publique sin revisión.
- **HU-05** Como *cualquier lector*, quiero llegar al documento oficial de cada norma y
  descargar el listado, para verificar y reutilizar la información.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | La página debe mostrar una sola línea de tiempo con todas las normas aprobadas, ordenadas de la más reciente a la más antigua por fecha de expedición. | HU-01, HU-03 |
| RF-02 | La línea de tiempo debe agrupar las normas por año, con un separador visible por cada año que tenga normas. | HU-03 |
| RF-03 | La página debe tener una barra de años que lleve directamente al separador del año elegido. Solo muestra los años que tienen normas en el resultado filtrado. | HU-03 |
| RF-04 | Cada norma debe mostrar, sin desplegar: fecha (dd/mm/aaaa; si el documento solo trae mes y año, «septiembre de 2026»; si solo trae el año, «2025»), entidad que la expidió, tipo y número, título, estado (Vigente, Modificada, Derogada o En consulta) y su resumen. La entidad se distingue por color **y** por texto. | HU-01, HU-02 |
| RF-05 | Cada norma debe poder desplegarse para mostrar la explicación en lenguaje claro, a quién aplica, las normas relacionadas y el enlace al documento oficial, que abre en una pestaña nueva. | HU-01, HU-05 |
| RF-06 | Las normas relacionadas deben mostrarse con su tipo, número y año. Si la relacionada está publicada, es un enlace que lleva a ella en la línea de tiempo y la despliega. | HU-03 |
| RF-07 | La página debe tener filtros desplegables de selección múltiple por entidad, tipo, estado y año, con el mismo comportamiento que los filtros de `/mapa` (conteo por opción, «Limpiar filtros», filtros plegados en móvil). | HU-02 |
| RF-08 | Los filtros deben quedar en la URL: abrir la URL en otra pestaña reproduce los mismos filtros y el mismo resultado. | HU-02 |
| RF-09 | Si ningún documento cumple los filtros, la línea de tiempo dice «Ninguna norma cumple estos filtros» y la barra de años queda vacía. | HU-02 |
| RF-10 | La página debe mostrar cuántas normas cumplen los filtros («N normas»). | HU-02 |
| RF-11 | La página debe permitir descargar en CSV las normas que cumplen los filtros, con todas sus columnas publicadas, la fuente y la licencia, como las descargas de `/mapa` y `/vehiculos`. | HU-05 |
| RF-12 | Los estudios académicos aprobados deben publicarse en una sección «Documentos de referencia», debajo de la línea de tiempo y fuera de ella, con título, autor o institución, año, resumen y enlace. No se ven afectados por los filtros. | HU-03, HU-05 |
| RF-13 | Solo deben aparecer en la página las normas y los documentos con publicación `Aprobado`. Los `Pendiente` y `Rechazado` no se muestran ni se descargan. | HU-04 |
| RF-14 | La carga inicial (documentos del usuario y faltantes verificados) debe entrar como aportes de tipo *Norma*, con origen *agente* y estado `Pendiente`, y el editor los aprueba o rechaza en `/admin`, como cualquier aporte. | HU-04 |
| RF-15 | Cada norma desplegada debe tener un enlace «Proponer corrección» que abre `/aportar` con el tipo *Corrección* y la norma indicada, como en `/mapa`. | HU-04 |
| RF-16 | Al aprobar o editar una norma en `/admin`, la página pública debe reflejar el cambio en ≤ 5 minutos. | HU-04 |
| RF-17 | La tarjeta de inicio y el menú deben llevar a la página con la línea de tiempo (deja de mostrarse «Sección en construcción»). | HU-01 |

## Criterios de aceptación
**RF-01**
- **CA-01.1** Dadas varias normas aprobadas de años distintos, cuando se abre `/normativa`,
  entonces aparecen en una sola lista, de la fecha más reciente a la más antigua.
- **CA-01.2** Dadas dos normas del mismo año, cuando se abre la página, entonces la de
  fecha posterior aparece primero.

**RF-02**
- **CA-02.1** Dadas normas de 2019, 2022 y 2026, cuando se abre la página, entonces hay
  exactamente tres separadores de año (2026, 2022 y 2019), cada uno antes de sus normas.

**RF-03**
- **CA-03.1** Dada la página sin filtros, cuando se elige 2019 en la barra de años,
  entonces la página se desplaza hasta el separador de 2019 y la URL no cambia los filtros.
- **CA-03.2** Dado el filtro de entidad en CNO, cuando se mira la barra de años, entonces
  solo aparecen los años que tienen acuerdos del CNO aprobados.

**RF-04**
- **CA-04.1** Dada una norma aprobada, cuando se mira su tarjeta sin desplegarla, entonces
  se ven la fecha en formato dd/mm/aaaa, la entidad como texto, el tipo y número, el
  título, el estado y el resumen.
- **CA-04.3** Dada una norma cuya fecha solo tiene mes y año (o solo año), cuando se mira su
  tarjeta o el CSV, entonces se ve «septiembre de 2026» (o «2025») y no un día inventado; en la
  línea de tiempo se ordena como si fuera el primer día de ese mes o año.
- **CA-04.2** Dadas normas de entidades distintas, cuando se comparan sus tarjetas,
  entonces cada entidad tiene un color propio y su nombre escrito; el color no es la única
  forma de distinguirla.

**RF-05**
- **CA-05.1** Dada una norma con explicación, cuando se despliega, entonces aparecen la
  explicación, «Aplica a», las normas relacionadas y «Ver documento oficial».
- **CA-05.2** Dada una norma desplegada, cuando se usa «Ver documento oficial», entonces
  se abre en una pestaña nueva la URL de su columna `enlace`.
- **CA-05.3** Dada una norma, cuando se despliega y se pliega con el teclado (Enter o
  Espacio), entonces el contenido aparece y desaparece y el control anuncia si está
  desplegado.

**RF-06**
- **CA-06.1** Dada la Res. CREG 101 113 de 2026 relacionada con la Res. CREG 098 de 2019,
  y ambas aprobadas, cuando se despliega la 101 113 y se usa el enlace a la 098, entonces
  la página lleva a la tarjeta de la 098 y la muestra desplegada.
- **CA-06.2** Dada una norma relacionada que no está publicada, cuando se despliega la que
  la cita, entonces se ve su tipo, número y año como texto, sin enlace.

**RF-07**
- **CA-07.1** Dada la página, cuando se abre el filtro de entidad, entonces cada opción
  muestra su conteo, por ejemplo «CNO (5)».
- **CA-07.2** Dados los filtros entidad = CREG y estado = Vigente, cuando se aplican,
  entonces solo quedan normas de la CREG vigentes.
- **CA-07.3** Dados filtros aplicados, cuando se usa «Limpiar filtros», entonces vuelven
  todas las normas aprobadas.

**RF-08**
- **CA-08.1** Dados filtros aplicados, cuando se copia la URL y se abre en otra pestaña,
  entonces se ven los mismos filtros marcados y las mismas normas.

**RF-09**
- **CA-09.1** Dada una combinación sin resultados (por ejemplo, UPME en un año sin normas
  de la UPME), cuando se aplica, entonces se lee «Ninguna norma cumple estos filtros» y la
  barra de años no tiene años.

**RF-10**
- **CA-10.1** Dados filtros que dejan 3 normas, cuando se aplican, entonces se lee
  «3 normas»; con una sola, «1 norma».

**RF-11**
- **CA-11.1** Dado el filtro entidad = CNO, cuando se descarga el CSV, entonces el archivo
  trae la licencia, solo los acuerdos del CNO aprobados y la columna del enlace oficial.

**RF-12**
- **CA-12.1** Dados los dos estudios de la UNAL aprobados, cuando se abre la página,
  entonces aparecen en «Documentos de referencia», no en la línea de tiempo, y siguen ahí
  con cualquier filtro aplicado.

**RF-13**
- **CA-13.1** Dada una norma `Pendiente`, cuando se abre la página o se descarga el CSV,
  entonces no aparece. Al aprobarla en `/admin`, aparece (ver CA-16.1).

**RF-14**
- **CA-14.1** Dada la carga inicial, cuando el editor abre `/admin`, entonces ve cada
  norma como un aporte *Norma* pendiente de origen *agente*, con su enlace oficial, y
  ninguna aparece todavía en `/normativa`.

**RF-15**
- **CA-15.1** Dada una norma desplegada, cuando se usa «Proponer corrección», entonces se
  abre `/aportar` con el tipo *Corrección* elegido y la norma indicada en el registro
  afectado.

**RF-16**
- **CA-16.1** Dada una norma pendiente, cuando el editor la aprueba en `/admin`, entonces
  aparece en `/normativa` en ≤ 5 minutos.

**RF-17**
- **CA-17.1** Dado el inicio, cuando se usa la tarjeta «Evolución normativa de los SAEB»,
  entonces se llega a la línea de tiempo y no a «Sección en construcción».

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | A 375 px de ancho la línea de tiempo va en una sola columna, sin desplazamiento horizontal, y los filtros quedan plegados. En escritorio las tarjetas se alternan a cada lado del eje. |
| RNF-02 | Fechas en formato dd/mm/aaaa y textos en español de Colombia. |
| RNF-03 | Con movimiento reducido activado no hay animaciones al aparecer, desplegar ni saltar de año (el salto es inmediato). |
| RNF-04 | Contraste WCAG AA en textos y en los colores de entidad; sin errores de axe en la página; todo se usa con el teclado y el foco es visible. |
| RNF-05 | LCP ≤ 2,5 s en la página publicada (mediana de 3 mediciones). |
| RNF-06 | Consola del navegador sin errores. |
| RNF-07 | Los colores salen de los tokens del design system TEJ, no de colores escritos a mano. |
| RNF-08 | Ningún número, fecha ni enlace de norma se inventa: cada norma cargada tiene su documento oficial leído y su enlace verificado. Si un dato falta, queda vacío y se anota en `BITACORA.md`. |

## Datos
Tabla y archivo existentes: `normas` / `datos/normativa.csv` (`datos/esquemas.json`).

| Archivo | Columna | Tipo | Obligatorio | Valores / rango | Fuente |
|---|---|---|---|---|---|
| normativa.csv | id | texto | Sí | `EMISOR-TIPO-NÚMERO-AÑO`, p. ej. `CREG-RES-098-2019` | Construido a partir del documento |
| normativa.csv | fecha | fecha | Sí | Fecha de expedición | Documento oficial |
| normativa.csv | precision_fecha | enum | No (vacío = Día) | Día, Mes, Año. «Mes»: el documento solo trae mes y año, y `fecha` guarda el día 1 de ese mes. «Año»: solo trae el año, y `fecha` guarda el 1 de enero | Documento oficial (decisión del usuario, 2026-10-24) |
| normativa.csv | emisor | enum | Sí | CREG, MME, CNO, UPME, XM, Congreso, **Academia** (nuevo, aclaración 1) | Documento oficial |
| normativa.csv | tipo | enum | Sí | Ley, Decreto, Resolución, Proyecto de resolución, Acuerdo, Circular, Documento, **Estudio** (nuevo, aclaración 1) | Documento oficial |
| normativa.csv | numero | texto | Sí | Tal como lo escribe la entidad (p. ej. «101 113») | Documento oficial |
| normativa.csv | titulo | texto | Sí | Título oficial (epígrafe) | Documento oficial |
| normativa.csv | estado | enum | Sí | Vigente, Modificada, Derogada, En consulta | Documento oficial y normas posteriores |
| normativa.csv | resumen | texto | No (aviso si vacío) | 1 o 2 frases | Redacción propia, revisada por el editor |
| normativa.csv | explicacion | texto | No (aviso si vacío) | 1 o 2 párrafos: qué cambia para un proyecto SAEB y a quién aplica | Redacción propia, revisada por el editor |
| normativa.csv | aplica_a | texto | No | P. ej. «Operadores de red, desarrolladores de SAEB» | Documento oficial |
| normativa.csv | relacionada_con | texto | No | ids de otras normas separados por `;` | Documento oficial |
| normativa.csv | enlace | urls | Sí | URL oficial (CREG, Función Pública, CNO, XM, UPME, repositorio UNAL) | «Gestor enlaces» del usuario y búsqueda |
| (tabla) | publicacion | enum | Sí | Pendiente, Aprobado, Rechazado | Decisión del editor en `/admin` |

Carga inicial, toda como `Pendiente` (25 normas, actualizada el 2026-10-25 con la carpeta
corregida por el usuario):
- CREG (9): 127 de 2018, D-064-19, 098 de 2019, 074 de 2021, 110 de 2021, 101 023 de 2022,
  701 103 de 2025, Documento 901 225 de 2025 y 101 113 de 2026.
- CNO (5): 1354 de 2020 («Derogada», como antecedente, por decisión del usuario), 1898 de
  2024, 2028 de 2025, 2231 de 2026 y 2234 de 2026 (vigente; sustituyó al 2186 de 2026).
- XM (3), MME y Congreso (6, con la MME 40178 de 2026) y los 2 estudios de la UNAL.

Los proyectos de resolución cuya consulta cerró van como «Derogada». Quedan para después del
MVP: UPME STR 01-2020 y 01-2021, MME 40042 de 2024, CREG 070 de 2021 y 101 097 de 2026.

## Fuera de alcance
- Copia en PDF de los documentos: solo se enlaza el documento oficial.
- Filtro o clasificación por tema.
- Búsqueda de texto libre.
- Normas generales que no regulan expresamente los SAEB (autogeneración, subastas en
  general, mercado), salvo que el editor decida incluirlas.
- Vínculo entre proyectos de `/mapa` y la norma que los habilita.
- Alertas de normas nuevas y agentes programados de búsqueda.

## Aclaraciones
1. ¿Cómo se guardan los estudios académicos? → en la misma tabla de
  normas, con emisor «Academia» y tipo «Estudio». La línea de tiempo los excluye y la
  sección «Documentos de referencia» los lista. El autor o la institución van en «Aplica a»
  o en el título. (aceptada, 2026-10-24)
2. Los documentos de XM (procedimientos, modelo de despacho, propuesta de
  grid-forming) quizá no tengan fecha de expedición clara. → usar la fecha de
  publicación que aparezca en el documento o en la página de XM. Si no hay ninguna, no se
  cargan hasta que el editor la confirme. No se inventa. (aceptada, 2026-10-24)
3. Cuatro acuerdos del CNO comparten el enlace al índice SAEB del CNO.
  → buscar el enlace propio de cada acuerdo en cno.org.co y, si no existe, usar
  el índice SAEB para los cuatro. (aceptada, 2026-10-24)
4. ¿Qué estado tiene un documento de XM o de la CREG que no es norma (por
  ejemplo, el Documento CREG 064 de 2019 o una propuesta de XM)? → «Vigente» si
  sigue publicado como referencia y «En consulta» si es una propuesta abierta a
  comentarios. (aceptada, 2026-10-24)
5. Orden dentro de un año cuando dos normas tienen la misma fecha → por entidad (orden
  alfabético) y luego por número. (aceptada, 2026-10-24)

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-24 | Versión inicial | Brainstorm 004 aprobado |
| 2026-10-24 | Aclaraciones 1 a 5 resueltas con las propuestas; spec aprobada | Decisión del usuario |
| 2026-10-25 | Carga inicial: CNO 1354 como «Derogada», CREG 074 de 2021 y MME 40178 de 2026; enlaces propios del CNO según el «Gestor enlaces» corregido | Decisión del usuario |
| 2026-10-24 | Columna `precision_fecha` y CA-04.3 (mes y año, o solo año, sin día inventado). Carga inicial: solo los acuerdos CNO vigentes; proyectos cerrados como «Derogada»; faltantes restantes para después | Decisiones del usuario durante T12–T16 |
