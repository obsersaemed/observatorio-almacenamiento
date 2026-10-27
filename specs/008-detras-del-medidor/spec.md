# 008 · Almacenamiento detrás del medidor — Especificación

Estado: Aprobada
Fecha: 2026-10-27
Brainstorm: [brainstorm.md](brainstorm.md)

## Resumen
Los proyectos con baterías instaladas en usuarios (detrás del medidor) entran a la misma tabla de
proyectos, **sin columnas nuevas**: se llenan las mismas columnas de los proyectos a gran escala.
Un proyecto es «detrás del medidor» cuando su servicio (`Tipo uso/conexión`) es uno de los
servicios de ese segmento. En `/mapa`, dos botones debajo del título («Gran escala» y «Detrás del
medidor») cambian **toda** la página: KPI, filtros, gráficas, mapa, tarjetas y tabla. En «Detrás
del medidor» las cifras van en kW y kWh. El inicio sigue mostrando solo la gran escala.

## Historias de usuario
- **HU-01** Como *empresa instaladora o desarrolladora*, quiero ver dónde hay baterías detrás del
  medidor y de qué tamaño son, para conocer el mercado.
- **HU-02** Como *ingeniero de un operador de red*, quiero saber el uso de cada sistema y su
  operador de red, para entender su efecto en la red de distribución.
- **HU-03** Como *investigador*, quiero descargar estos proyectos con su fuente, para analizarlos
  aparte de la gran escala.
- **HU-04** Como *editor*, quiero aprobar estos proyectos en `/admin` antes de publicarlos.

## Requisitos funcionales
| ID | Requisito | HU |
|---|---|---|
| RF-01 | Un proyecto es «Detrás del medidor» si su `Tipo uso/conexión` incluye un servicio marcado como de ese segmento en el esquema; si no, es «Gran escala». No se agregan columnas a `proyectos`. | HU-01, HU-03 |
| RF-02 | La lista cerrada de servicios debe aceptar «Maximización de autoconsumo PV y respaldo», marcado como servicio de «Detrás del medidor». Un proyecto no puede mezclar servicios de los dos segmentos. | HU-02 |
| RF-03 | Debajo del título de `/mapa` debe haber dos botones, «Gran escala» y «Detrás del medidor», con el segmento elegido resaltado. Por defecto se ve «Gran escala». El segmento elegido queda en la URL, para poder compartir el enlace. | HU-01 |
| RF-04 | Al elegir un segmento, los KPI, las opciones de los filtros, las tres gráficas, el mapa, el conteo, las tarjetas de proyecto, la tabla y la descarga filtrada de `/mapa` deben mostrar solo los proyectos de ese segmento. Al cambiar de segmento se limpian los filtros. | HU-01 |
| RF-05 | En «Detrás del medidor», la potencia se muestra en kW y la energía en kWh (KPI, gráficas, tarjeta y tabla). En «Gran escala», en MW y MWh como hoy. | HU-01 |
| RF-06 | En «Detrás del medidor» debe leerse la nota «Ubicación aproximada: cabecera del municipio», porque los puntos no muestran la dirección del usuario. | HU-01 |
| RF-07 | La gráfica de crecimiento, las cifras y el mini mapa del inicio deben incluir solo proyectos de «Gran escala». | HU-01 |
| RF-08 | Si no hay proyectos aprobados de «Detrás del medidor», al elegir ese segmento se debe leer «Sección en construcción» con su explicación, en lugar de los KPI, las gráficas, el mapa y la tabla. | HU-01 |
| RF-09 | Para proyectos «Detrás del medidor», la fuente puede ser una referencia textual sin URL, por ejemplo «Información de Azimut Energía (2026-10)». Los de «Gran escala» siguen exigiendo URL. La descarga CSV trae la fuente de cada fila. | HU-03 |
| RF-10 | Las mismas reglas (servicio en la lista, sin mezclar segmentos, fuente según segmento) deben aplicarse en el validador, la base de datos, la importación y `/admin`. | HU-04 |
| RF-12 | Provisionalmente, la tabla de proyectos de `/mapa` no muestra la columna «Servicios» en ninguno de los dos segmentos, mientras se define mejor esa información, y el encabezado «Operador» de la tabla se llama «Promotor». Las demás columnas, los filtros, la tarjeta y la descarga CSV no cambian. | HU-01 |
| RF-11 | Los tres proyectos iniciales deben entrar como aportes «Proyecto nuevo» en estado `Pendiente`, con las mismas columnas de gran escala llenas con los datos del brainstorm, y las coordenadas de la cabecera municipal según la DIVIPOLA del DANE. Se publican solo cuando el editor los aprueba en `/admin`. | HU-04 |

