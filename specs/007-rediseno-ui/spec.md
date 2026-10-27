# 007 · Rediseño de la interfaz — Especificación

Estado: Aprobada
Fecha: 2026-10-26
Brainstorm: [brainstorm.md](brainstorm.md)
Maqueta aprobada: artefacto «Rediseño Observatorio SAEB», versión 21 (2026-10-26).

## Resumen
El sitio adopta el diseño aprobado en la maqueta: grises con acentos naranja, cifras primero
y filtros recogidos. En `/mapa` el mapa tiene pestañas y en `/normativa` se agrega una línea
de puntos que lleva a la línea de tiempo. Los datos, los cálculos, los filtros y el flujo de
aportes no cambian: solo cambian la presentación y el orden.

## Historias de usuario
- **HU-01** Como *profesional de una empresa*, quiero ver primero las cifras de cada sección,
  para no tener que leer textos largos antes de llegar al dato.
- **HU-02** Como *ingeniero de planeación*, quiero ver en el inicio cómo crece la potencia
  instalada y la proyectada, para dimensionar lo que viene.
- **HU-03** Como *ingeniero*, quiero que los filtros ocupen poco espacio y muestren qué está
  activo, para ver más gráficas y mapa en la pantalla.
- **HU-04** Como *investigador*, quiero ubicar una norma en una línea de fechas y saltar a su
  ficha, para entender el orden de la regulación.
- **HU-05** Como *visitante*, quiero distinguir el almacenamiento a gran escala del que está
  detrás del medidor, para saber qué incluye el mapa.
- **HU-06** Como *usuario con baja visión o con lector de pantalla*, quiero buen contraste y
  controles con nombre, para usar el sitio sin barreras.

## Requisitos funcionales

