# 003 · Vehículos eléctricos — Especificación

Estado: Aprobada (2026-10-22)
Fecha: 2026-10-22
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
`/vehiculos` muestra el almacenamiento en baterías de los vehículos eléctricos vendidos en
Colombia, con el contenido del tablero de Looker: filtros, dos KPI, participación por
tecnología de batería y cuatro gráficas. Los datos se importan desde la hoja
`VEHICULOS_ELECTRICOS` a la base, con validación, y la página muestra los créditos, la fecha
de la última actualización y la fecha de corte de las ventas.

## Historias de usuario
- **HU-01** Como *ingeniero de planeación*, quiero saber cuánta energía guardan las baterías
  de los vehículos eléctricos vendidos, para dimensionar su peso frente a los SAEB.
- **HU-02** Como *empresa*, quiero ver las ventas por marca y año y la participación de
  cada marca, para entender el mercado.
- **HU-03** Como *investigador*, quiero filtrar por marca, tipo de batería y línea,
  descargar los datos y saber de dónde salen y a qué fecha corresponden, para citarlos.
- **HU-04** Como *editor*, quiero actualizar los datos importando la hoja, con validación,
  para no publicar errores.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | `/vehiculos` debe mostrar los datos de vehículos importados en la base, en lugar del aviso «en construcción». | HU-01 |
| RF-02 | Debe haber filtros desplegables de selección múltiple por Marca, Tipo de batería y Línea, como los de `/mapa`, con el conteo de vehículos por opción. La línea solo ofrece las de las marcas elegidas. Todo lo que muestra la página responde a los filtros. | HU-03 |
| RF-03 | Debe haber dos KPI: «Vehículos eléctricos registrados · <primer año>–<último año>» (suma de unidades) y «Energía almacenada en circulación [MWh]» (Σ unidades × capacidad promedio de la línea ÷ 1.000). | HU-01 |
| RF-04 | La capacidad promedio de una línea debe ser el promedio de su capacidad mínima y máxima [kWh]. | HU-01 |
| RF-05 | Debe haber una tabla de participación por tipo de batería: cada tipo con su porcentaje de vehículos. | HU-01, HU-03 |
| RF-06 | Debe haber una gráfica de barras horizontales apiladas «Vehículos vendidos por marca y año de registro»: las 9 marcas con más ventas y «Otros», un segmento por año con leyenda. El último año se rotula «(parcial)» si la fecha de corte es anterior al 31 de diciembre de ese año. | HU-02 |
| RF-07 | Debe haber una dona «Participación de marcas en el mercado %» con las mismas 9 marcas y «Otros», con el porcentaje de cada una. | HU-02 |
| RF-08 | Debe haber una dona «Tecnología de batería» con la participación de cada tipo en vehículos. | HU-01 |
| RF-09 | Debe haber una gráfica de barras «Energía en circulación por tipo de batería [MWh]». | HU-01 |
| RF-10 | Cada gráfica debe ofrecer «Ver como tabla» con las mismas cifras, y mostrar «Sin datos para estos filtros» si el resultado está vacío. | HU-03 |
| RF-11 | Junto a los créditos debe leerse: «Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última actualización: dd/mm/aaaa · Ventas hasta el dd/mm/aaaa». | HU-03 |
| RF-12 | La «Última actualización» debe ser la fecha en que se importaron los datos al observatorio, registrada por la importación. «Ventas hasta» es la fecha de corte de la hoja, que se indica al importar. | HU-03, HU-04 |
| RF-13 | Debe poderse descargar en CSV el resultado filtrado, una fila por línea con sus ventas por año, tipo de batería, capacidades y energía, con la línea de créditos y fechas y la licencia CC BY 4.0. | HU-03 |
| RF-14 | La importación desde el CSV de la hoja debe validar cada fila con las reglas de datos y rechazar el archivo completo si hay errores, listando cada uno. El validador de `datos/`, la base y la importación usan las mismas reglas y los mismos mensajes. | HU-04 |
| RF-15 | Los datos de vehículos deben entrar en el respaldo diario a CSV (RF-13 de la 001). No entran al flujo de aportes. | HU-04 |