## Criterios de aceptación

**RF-01**
- **CA-01.1** Dada la base actual, cuando se abre `/mapa` en «Gran escala», entonces se ven los
  mismos proyectos y cifras de hoy.
- **CA-01.2** Dado un proyecto con el servicio «Maximización de autoconsumo PV y respaldo»,
  cuando se abre `/mapa`, entonces aparece solo en «Detrás del medidor».

**RF-02**
- **CA-02.1** Dado un aporte con el servicio nuevo, cuando se valida, entonces se acepta; con un
  servicio fuera de la lista, se rechaza.
- **CA-02.2** Dado un proyecto con «Regulación primaria de frecuencia, Maximización de autoconsumo
  PV y respaldo», cuando se valida, entonces se rechaza con un mensaje que nombra
  `Tipo uso/conexión`.

**RF-03**
- **CA-03.1** Dado `/mapa`, cuando se abre, entonces debajo del título están los botones «Gran
  escala» (resaltado) y «Detrás del medidor», antes de los KPI.
- **CA-03.2** Dado «Detrás del medidor» elegido, cuando se copia la URL y se abre en otra
  pestaña, entonces se abre con ese segmento. Los botones se usan con teclado.

**RF-04**
- **CA-04.1** Dado «Detrás del medidor» elegido con proyectos aprobados, cuando se mira la
  página, entonces los KPI, el conteo, las gráficas, los puntos del mapa y las filas de la tabla
  corresponden solo a ese segmento, y las opciones de los filtros (operador, departamento,
  etc.) salen de sus proyectos.
- **CA-04.2** Dado un filtro activo en «Gran escala», cuando se cambia a «Detrás del medidor»,
  entonces no queda ningún filtro activo.
- **CA-04.3** Dado un punto del mapa en «Detrás del medidor», cuando se hace clic o se enfoca y
  se pulsa Enter, entonces se abre la tarjeta del proyecto.

**RF-05**
- **CA-05.1** Dados los tres proyectos iniciales aprobados, cuando se elige «Detrás del medidor»,
  entonces los KPI dicen «15,0 kW» y «40,0 kWh» en operación (en tarjetas separadas) y los
  encabezados de la tabla dicen «[kW]» y «[kWh]».
- **CA-05.2** Dado «Centro Comercial Ipiales», cuando se abre su tarjeta, entonces se leen
  107,0 kW, 241,0 kWh, En construcción, Azimut Energía, LFP, Maximización de
  autoconsumo PV y respaldo, 2026, Ipiales, Nariño, y no hay enlaces de fuente.
- **CA-05.3** Dado «Gran escala», cuando se mira la página, entonces las cifras siguen en MW y MWh.

**RF-06**
- **CA-06.1** Dado «Detrás del medidor» con proyectos, cuando se mira la página, entonces se lee
  la nota de ubicación aproximada.
- **CA-06.2** Dado «Casa Alto de las Palmas», cuando se mira su tarjeta y el CSV, entonces el
  nombre es «Casa Alto de las Palmas» y la ubicación es Medellín, Antioquia (sin dirección).

**RF-07**
- **CA-07.1** Dado un proyecto «Detrás del medidor» aprobado, cuando se abre el inicio, entonces
  la gráfica de crecimiento, las cifras y el mini mapa no lo incluyen.

**RF-08**
- **CA-08.1** Dada la base sin proyectos aprobados del segmento, cuando se elige «Detrás del
  medidor», entonces se lee «Sección en construcción» y no hay mapa ni KPI.

**RF-09**
- **CA-09.1** Dado un proyecto «Detrás del medidor» con fuente «Información de Azimut Energía
  (2026-10)», cuando se valida, entonces se acepta.
- **CA-09.2** Dado un proyecto «Gran escala» con una fuente sin URL, cuando se valida, entonces se
  rechaza como hoy.
- **CA-09.3** Dado el CSV de proyectos, cuando se descarga, entonces tiene las mismas columnas de
  hoy y cada fila tiene su fuente.

**RF-10**
- **CA-10.1** Dados los casos de CA-02.x y CA-09.1/09.2, cuando se prueban en `validar_datos.py`,
  en la base (insert directo) y en `/admin`, entonces el resultado es el mismo en las tres.

**RF-11**
- **CA-11.1** Dada la carga inicial, cuando se abre `/admin`, entonces hay tres aportes «Proyecto
  nuevo» pendientes con el servicio «Maximización de autoconsumo PV y respaldo» y fuente
  «Información de Azimut Energía (2026-10)».
