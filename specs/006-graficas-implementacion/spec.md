# 006 · Gráficas de implementación en el país — Especificación

Estado: Aprobada (2026-10-21)
Fecha: 2026-10-21
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
`/mapa` suma tres gráficas: barras por estado (con pestañas Potencia, Energía y Duración),
evolución por año de FPO y dona de tecnología. Resumen el mismo resultado filtrado que el
mapa, la tabla y los KPI de la spec 002. Cada gráfica muestra una sola medida a la vez y tiene
su equivalente en tabla.

## Historias de usuario
- **HU-01** Como *ingeniero de planeación*, quiero ver cuánta potencia, energía y duración
  hay en cada estado, para dimensionar lo que ya opera frente a lo que viene.
- **HU-02** Como *empresa*, quiero ver cómo crece la capacidad año a año según la FPO, para
  anticipar el mercado.
- **HU-03** Como *investigador*, quiero conocer la participación de cada tecnología y leer
  las cifras exactas de cada gráfica, para citarlas.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | `/mapa` debe mostrar una fila de tres gráficas en tarjetas, después del panel de filtros y antes del mapa, con un título que dice qué muestran. | HU-01, HU-02, HU-03 |
| RF-02 | Las tres gráficas deben usar el mismo resultado filtrado que el mapa, la tabla y los KPI «según filtros», y actualizarse al cambiar los filtros. | HU-01 |
| RF-03 | La gráfica de barras horizontales por estado debe tener pestañas Potencia [MW], Energía [MWh] y Duración [h], con una medida a la vez. Debe mostrar los cuatro estados en orden fijo (En operación, En construcción, Anunciado, Inactivo), cada uno con su color y su valor al final de la barra. | HU-01 |
| RF-04 | La duración de un estado debe ser la energía total ÷ la potencia total de sus proyectos que tienen ambos datos. Las duraciones nunca se suman. Un estado sin datos muestra «—». | HU-01 |
| RF-05 | La gráfica de evolución debe mostrar áreas acumuladas por año de FPO, en orden ascendente, con pestañas Potencia [MW] y Energía [MWh]. Tiene dos series: «En operación y en construcción» y «Anunciado (proyectado)». Los proyectos `Inactivo` no se suman, y el eje muestra solo años. | HU-02 |
| RF-06 | Los proyectos sin año de FPO no entran en la evolución, y la gráfica debe decir cuántos quedaron fuera. | HU-02 |
| RF-07 | La dona de tecnología muestra la potencia [MW], sin pestañas (ajuste del 2026-10-24); debe mostrar el porcentaje de cada tecnología en la leyenda y el total en el centro. | HU-03 |
| RF-08 | Cada gráfica debe ofrecer «Ver como tabla», con las mismas cifras que dibuja. | HU-03 |
| RF-09 | Si el resultado filtrado está vacío, cada gráfica debe mostrar «Sin datos para estos filtros» en lugar del dibujo. | HU-01 |

## Criterios de aceptación
**RF-01**
- **CA-01.1** Dado `/mapa`, cuando se recorre la página, entonces después del panel de
  filtros y antes del mapa hay tres tarjetas con los títulos «Capacidad por estado»,
  «Evolución por año de FPO» y «Tecnología».

**RF-02**
- **CA-02.1** Dado `/mapa`, cuando se filtra por un departamento, entonces las barras por
  estado y la dona (vistas en su tabla) suman lo mismo que los KPI «según filtros», en MW y
  en MWh, y las tres gráficas cambian. La evolución no se compara con los KPI porque excluye
  `Inactivo` y los proyectos sin año (RF-05, RF-06).

**RF-03**
- **CA-03.1** Dada la pestaña Potencia [MW] activa, cuando se mira la gráfica de estados,
  entonces aparecen los cuatro estados en el orden fijo, cada uno con su potencia total en
  formato es-CO (p. ej. «17,0»), y el eje dice [MW].
- **CA-03.2** Dada la gráfica de estados, cuando se pulsa la pestaña Energía [MWh], entonces
  la misma gráfica cambia a MWh. En ningún momento se ven MW y MWh juntos en el mismo eje.