## Criterios de aceptación
**RF-01**
- **CA-01.1** Dados los datos importados, cuando se abre `/vehiculos`, entonces no aparece
  «en construcción» y se ven los KPI, la tabla de tecnología y las cuatro gráficas.

**RF-02**
- **CA-02.1** Dado `/vehiculos`, cuando se elige una marca, entonces los KPI, la tabla y las
  gráficas muestran solo esa marca, y el filtro de línea solo ofrece sus líneas, cada una con
  su conteo.
- **CA-02.2** Dados filtros activos, cuando se copia la URL y se abre en otra pestaña,
  entonces aparecen los mismos filtros y el mismo resultado.

**RF-03 / RF-04**
- **CA-03.1** Dados los datos actuales (sin filtros), cuando se miran los KPI, entonces
  dicen **45.346** vehículos (no «45.346 mil») y **2.426,5 MWh**.
- **CA-03.2** Dada una línea de prueba con 100 unidades y capacidades de 40 y 60 kWh,
  cuando se filtra por ella, entonces la energía es «5,0 MWh».

**RF-05**
- **CA-05.1** Dados los datos actuales, cuando se mira la tabla de tecnología, entonces LFP
  muestra 67,5 % y los porcentajes suman 100 % con un margen de ±0,1 por redondeo (cada valor
  se muestra redondeado a un decimal).

**RF-06**
- **CA-06.1** Dados los datos actuales, cuando se mira la gráfica por marca, entonces hay 10
  barras (9 marcas y «Otros»): las 9 marcas ordenadas de mayor a menor y «Otros» siempre al
  final, aunque sume más que algunas marcas (como el tablero de Looker). La leyenda muestra cada año y
  «2026 (parcial)», porque el corte es anterior al 31/12/2026.

**RF-07**
- **CA-07.1** Dados los datos actuales, cuando se mira la dona de marcas, entonces muestra
  las mismas 10 categorías de la gráfica de barras, con «Otros» al final, y sus porcentajes suman
  100 % con un margen de ±0,1 por redondeo.

**RF-08**
- **CA-08.1** Dados los datos actuales, cuando se mira la dona de tecnología, entonces sus
  porcentajes coinciden con la tabla de RF-05.

**RF-09**
- **CA-09.1** Dados los datos actuales, cuando se mira la energía por tipo de batería,
  entonces la suma de las barras en MWh coincide con el KPI de energía (2.426,5 MWh).

**RF-10**
- **CA-10.1** Dada cualquier gráfica, cuando se pulsa «Ver como tabla», entonces aparece una
  tabla con las mismas categorías y cifras en es-CO, con la unidad en el encabezado.
- **CA-10.2** Dados filtros sin resultados, cuando se miran las gráficas, entonces dicen
  «Sin datos para estos filtros» y los KPI muestran 0.

**RF-11 / RF-12**
- **CA-11.1** Dada una importación hecha hoy con corte al 17/09/2026, cuando se abre
  `/vehiculos`, entonces se lee «Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio
  · Última actualización: <hoy en dd/mm/aaaa> · Ventas hasta el 17/09/2026».

**RF-13**
- **CA-13.1** Dado un filtro por marca, cuando se descarga el CSV, entonces trae solo las
  líneas de esa marca, con las columnas del esquema, la línea de créditos y fechas, y la
  licencia CC BY 4.0.

**RF-14**
- **CA-14.1** Dado un CSV con una fila con ventas negativas o un tipo de batería fuera de la
  lista, cuando se importa, entonces se rechaza todo el archivo, se lista cada error con su
  fila y la página sigue mostrando los datos anteriores. El mismo dato también se rechaza
  directamente en la base, con el mismo mensaje.
- **CA-14.2** Dado un CSV válido, cuando se importa, entonces la página muestra los datos
  nuevos y la nueva fecha de «Última actualización» en un máximo de 5 minutos.

