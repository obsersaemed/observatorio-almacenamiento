# 002 · Implementación en el país — Especificación

Estado: Aprobada (2026-10-21)
Fecha: 2026-10-21
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
La sección `/mapa` muestra los SAEB aprobados de Colombia en un mapa (OSM) y en una tabla
debajo. Ambos responden a los mismos filtros, y cada proyecto tiene una tarjeta con sus
cifras y sus fuentes. Los KPI separan lo instalado (solo `En operación`) de lo que
resulta de los filtros. Una vista filtrada se puede compartir por su URL y descargar en CSV.

## Historias de usuario
- **HU-01** Como *ingeniero de planeación o conexión*, quiero ver dónde están los proyectos y
  qué servicio prestan, para entender cómo se distribuye el almacenamiento en la red.
- **HU-02** Como *empresa (desarrollador u operador)*, quiero filtrar por departamento, estado
  y operador, para conocer la competencia y el avance del mercado en una región.
- **HU-03** Como *investigador*, quiero compartir y descargar exactamente la vista filtrada
  con sus fuentes, para citarla en mis trabajos.
- **HU-04** Como *visitante que conoce un proyecto*, quiero proponer una corrección desde su
  tarjeta, para que el inventario quede bien.
- **HU-05** Como *editor*, quiero que el servicio de cada proyecto se elija de una lista
  cerrada, para que los filtros no se partan por erratas.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | `/mapa` debe mostrar un mapa de Colombia sobre teselas OSM (con su atribución) y un punto por cada proyecto aprobado que tenga coordenadas, coloreado según su estado, con una leyenda de estados. | HU-01 |
| RF-02 | Debajo del mapa debe haber una tabla con los proyectos que resultan de los filtros: nombre, operador, estado, servicios, departamento, municipio, potencia [MW], energía [MWh] y año de FPO. Debe poder ordenarse por cada columna. | HU-01, HU-02 |
| RF-03 | Los proyectos aprobados sin coordenadas deben aparecer en la tabla, marcados como «sin ubicación en el mapa», y no en el mapa. | HU-01 |
| RF-04 | Cada punto debe abrir una tarjeta del proyecto al pasar el mouse (escritorio), al tocarlo (pantalla táctil) y al recibir el foco del teclado. La tarjeta debe cerrarse con Escape o al salir del punto. | HU-01 |
| RF-05 | La tarjeta debe mostrar el nombre, el operador, el estado, la tecnología, el año de FPO, los servicios, el departamento y el municipio, el punto de conexión [kV], la potencia [MW], la energía [MWh] y la duración [h] (energía ÷ potencia), y un enlace «Proponer corrección». No muestra los enlaces de la fuente: la fuente de cada proyecto sigue en los datos y en la descarga CSV (RF-13). Los campos vacíos no se muestran, salvo servicios, que muestra «Sin dato». | HU-01, HU-03 |
| RF-06 | «Proponer corrección» debe llevar a `/aportar` con el tipo *corrección* y el proyecto ya indicados. El cambio sigue el flujo de moderación de la 001. | HU-04 |
| RF-07 | Al elegir una fila de la tabla, el mapa debe centrarse en el proyecto y abrir su tarjeta. Si el proyecto no tiene ubicación, se informa. | HU-01 |
| RF-08 | Debe haber filtros por estado, departamento, municipio, servicios, operador, tecnología y año de FPO. Cada filtro admite varios valores: se cumple si coincide cualquiera de ellos, y entre filtros distintos deben cumplirse todos. El municipio solo ofrece los municipios de los departamentos elegidos. Cada opción muestra cuántos proyectos tiene. | HU-02 |
| RF-09 | El mapa, la tabla, los KPI «según filtros» y la descarga deben reflejar siempre el mismo resultado filtrado. | HU-02, HU-03 |
| RF-10 | Los filtros activos deben quedar en la URL: abrir esa URL reproduce la misma vista. Un botón «Limpiar filtros» vuelve a la vista completa. | HU-03 |
| RF-11 | La sección debe mostrar dos grupos de KPI separados. **Instalado**: potencia [MW] y energía [MWh] de los proyectos `En operación`, que no cambian con los filtros. **Según filtros**: número de proyectos, potencia [MW] y energía [MWh] del resultado. MW y MWh siempre van en tarjetas distintas. | HU-01, HU-02 |
| RF-12 | Si ningún proyecto cumple los filtros, el mapa queda sin puntos, la tabla dice «Ningún proyecto cumple estos filtros» y los KPI «según filtros» muestran 0. | HU-02 |
| RF-13 | Debe poderse descargar en CSV el resultado filtrado, con la columna de fuente, la licencia CC BY 4.0 y sin datos personales. | HU-03 |
| RF-14 | Los servicios (`Tipo uso/conexión`) deben tomarse de una lista cerrada, con uno o varios valores por proyecto. Las mismas reglas y el mismo mensaje se aplican en la aprobación (donde se eligen de una lista), en la base de datos, en la importación y en el validador de `datos/`. | HU-05 |