**RF-04**
- **CA-04.1** Dados dos proyectos de prueba en operación, de 10 MW / 20 MWh y de
  5 MW / 10 MWh, cuando se abre la pestaña Duración [h], entonces «En operación» muestra
  «2,0 h», que no es 4,0 (la suma de duraciones). Un estado sin proyectos con datos muestra «—».

**RF-05**
- **CA-05.1** Dados proyectos de prueba con FPO 2021, 2024 y 2030 (los dos primeros en
  operación y el de 2030 anunciado), cuando se mira la evolución en MW, entonces el eje va
  2021 → 2030 en orden. La serie «En operación y en construcción» crece en 2021 y 2024, y la
  serie «Anunciado (proyectado)» aparece en 2030.
- **CA-05.2** Dado un proyecto `Inactivo` con FPO, cuando se mira la evolución, entonces no
  suma en ninguna serie.

**RF-06**
- **CA-06.1** Dado un proyecto aprobado sin año de FPO, cuando se mira la evolución, entonces
  se lee «1 proyecto sin año de FPO no aparece en esta gráfica».

**RF-07**
- **CA-07.1** Dados los proyectos actuales (todos Li-ion), cuando se mira la dona,
  entonces Li-ion muestra «100 %» y el total del centro coincide con el KPI «Potencia total
  proyectada».

**RF-08**
- **CA-08.1** Dada cualquier gráfica, cuando se pulsa «Ver como tabla», entonces aparece una
  tabla con las mismas categorías y cifras, en es-CO y con la unidad en el encabezado.

**RF-09**
- **CA-09.1** Dados filtros sin resultados, cuando se miran las gráficas, entonces las tres
  dicen «Sin datos para estos filtros».

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | A 375 px las tarjetas van una debajo de otra y no hay desplazamiento horizontal. |
| RNF-02 | El contenido principal de `/mapa` sigue cargando en menos de 2,5 s en móvil 4G (LCP); las gráficas pueden cargar después. |
| RNF-03 | WCAG 2.1 AA: las pestañas se usan con teclado (Tab y flechas) y anuncian cuál está activa; el estado y la tecnología no se comunican solo con color (etiquetas y leyenda en texto); cada gráfica tiene su tabla equivalente (RF-08). |
| RNF-04 | Formato es-CO: coma decimal, un decimal en los valores de MW, MWh y h, y unidades entre corchetes. Las marcas de los ejes de MW y MWh pueden ser enteras; las de duración llevan un decimal. |
| RNF-05 | Colores tomados de los tokens TEJ (los mismos colores de estado del mapa); ningún color escrito a mano. |
| RNF-06 | Con movimiento reducido, las gráficas aparecen sin animación. |
| RNF-07 | MW y MWh nunca comparten eje ni se suman (regla del proyecto). |

## Datos
No hay columnas nuevas ni cambios de esquema. Se usan `Estado`, `Potencia nominal [MW]`,
`Capacidad máxima [MWh]`, `FPO` (año) y `Tecnologia` de los proyectos aprobados. La duración
se calcula como en la 002.

## Fuera de alcance
- Barras por departamento y estado, y por servicio (quedan para después del MVP).
- Exportar gráficas como imagen.
- Comparaciones con otros países.

## Aclaraciones
Resueltas por el usuario el 2026-10-21:
1. Las gráficas van después del panel de filtros y antes del mapa (RF-01).
2. El centro de la dona muestra el total de la pestaña activa (p. ej. «7 proyectos» o
   «185,0 MW»), y los porcentajes van en la leyenda (RF-07).

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-21 | Primera versión | Brainstorm 006 aprobado (enfoque A) |
| 2026-10-21 | Aclaraciones 1 y 2 resueltas; CA-02.1 limitado a barras y dona | Respuestas del usuario y autorrevisión |
| 2026-10-22 | RNF-04: el decimal aplica a los valores; las marcas de los ejes de MW y MWh pueden ser enteras | Observación del E2E; decisión del usuario |