### General
| ID | Requisito | HU |
|---|---|---|
| RF-01 | Todas las páginas deben usar la paleta aprobada. Grises en encabezado, texto, botones principales y gráficas; naranja (#e8935a, #f4b183) solo como acento (bordes, barra del logo, página activa del menú, proyección y llamado a aportar). | HU-01, HU-06 |
| RF-02 | El encabezado debe ser gris oscuro, con el nombre del sitio, una barra naranja y el menú Inicio, Implementación, Vehículos, Normativa, Noticias y Aportar. La página actual se marca con un subrayado naranja y como página actual para lectores de pantalla. | HU-01, HU-06 |
| RF-03 | En `/mapa`, `/vehiculos`, `/normativa` y `/noticias` el orden debe ser: título corto, cifras o contenido principal, y el texto de introducción al final de la página. | HU-01 |
| RF-04 | Los botones deben tener un estilo formal: rectangulares con esquinas poco redondeadas. Los principales son gris oscuro con texto blanco; los secundarios, blancos con borde gris. Sin degradados ni sombras de color. | HU-01 |
| RF-05 | Los íconos deben ser de un solo juego de trazo lineal, coherente en todo el sitio. | HU-01 |
| RF-06 | El mapa de Colombia tenue de fondo se mantiene en todas las páginas. | HU-01 |
| RF-07 | Las pestañas (Potencia / Energía / Duración y las demás) conservan el diseño actual. | HU-03 |
| RF-08 | En `/mapa` y `/normativa` los filtros deben estar recogidos al cargar. Se ve una barra con el botón «Filtros», la búsqueda (si la página la tiene), los filtros activos como chips que se quitan con un clic y el conteo de resultados. Al pulsar «Filtros» se despliega el panel; el botón indica si está abierto o cerrado y cuántos filtros hay activos. | HU-03 |
| RF-09 | Con filtros en la URL, la página debe cargar con esos filtros aplicados y visibles como chips, aunque el panel esté recogido. | HU-03 |

### Inicio
| ID | Requisito | HU |
|---|---|---|
| RF-10 | El inicio debe mostrar una gráfica de barras de la potencia acumulada [MW] por año de FPO. Suma los proyectos En operación, En construcción y Anunciado (los Inactivo no cuentan). Va en gris hasta el último año que solo tiene proyectos En operación y en naranja desde el primer año con proyectos En construcción o Anunciado, con una nota que dice que esas barras son proyección. | HU-02 |
| RF-11 | Las barras de la gráfica del inicio deben crecer una sola vez al cargar. Es la única animación del sitio. | HU-02 |
| RF-12 | El inicio debe mostrar tres tarjetas de «Secciones principales», cada una con imagen, título, texto y botón. Implementación: mapa de Colombia con los puntos de los proyectos por color de estado, y el texto «Mapa e inventario de los SAEB en Colombia.». Vehículos: ícono de vehículo eléctrico enchufado y «Tecnologías y oportunidades de almacenamiento energético en la movilidad eléctrica.». Normativa: mini línea de puntos y «Consulta el marco regulatorio de los SAEB en Colombia.». | HU-01 |
| RF-13 | El inicio debe mostrar las cifras de potencia instalada [MW] y energía instalada [MWh] (solo En operación) y el número de proyectos identificados. | HU-01, HU-02 |
| RF-14 | El inicio debe mostrar las últimas noticias aprobadas y un llamado a aportar con botón a `/aportar`. | HU-01 |

### Implementación (`/mapa`)
| ID | Requisito | HU |
|---|---|---|
| RF-15 | `/mapa` debe mostrar, en este orden: los KPI, la barra de filtros, las tres gráficas de la 006 en una fila (en escritorio), el mapa y la tabla de inventario. | HU-01 |
| RF-16 | El mapa debe tener dos pestañas: «Gran escala» (seleccionada al cargar) y «Detrás del medidor». | HU-05 |
| RF-17 | «Gran escala» debe mostrar el mapa interactivo actual (OpenStreetMap), centrado en Colombia al cargar. Tiene botones de acercar y alejar y conserva el zoom con rueda o gestos, el arrastre, los puntos por estado y la tarjeta del proyecto. | HU-05 |
| RF-18 | «Detrás del medidor» debe mostrar el aviso «Sección en construcción» con una frase que explica qué es el almacenamiento detrás del medidor. No muestra puntos. | HU-05 |
| RF-19 | La tabla de inventario debe tener las columnas Nombre, Operador, Estado, Servicios, Departamento, Municipio, Potencia [MW], Energía [MWh] y Año de FPO. | HU-01 |

### Vehículos (`/vehiculos`)
| ID | Requisito | HU |
|---|---|---|
| RF-20 | `/vehiculos` debe mostrar primero las cifras del diseño original: vehículos eléctricos registrados, energía almacenada en circulación [MWh] y la participación por tipo de batería [%]. | HU-01 |
| RF-21 | La barra de filtros de `/vehiculos` debe mostrar las fuentes y las fechas (última actualización y fecha hasta la que van las ventas). | HU-01 |
| RF-22 | Las cuatro gráficas de vehículos (marcas por año, participación de marcas, tecnología de batería y energía por tipo) van debajo de las cifras con el estilo nuevo. | HU-01 |

### Normativa (`/normativa`)
| ID | Requisito | HU |
|---|---|---|
| RF-23 | `/normativa` debe mostrar, antes de la línea de tiempo, una línea horizontal de fechas con un punto por norma, coloreado por emisor y con leyenda. | HU-04 |
| RF-24 | Al pasar el mouse o enfocar un punto, se debe ver el emisor, el tipo y número, la fecha y el título de la norma. | HU-04, HU-06 |
| RF-25 | Al hacer clic en un punto (o pulsar Enter sobre él), la página debe desplazarse de inmediato a la ficha de esa norma en la línea de tiempo y resaltarla. | HU-04 |
| RF-26 | La línea de tiempo vertical existente se mantiene debajo, con el estilo nuevo. | HU-04 |

### Noticias (`/noticias`)
| ID | Requisito | HU |
|---|---|---|
| RF-27 | Cada noticia debe llevar arriba una ilustración propia según su tema, sin fotos de los medios, y una etiqueta con el nombre del tema. | HU-01 |
| RF-28 | El tema se toma de la primera etiqueta de la noticia, según una lista cerrada: Regulación, Subasta, Mercado, Empresas, Ambiente y Política pública. Si la primera etiqueta no está en la lista o no hay etiquetas, se usa el tema «General» con su propia ilustración. | HU-01 |

## Criterios de aceptación

**RF-01**
- **CA-01.1** Dada cualquier página, cuando se mide el contraste de cada texto con su
  fondo, entonces es de al menos 4,5:1 (3:1 en textos grandes de 24 px o más).
- **CA-01.2** Dada cualquier página, cuando se buscan textos de color naranja sobre
  fondo blanco o gris claro, entonces no hay ninguno: el naranja solo aparece en bordes,
  barras, rellenos o como fondo de texto oscuro.

**RF-02**
- **CA-02.1** Dada cualquier página, cuando se mira el encabezado, entonces es gris oscuro,
  tiene la barra naranja junto al nombre y el menú con las seis entradas en ese orden.
- **CA-02.2** Dada `/normativa`, cuando un lector de pantalla recorre el menú, entonces
  «Normativa» se anuncia como página actual y se ve subrayada en naranja.

**RF-03**
- **CA-03.1** Dada cada una de las cuatro páginas, cuando se abre, entonces el primer
  elemento después del título son las cifras o el contenido principal, y el texto de
  introducción de la página aparece al final, antes del pie.

**RF-04**
- **CA-04.1** Dada cualquier página, cuando se miran los botones, entonces los principales
  son gris oscuro con texto blanco y los secundarios blancos con borde gris, sin degradados.

**RF-05**
- **CA-05.1** Dada cualquier página, cuando se miran los íconos, entonces todos son de trazo
  lineal del mismo juego; no hay emojis ni íconos de relleno de otros juegos.

**RF-06**
- **CA-06.1** Dada cualquier página, cuando se mira el fondo, entonces se ve el mapa de
  Colombia tenue detrás del contenido.

**RF-07**
- **CA-07.1** Dada la gráfica «Capacidad por estado», cuando se miran sus pestañas,
  entonces conservan la forma actual: grupo gris claro con la pestaña activa en gris oscuro.

**RF-08**
- **CA-08.1** Dada `/mapa` sin filtros en la URL, cuando carga, entonces el panel está
  recogido y se ven el botón «Filtros» y el conteo «N proyectos» (sin búsqueda: `/mapa` no
  tiene buscador, según RF-08).
- **CA-08.2** Dado el panel recogido, cuando se pulsa «Filtros», entonces se despliega y el
  botón cambia a «Ocultar filtros»; al pulsarlo de nuevo se recoge.
- **CA-08.3** Dado un filtro de estado aplicado, cuando se mira la barra, entonces aparece
  un chip con ese valor y el botón dice «Filtros (1)»; al pulsar el chip se quita el filtro y
  el conteo vuelve al total.
- **CA-08.4** Dada `/normativa`, cuando carga, entonces sus filtros también están recogidos
  con el mismo comportamiento.

**RF-09**
- **CA-09.1** Dada la URL `/mapa?estado=En%20operación` (o el formato de filtros vigente),
  cuando se abre, entonces los resultados están filtrados y se ve el chip «En operación»
  con el panel recogido.

**RF-10**
- **CA-10.1** Dados los proyectos publicados, cuando se abre el inicio, entonces cada barra
  muestra la suma acumulada de MW hasta su año de FPO de los proyectos En operación, En
  construcción y Anunciado, con su valor en formato es-CO (p. ej. «17,0»).
- **CA-10.2** Dados los proyectos publicados, cuando se mira la gráfica, entonces las barras
  con proyectos En construcción o Anunciado son naranja, las demás gris, y se lee una nota
  que explica que las barras naranja son proyección.
- **CA-10.3** Dado un proyecto Inactivo, cuando se mira la gráfica, entonces su potencia no
  está en ninguna barra.

**RF-11**
- **CA-11.1** Dado el sistema con movimiento reducido activado, cuando se abre el inicio,
  entonces las barras aparecen en su altura final sin animación.
- **CA-11.2** Dado cualquier página, cuando se espera 10 s sin interactuar, entonces nada se
  mueve en bucle.

**RF-12**
- **CA-12.1** Dado el inicio, cuando se miran las tres tarjetas, entonces tienen los títulos
  y textos de RF-12 y cada botón lleva a `/mapa`, `/vehiculos` y `/normativa`.
- **CA-12.2** Dada la tarjeta de Implementación, cuando se mira su imagen, entonces se ve el
  contorno de Colombia con un punto por proyecto publicado, del color de su estado.

**RF-13**
- **CA-13.1** Dados los proyectos publicados, cuando se abre el inicio, entonces la potencia y
  la energía instaladas suman solo los proyectos En operación, en tarjetas separadas.

**RF-14**
- **CA-14.1** Dado el inicio, cuando se mira, entonces aparecen las noticias aprobadas más
  recientes con su fecha y un botón «Aportar» que lleva a `/aportar`.

**RF-15**
- **CA-15.1** Dada `/mapa` en escritorio (1280 px), cuando carga, entonces el orden visible
  es KPI, filtros, tres gráficas en una fila, mapa e inventario.

**RF-16**
- **CA-16.1** Dada `/mapa`, cuando carga, entonces el mapa muestra las pestañas «Gran
  escala» (seleccionada) y «Detrás del medidor».
- **CA-16.2** Dado el teclado, cuando se enfocan las pestañas, entonces se cambia de una a
  otra con las flechas y se anuncian como pestañas.

**RF-17**
- **CA-17.1** Dada «Gran escala», cuando carga, entonces el mapa queda centrado en Colombia
  con todo el territorio continental a la vista y con los créditos de OpenStreetMap.
- **CA-17.2** Dado el mapa, cuando se pulsa «Acercar», entonces el zoom aumenta; con
  «Alejar» disminuye; con la rueda del mouse también cambia.
- **CA-17.3** Dado un punto, cuando se hace clic, entonces se abre la tarjeta del proyecto
  como hoy.

**RF-18**
- **CA-18.1** Dada `/mapa`, cuando se elige «Detrás del medidor», entonces se lee «Sección en
  construcción» y la explicación, sin puntos ni mapa de proyectos; al volver a «Gran escala»
  el mapa reaparece.

**RF-19**
- **CA-19.1** Dada `/mapa`, cuando se mira la tabla, entonces sus encabezados son exactamente
  los nueve de RF-19, en ese orden.

**RF-20**
- **CA-20.1** Dada `/vehiculos`, cuando carga, entonces lo primero después del título son las
  tarjetas de vehículos registrados y energía en circulación [MWh] y la tabla de
  participación por tipo de batería [%], con los mismos valores que hoy.

**RF-21**
- **CA-21.1** Dada `/vehiculos`, cuando se mira la barra de filtros, entonces se leen las
  fuentes, la fecha de última actualización y la fecha hasta la que van las ventas.

**RF-22**
- **CA-22.1** Dada `/vehiculos`, cuando se baja, entonces están las cuatro gráficas de RF-22
  debajo de las cifras.

**RF-23**
- **CA-23.1** Dada `/normativa`, cuando carga, entonces antes de la línea de tiempo hay una
  línea horizontal con años marcados, un punto por cada norma de la línea de tiempo y la
  leyenda de colores por emisor.
- **CA-23.2** Dado un filtro aplicado en `/normativa`, cuando se mira la línea de puntos,
  entonces muestra solo las normas que muestra la línea de tiempo.

**RF-24**
- **CA-24.1** Dado un punto, cuando se pasa el mouse o se enfoca con Tab, entonces aparece
  un recuadro con el emisor, el tipo y número, la fecha y el título.

**RF-25**
- **CA-25.1** Dado un punto, cuando se hace clic, entonces la ficha de esa norma queda a la
  vista en la línea de tiempo y resaltada; no hay que hacer otro clic.
- **CA-25.2** Dado un punto enfocado con el teclado, cuando se pulsa Enter, entonces ocurre lo
  mismo y el foco pasa a la ficha.

**RF-26**
- **CA-26.1** Dada `/normativa`, cuando se baja, entonces la línea de tiempo vertical muestra
  las mismas normas, años y fichas desplegables que hoy.

**RF-27**
- **CA-27.1** Dada una noticia, cuando se mira su tarjeta, entonces arriba hay una
  ilustración (no una foto) y una etiqueta con el nombre del tema.
- **CA-27.2** Dada la página, cuando se revisan las imágenes, entonces ninguna se carga desde
  el sitio de un medio.

**RF-28**
- **CA-28.1** Dada una noticia con etiquetas «regulación;CREG», cuando se mira, entonces su
  tema es «Regulación».
- **CA-28.2** Dada una noticia con etiquetas «ambiental;…», cuando se mira, entonces su tema es
  «Ambiente».
- **CA-28.3** Dada una noticia sin etiquetas o con una primera etiqueta fuera de la lista,
  cuando se mira, entonces su tema es «General».

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | Todas las páginas se usan sin desplazamiento horizontal a 375 px de ancho; a ese ancho, las filas de tarjetas y gráficas pasan a una columna. |
| RNF-02 | Las cifras usan formato es-CO (coma decimal, punto de miles) y unidades entre corchetes. MW y MWh nunca comparten eje ni se suman. |
| RNF-03 | Con movimiento reducido activado no hay animaciones ni desplazamientos suaves (el salto de RF-25 es instantáneo). |
| RNF-04 | WCAG 2.1 AA: axe sin violaciones serias o críticas en las seis páginas públicas. Todo control se usa con teclado y tiene foco visible. |
| RNF-05 | LCP en el sitio publicado no peor que antes del rediseño en cada página (referencias del 2026-10-25 y 2026-10-26 en `BITACORA.md`). |
| RNF-06 | Consola del navegador sin errores en las seis páginas públicas. |
| RNF-07 | No se agregan librerías fuera del stack aprobado. |

## Datos
No hay columnas nuevas ni cambios de esquema.

| Archivo | Columna | Uso nuevo | Fuente |
|---|---|---|---|
| `noticias` | `etiquetas` | La primera etiqueta define el tema de la ilustración (RF-28). Equivalencias: «regulación» → Regulación; «subasta» → Subasta; «mercado» → Mercado; «empresas» → Empresas; «ambiental» o «ambiente» → Ambiente; «política pública» → Política pública. No se distinguen mayúsculas ni tildes. | Editor en `/admin` |
| `proyectos` | `estado`, `potencia_mw`, `año FPO` | Gráfica de crecimiento del inicio (RF-10) | Base de datos SAEB |

## Fuera de alcance
- Datos, carga y puntos de proyectos detrás del medidor (spec aparte cuando el usuario los
  entregue).
- Filtros por MW, MWh y duración y clasificación por resolución.
- Cambios en `/admin` y en el formulario de `/aportar` más allá del tema visual (colores,
  encabezado y botones).
- Cambiar textos de introducción o títulos (siguen los de `textos.ts`, definidos por el
  usuario).
- Publicar: se hace después del MVP del 2026-10-27, con confirmación del usuario.

## Aclaraciones
- Aclaración 1: la línea de puntos de `/normativa` muestra exactamente lo que muestra la línea
  de tiempo, con los mismos filtros; incluye los estudios si aparecen en ella → aceptada (2026-10-26).
- Aclaración 2: las filas de gráficas y de tarjetas pasan a una columna por debajo de 860 px
  de ancho → aceptada (2026-10-26).
- Aclaración 3: se agregan botones de acercar y alejar arriba a la derecha del mapa, como los
  de OpenStreetMap → aceptada (2026-10-26).

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-26 | Versión inicial | Brainstorm 007 aprobado (enfoque A) |
| 2026-10-26 | Aclaraciones 1 a 3 resueltas; spec aprobada | Respuestas del usuario |
| 2026-10-27 | CA-08.1 sin búsqueda en `/mapa` (coherente con RF-08) | Hallazgo de T21; decisión del usuario |
| 2026-10-27 | CA-07.1: la pestaña activa y la cabecera de la tabla pasan a gris oscuro con texto blanco | axe: 2,76:1 sobre el gris medio; decisión del usuario (mismo aspecto que la maqueta) |
