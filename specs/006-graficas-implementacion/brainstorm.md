# 006 · Gráficas de implementación en el país

Estado: Aprobado (enfoque A, 2026-10-21)
Fecha: 2026-10-21

## Idea
Agregar gráficas a `/mapa` (spec 002) que resuman el inventario filtrado:
- barras por estado, con pestañas de potencia, energía y duración;
- evolución por año de FPO;
- dona de tecnología.

El estilo de pestañas viene del inventario de almacenamiento del JRC (Comisión Europea).

## Problema y público
El mapa y la tabla muestran proyecto por proyecto. A empresas, ingenieros de planeación y
academia les falta ver de un vistazo cómo se reparte la capacidad por estado, cómo crece con
los años y con qué tecnología. Así es como presentan sus datos los observatorios de
referencia.

## Preguntas que responde al usuario final
- ¿Cuánta potencia [MW], cuánta energía [MWh] y qué duración [h] hay en cada estado
  (en operación, en construcción, anunciado, inactivo)?
- ¿Cómo crece la capacidad año a año, según el año de FPO, y cuánto viene en los próximos años?
- ¿Qué tecnologías se usan y con qué participación?
- Todo lo anterior para la vista filtrada: departamento, servicio, operador, etc.

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|
| Estado, potencia [MW], energía [MWh] | Sí | `proyectos` (Base de datos SAEB) |
| Duración [h] | Se calcula | Energía ÷ potencia (ya existe en 002) |
| Año de FPO | Sí (texto con el año) | `proyectos.fpo` |
| Tecnología | Sí (hoy 100 % Li-ion) | `proyectos.tecnologia` |

No hace falta ningún dato nuevo ni ningún cambio de esquema.

## Decisiones de la conversación (2026-10-21)
| Tema | Decisión |
|---|---|
| Referencia | «Real-time Energy Storage Dashboard» del JRC (captura del usuario). Las pestañas **Power (GW) \| Capacity (GWh)** van pegadas a la gráfica de barras por estado y cambian la medida sin cambiar de gráfica. Las barras van coloreadas por estado. Aquí se agrega una tercera pestaña, Duración [h] |
| Filtros | Las gráficas usan el mismo resultado filtrado que el mapa, la tabla y los KPI «según filtros» (RF-09 de la 002) |
| Gráficas | (1) Barras horizontales por estado con pestañas Potencia [MW], Energía [MWh] y Duración [h], con el valor al final de cada barra y el color de cada estado. (2) Evolución por año de FPO, **ordenada por año** (confirmado por el usuario). (3) Dona de tecnología |

## Alternativas
### A. Recharts dentro de la vista de `/mapa` (recomendada)
Recharts ya está en el stack aprobado. Las tres gráficas se pintan en el cliente a partir del
mismo arreglo filtrado. La agregación (por estado, por año, por tecnología) se hace con
funciones puras probadas con Vitest. Las pestañas son un `tablist` accesible. Cada gráfica
tiene su equivalente en tabla (RNF-03 de la 001) y su título dice la unidad.
- Ventajas: dentro del stack; la lógica se prueba sin navegador; colores de los tokens TEJ.
- Costos: Recharts pesa unos 100 kB. Se carga de forma diferida, como el mapa, para no
  afectar el LCP.

### B. Tremor
Tremor también está en el stack (construido sobre Recharts) y trae tarjetas y pestañas listas.
- Costos: impone su propio estilo y paleta, que habría que sobrescribir para usar los tokens
  TEJ. Además agrega más peso.

### C. ECharts
- Solo si una vista lo exige (regla de CLAUDE.md). Estas gráficas no lo necesitan.

## Enfoque elegido
Se propone la **A**: Recharts, agregaciones puras y una gráfica por tarjeta con pestañas.
- **MW y MWh nunca comparten eje.** Cada pestaña muestra una sola medida (regla del proyecto).
- **Duración por estado.** Se calcula como energía total ÷ potencia total de los proyectos
  que tienen ambos datos. Las duraciones no se suman.
- **Evolución.** Va ordenada por año, con el acumulado. Los años posteriores al actual se
  marcan como proyectados (trazo distinto y leyenda). El eje muestra años y no fechas con
  hora.
- **Dona.** Tiene pestañas MW, MWh y número de proyectos, y muestra el porcentaje.

## Dentro del MVP / después
- **MVP:** las tres gráficas con pestañas, un equivalente en tabla para cada una, formato
  es-CO, 375 px sin desplazamiento horizontal, movimiento reducido y colores de los tokens TEJ.
- **Después:**
  - barras por servicio y por departamento (quedaron fuera por decisión del usuario);
  - exportar una gráfica como imagen;
  - comparar con otros países.

## Preguntas abiertas
- **Evolución:** ¿se excluyen los proyectos `Inactivo` del acumulado, porque ya no aportan?
  ¿Y los `Anunciado`, que todavía no son firmes? Propuesta: el acumulado suma En operación y
  En construcción; Anunciado va aparte como «proyectado»; Inactivo no se suma.
- **Evolución:** ¿línea con área, como tu imagen, o barras por año con la línea del
  acumulado? Propuesta: área acumulada con pestañas MW / MWh.
- **Ubicación en la página:** ¿entre los KPI y los filtros, o después del mapa?
  Propuesta: una fila de tarjetas después de los KPI y antes del mapa.
- **Referencia:** resuelta con la captura del usuario del 2026-10-21. El tablero del JRC
  también trae barras «por país y estado» y «por tecnología y estado» apiladas por estado.
  Aquí equivaldrían a «por departamento» y «por tecnología», y quedan para después del MVP.