## Criterios de aceptación
**RF-01**
- **CA-01.1** Dados los proyectos aprobados con coordenadas, cuando se abre `/mapa`, entonces hay un
  punto por proyecto en su ubicación, del color de su estado según la leyenda, y se ve la
  atribución de OpenStreetMap.
- **CA-01.2** Dado un proyecto `Pendiente` con coordenadas, cuando se abre `/mapa`, entonces no
  aparece ni en el mapa ni en la tabla.

**RF-02**
- **CA-02.1** Dado `/mapa` sin filtros, cuando se ordena la tabla por potencia [MW] de mayor a
  menor, entonces el primer proyecto es el de mayor potencia y las cifras usan coma decimal.

**RF-03**
- **CA-03.1** Dado un proyecto aprobado sin latitud ni longitud, cuando se abre `/mapa`, entonces
  aparece en la tabla con la marca «sin ubicación en el mapa» y no hay un punto para él.

**RF-04**
- **CA-04.1** Dado `/mapa` en escritorio, cuando el mouse pasa sobre un punto, entonces se abre
  la tarjeta de ese proyecto, y se cierra al salir del punto.
- **CA-04.2** Dado `/mapa` a 375 px en una pantalla táctil, cuando se toca un punto, entonces se
  abre su tarjeta completa y legible, sin desplazamiento horizontal.
- **CA-04.3** Dado `/mapa` usado solo con el teclado, cuando se llega con Tab a un punto, entonces
  se abre su tarjeta y se cierra con Escape.

**RF-05**
- **CA-05.1** Dado un proyecto con 50 MW y 195 MWh (dato de prueba), cuando se abre su tarjeta,
  entonces muestra «50,0 MW», «195,0 MWh» y «3,9 h», y no muestra enlaces de fuente.
- **CA-05.2** Dado un proyecto sin servicios, cuando se abre su tarjeta, entonces dice
  «Servicios: Sin dato» y no muestra los campos técnicos que están vacíos.

**RF-06**
- **CA-06.1** Dada la tarjeta de un proyecto, cuando se pulsa «Proponer corrección», entonces se
  abre `/aportar` con el tipo *corrección* y ese proyecto ya indicados.

**RF-07**
- **CA-07.1** Dada la tabla, cuando se elige la fila de un proyecto con coordenadas, entonces el
  mapa se centra en él y su tarjeta queda abierta.

**RF-08**
- **CA-08.1** Dados proyectos en varios departamentos y estados, cuando se eligen dos
  departamentos y el estado `En operación`, entonces solo quedan los proyectos en operación de
  cualquiera de esos dos departamentos.
- **CA-08.2** Dado un departamento elegido, cuando se abre el filtro de municipio, entonces solo
  lista municipios de ese departamento, cada uno con su número de proyectos.

**RF-09**
- **CA-09.1** Dado un filtro aplicado, cuando se comparan el mapa, la tabla, el KPI «proyectos
  según filtros» y las filas del CSV descargado, entonces los cuatro tienen los mismos proyectos.

**RF-10**
- **CA-10.1** Dada una vista filtrada, cuando se copia la URL y se abre en otra pestaña, entonces
  aparecen los mismos filtros y el mismo resultado.
- **CA-10.2** Dada una vista filtrada, cuando se pulsa «Limpiar filtros», entonces la URL queda
  sin filtros y se ven todos los proyectos aprobados.

**RF-11**
- **CA-11.1** Dado un filtro que deja solo proyectos `Anunciado`, cuando se miran los KPI, entonces
  los de «Instalado» no cambian y los de «según filtros (todos los estados)» suman solo los anunciados. MW y MWh
  aparecen en tarjetas distintas.

**RF-12**
- **CA-12.1** Dada una combinación de filtros sin resultados, cuando se aplica, entonces el mapa
  queda sin puntos, la tabla muestra «Ningún proyecto cumple estos filtros» y los KPI «según
  filtros» muestran 0.

**RF-13**
- **CA-13.1** Dada una vista filtrada, cuando se pulsa descargar, entonces el CSV contiene solo
  los proyectos del resultado, con la columna `Fuente`, la licencia CC BY 4.0 y ningún correo.