- **CA-11.2** Dado cada aporte, cuando se revisan sus coordenadas, entonces son las de la
  cabecera municipal (Medellín, Ipiales y Guarne) según la DIVIPOLA, y la fuente de esas
  coordenadas queda anotada en `BITACORA.md`.
- **CA-11.3** Dado un aporte pendiente, cuando se abre `/mapa`, entonces no aparece hasta que se
  aprueba.

**RF-12**
- **CA-12.1** Dado `/mapa` en cualquiera de los dos segmentos, cuando se mira la tabla, entonces
  no hay encabezado «Servicios», el segundo encabezado es «Promotor» y siguen las demás columnas;
  el CSV descargado sí trae
  `Tipo uso/conexión`.

## Requisitos no funcionales
| ID | Requisito |
|---|---|
| RNF-01 | `/mapa` se usa a 375 px sin desplazamiento horizontal en los dos segmentos. |
| RNF-02 | kW y kWh en formato es-CO (coma decimal), unidades entre corchetes en encabezados. kW y kWh no se suman ni comparten eje, y nunca se suman con MW/MWh de gran escala. |
| RNF-03 | axe sin violaciones serias ni críticas en `/mapa` en los dos segmentos; botones, puntos y tarjeta usables con teclado. |
| RNF-04 | Consola sin errores; `npm run build` en verde antes de publicar. |
| RNF-05 | Sin columnas nuevas: los mapas antiguos (`Mapa/`, `BESS/mapa/`), que leen por posición, siguen funcionando. |
| RNF-06 | Sin librerías nuevas. |

## Datos
Tabla `proyectos` (y `datos/proyectos.csv`, `datos/esquemas.json`): **sin columnas nuevas**. Los
proyectos detrás del medidor llenan las mismas columnas de la gran escala.

| Columna | Cambio |
|---|---|
| Tipo uso/conexión | Se agrega «Maximización de autoconsumo PV y respaldo» a la lista cerrada. En el esquema, la columna lista qué servicios son de «Detrás del medidor» (dato del esquema, no columna). |
| Fuente | Sigue obligatoria. Con un servicio de «Detrás del medidor» acepta texto sin URL; si no, URL como hoy. |
| Punto de conexión kV | Se deja vacío en estos proyectos (aclaración 2). |

Potencia y energía se guardan en MW y MWh, como hoy (15 kW = 0,015 MW). La configuración de
paneles, inversores y baterías del brainstorm no se carga (no hay columna para ella). La tabla
`aportes` admite la fuente textual en los aportes del segmento.

## Fuera de alcance
- Formulario público de `/aportar` con el segmento (se usa la cola por script).
- Cifras del segmento en el inicio.
- Configuración (paneles, inversores) y dirección de los proyectos.
- Confirmar con Azimut el estado y la FPO de Ipiales y Guarne. Se publican como vienen y queda
  pendiente en `BITACORA.md`.
- Un estado «En ingeniería»: Planta Guarne entra como «Anunciado».

## Aclaraciones
- Aclaración 1: ~~la barra de filtros y los KPI de arriba se quedan; la pestaña muestra sus propias
  cifras~~ → reemplazada (2026-10-27): los botones de segmento van debajo del título y cambian
  toda la página, incluidos KPI, filtros y gráficas.
- Aclaración 2: el nivel de tensión de los proyectos detrás del medidor no se muestra ni se
  carga → decisión del usuario (2026-10-27).
- Aclaración 3: no se crean columnas; el segmento se deduce del servicio → decisión del usuario
  (2026-10-27).

## Historial de cambios
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-10-27 | Versión inicial | Brainstorm 008 aprobado (enfoque A) |
| 2026-10-27 | Sin nivel de tensión en la tarjeta ni en la carga | Aclaración del usuario |
| 2026-10-27 | «Alto de las Palmas» es parte del nombre del proyecto; su ubicación es Medellín | Aclaración del usuario |
| 2026-10-27 | Aclaración 1 resuelta; spec aprobada | Respuesta del usuario |
| 2026-10-27 | Spec v2 aprobada. Sin columnas nuevas (segmento deducido del servicio, sin configuración ni ubicación aproximada por fila); botones de segmento debajo del título que cambian toda la página, con KPI, filtros y gráficas en kW/kWh | Cambios del usuario tras ver el plan |
| 2026-10-27 | RF-12: la tabla de `/mapa` oculta provisionalmente la columna «Servicios» en los dos segmentos | Pedido del usuario (la información de servicios se definirá mejor) |
| 2026-10-27 | RF-12: el encabezado «Operador» de la tabla pasa a «Promotor» | Pedido del usuario |
| 2026-10-27 | Promotor de los tres proyectos: solo «Azimut Energía» (sin EPM ni Cedenar) | Pedido del usuario |