**RF-15**
- **CA-15.1** Dado un día cualquiera, cuando corre el respaldo diario, entonces el
  repositorio tiene el CSV de vehículos actualizado junto a los de proyectos, normativa y
  noticias.

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | Sin desplazamiento horizontal a 375 px; las tarjetas se apilan y los filtros se pliegan en un panel. |
| RNF-02 | El contenido principal de `/vehiculos` carga en menos de 2,5 s en móvil 4G (LCP); las gráficas pueden cargar después. |
| RNF-03 | WCAG 2.1 AA: los filtros y «Ver como tabla» se usan con teclado; la información no se comunica solo con color (leyendas y etiquetas en texto); cada gráfica tiene su tabla equivalente. |
| RNF-04 | Formato es-CO: punto de miles y coma decimal (45.346; 2.426,5 MWh); un decimal en MWh y porcentajes; capacidad de batería en kWh con un decimal; unidades entre corchetes. |
| RNF-05 | Colores de los tokens TEJ; ningún color escrito a mano. |
| RNF-06 | Con movimiento reducido no hay animaciones. |
| RNF-07 | Vehículos (unidades) y energía (MWh) nunca comparten eje. |

## Datos
Dos entidades nuevas en `datos/esquemas.json`, más un registro de importaciones:

| Entidad | Columna | Tipo | Obligatorio | Valores / rango | Fuente |
|---|---|---|---|---|---|
| `vehiculos_lineas` | Marca | texto | Sí | — | Hoja `VEHICULOS_ELECTRICOS` |
| | Línea | texto | Sí | Clave: Marca + Línea, sin repetir | Hoja |
| | Tipo de batería | lista de valores | Sí | LFP, Lithium-ion, NMC Lithium-ion, ULTIUM (aclaración 1) | Hoja |
| | Capacidad mínima [kWh] | número | Sí | > 0 | Hoja (ficha técnica) |
| | Capacidad máxima [kWh] | número | Sí | ≥ capacidad mínima | Hoja (ficha técnica) |
| | Potencia [kW] | número | No | > 0 | Hoja (ficha técnica) |
| `vehiculos_ventas` | Línea | texto | Sí | Debe existir en `vehiculos_lineas`; la Línea es única, así que la marca se toma de la ficha. Clave: Línea + Año | Hoja |
| | Año | entero | Sí | 2000 a 2100 | Hoja (columna del año) |
| | Unidades | entero | Sí | ≥ 0 | Hoja (ANDEMOS / RUNT) |
| `vehiculos_importaciones` | Fecha de actualización | fecha | Sí | La registra la importación | — |
| | Ventas hasta (corte) | fecha | Sí | ≤ fecha de actualización | La indica quien importa |

La hoja trae una columna por año (2024, 2025, 2026); la importación las convierte en filas de
`vehiculos_ventas`. El total y los kWh de la hoja no se guardan: se calculan (RF-03, RF-04)
y la importación los usa como control de cuadre.

## Fuera de alcance
- Tabla completa por línea en pantalla (la descarga CSV sí trae el detalle).
- Distinguir los híbridos enchufables y unificar líneas duplicadas (decisión del usuario).
- Aportes o correcciones de terceros sobre vehículos.
- Datos del RUNT procesados por el observatorio (la importación sigue siendo desde la hoja).

## Aclaraciones
Resueltas por el usuario el 2026-10-22:
1. **Tipo de batería:** lista cerrada con los valores exactos de la hoja. Se parte de «LFP»,
   «Lithium-ion», «NMC Lithium-ion» y «ULTIUM» y se confirman al importar.
2. **Filtros:** quedan en la URL, como en `/mapa` (CA-02.2).
3. **Cuadre:** si el total o los kWh de la hoja no coinciden con lo calculado, la importación
   se rechaza (RF-14).
4. **Importación:** solo un editor, con un comando desde su equipo que usa la llave de
   servicio. No hay pantalla en `/admin` en el MVP.

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-22 | Primera versión | Brainstorm 003 aprobado (modelo B) |
| 2026-10-22 | Aclaraciones 1–4 resueltas | Respuestas del usuario |
| 2026-10-22 | CA-05.1 y CA-07.1: los porcentajes suman 100 % ±0,1 por redondeo. CA-06.1 y CA-07.1: «Otros» siempre al final. Datos: las ventas se identifican por Línea + Año, sin Marca | Informe E2E (segunda corrida: E2E-08 y observaciones); aprobado por el usuario |