**RF-14**
- **CA-14.1** Dado un servicio fuera de la lista permitida, cuando se intenta guardar por la
  aprobación, por la base de datos, por la importación o con el validador, entonces se rechaza
  con el mismo mensaje, que lista los valores permitidos.
- **CA-14.2** Dado un proyecto con dos servicios separados por coma en el CSV importado, cuando
  se filtra por cualquiera de los dos, entonces el proyecto aparece, y su tarjeta lista ambos.

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | Se usa sin desplazamiento horizontal a 375 px; en móvil los filtros se pliegan en un panel. |
| RNF-02 | El contenido principal de `/mapa` (KPI y tabla) carga en menos de 2,5 s en móvil 4G (LCP); el mapa puede cargar después. |
| RNF-03 | WCAG 2.1 AA: los puntos y la tarjeta se usan con teclado, el estado no se comunica solo con color (la leyenda y la tarjeta lo dicen en texto) y la tabla es el equivalente accesible del mapa. |
| RNF-04 | Formato es-CO: coma decimal con un decimal en MW, MWh y h, y unidades entre corchetes en los encabezados. |
| RNF-05 | Colores de estados, puntos y tarjeta tomados de los tokens TEJ; ningún color escrito a mano. |
| RNF-06 | Con movimiento reducido, el mapa se centra sin animación de vuelo y los KPI no tienen conteo animado. |
| RNF-07 | `/mapa` tiene título y descripción propios; la consola del navegador no muestra errores. |
| RNF-08 | Sin costo: teselas OSM de uso libre y sin llaves de pago en el navegador. |

## Datos
| Archivo / tabla | Columna | Tipo | Obligatorio | Valores / rango | Fuente |
|---|---|---|---|---|---|
| `proyectos.csv` / `proyectos` | `Tipo uso/conexión` (nombre sin cambios; en la interfaz «Servicios») | Lista cerrada, uno o varios valores separados por coma en la Sheet y el CSV | No (vacío = «Sin dato») | «Regulación primaria de frecuencia», «Inyección de energía en la noche», «Mercado regulado a través de contratos de largo plazo». Ningún valor puede contener coma | `Base de datos SAEB` |

Los textos actuales de los proyectos se convierten a los valores de la lista sin cambiar su
significado: «Inyección de energia por la noche» → «Inyección de energía en la noche»,
«Mercado regulado a través de los contratos de largo plazo» → «Mercado regulado a través de
contratos de largo plazo». «Regulación primaria de frecuencia» no cambia. La conversión se
hace en la Sheet y en la base de datos de pruebas. Canadian solar queda vacío («Sin dato»).
| (calculada, no se guarda) | Duración [h] | Número | — | Energía [MWh] ÷ potencia [MW]; vacía si falta alguna | Derivada |

Las demás columnas no cambian. El orden de columnas de `esquemas.json` se mantiene.

## Fuera de alcance
- Filtros por dimensiones (rangos de MW, MWh y duración): después del MVP, por decisión del usuario.
- Clasificación según la resolución que habilita el proyecto.
- Página propia por proyecto, agrupación de puntos (clusters) y capas de la red.
- Gráficas adicionales (por departamento, por año): se evaluarán después.

## Aclaraciones
Resueltas por el usuario el 2026-10-21:
1. Lista de servicios: los tres valores existentes con la ortografía corregida (ver Datos). Se
   podrán agregar más actualizando el esquema. Los proyectos sin servicio quedan «Sin dato».
2. Varios servicios se separan con **coma** en la Sheet y en el CSV (ningún valor puede
   contener coma). En la base de datos se validan valor por valor contra la lista, así
   que los valores no cambian por el separador.
3. Rótulo en la interfaz: **«Servicios»**. La columna conserva el nombre `Tipo uso/conexión`.
4. Canadian solar queda «Sin dato».
5. Los KPI «según filtros» suman todos los estados del resultado y llevan el rótulo «(todos
   los estados)». «Instalado» cuenta solo `En operación`.
6. La tarjeta **no muestra los enlaces de fuente**. La fuente se conserva en los datos y en
   la descarga CSV de la sección.

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-21 | Primera versión | Brainstorm 002 aprobado (enfoque A) |
| 2026-10-21 | Aclaraciones 1–5 resueltas; separador coma; conversión de los textos actuales | Respuestas del usuario |
| 2026-10-21 | RF-05 y CA-05.1: la tarjeta no muestra los enlaces de fuente | Decisión del usuario |
