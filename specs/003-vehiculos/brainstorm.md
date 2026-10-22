# 003 · Vehículos eléctricos

Estado: Aprobado (modelo B, 2026-10-22)
Fecha: 2026-10-22

## Idea
Reemplazar la página «en construcción» de `/vehiculos` por los indicadores del almacenamiento
en baterías de los vehículos eléctricos vendidos en Colombia. Los datos vienen de la hoja
`VEHICULOS_ELECTRICOS` y se guardan en Supabase, como los proyectos SAEB.

## Problema y público
Las baterías de los vehículos eléctricos son una capacidad de almacenamiento que crece rápido
y que hoy no se ve junto a los SAEB. Ingenieros de planeación (gestión de la demanda, V2G a
futuro), empresas y academia necesitan saber cuántos vehículos hay, cuánta energía guardan
sus baterías y de qué tamaño son.

## Preguntas que responde al usuario final
- ¿Cuántos vehículos eléctricos se han vendido en el periodo cubierto (2024 a la fecha de corte)?
- ¿Cuánta energía [MWh] pueden almacenar en conjunto sus baterías?
- ¿Con qué fecha de corte y de qué fuente salen las cifras?

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|
| Ventas por línea y año (2024, 2025, 2026) | Sí, 49 líneas | Hoja `VEHICULOS_ELECTRICOS` (id `1THqOYEPpG5Dr6NWFvDFZV0CR_evvM7sGOIAg2uLI-NA`), ventas por línea |
| Marca, línea, tipo de batería (LFP, Lithium-ion, NMC, ULTIUM) | Sí | La misma hoja |
| Capacidad mínima y máxima de batería [kWh], potencia [kW] | Sí | Fichas técnicas, en la misma hoja |
| Fuente | Se resuelve con créditos (decisión del 2026-10-22) | **ANDEMOS** (ventas por línea), **RUNT** (registros) y **cálculos propios del Observatorio** (energía y participaciones) |
| Fecha de corte | Sí (2026-09-17 en la última exportación) | Exportación de la hoja |

Controles conocidos del tablero anterior: 45.346 vehículos y 2.426.467 kWh
(≈ 2.426,5 MWh); la suma de años coincide con el total de cada línea, y los kWh son
el total × la capacidad promedio.

## Decisiones de la conversación (2026-10-22)
| Tema | Decisión |
|---|---|
| Nivel de detalle | Se puede publicar por marca y línea |
| Híbridos enchufables (7 líneas) | Se dejan sin distinguir, como en la hoja |
| «Byd song plus dm-i» y «Song plus dmi» | Se dejan como dos líneas, como en la hoja |
| Almacenamiento | Tabla en Supabase importada desde el CSV de la hoja con el validador, igual que los proyectos (spec 001), con respaldo diario |
| Contenido del MVP | El tablero de Looker que compartió el usuario (capturas del 2026-10-22), migrado al sitio: filtros, KPI, tabla de tecnología y cuatro gráficas (ver «Enfoque elegido») |
| Unidades | Totales de energía en MWh; capacidad por vehículo en kWh |
| Fuente | Créditos visibles en la página y en la descarga CSV: ANDEMOS, RUNT y cálculos propios del Observatorio |
| Actualización | Junto a la fuente se muestra la **fecha de la última actualización** de los datos, es decir, el día en que se subió la información al observatorio. Se guarda en cada importación, no se escribe a mano |
| KPI | Solo dos: vehículos y energía almacenada. No se agrega «capacidad promedio por vehículo» |
| Aportes | Los vehículos no entran al flujo de aportes; se actualizan reimportando la hoja |

## Alternativas (modelo de datos)
### A. Una fila por línea con una columna por año (como la hoja)
- Ventajas: la importación es casi directa.
- Costos: cada año nuevo (2027…) obliga a agregar una columna en el esquema, la base, el
  validador y la importación.

### B. Ficha por línea + ventas por línea y año (recomendada)
Dos tablas: `vehiculos_lineas` (marca, línea, tipo de batería, capacidades, potencia, fuente)
y `vehiculos_ventas` (línea, año, unidades). La importación convierte las columnas de años
de la hoja en filas.
- Ventajas: un año nuevo es solo filas nuevas. Los KPI y cualquier gráfica futura (por año)
  salen de una consulta simple.
- Costos: la importación hace la transformación y hay dos esquemas en `esquemas.json`.

### C. Archivo estático en el repositorio
- Descartada por decisión del usuario (los datos van en Supabase).

## Enfoque elegido
Se propone la **B**, con el contenido del tablero de Looker:
- **Filtros desplegables** de selección múltiple: Marca, Tipo de batería y Línea (el mismo
  componente de `/mapa`, T23). Todo lo de la página responde a ellos.
- **KPI:** «Vehículos eléctricos registrados · 2024–2026» y «Energía almacenada en
  circulación [MWh]».
- **Tabla de participación por tecnología de batería** (LFP, Lithium-ion, NMC Lithium-ion,
  ULTIUM), con su porcentaje.
- **Barras horizontales apiladas «Vehículos vendidos por marca y año de registro»:** las 9
  marcas con más ventas más «Otros», un segmento por año y 2026 rotulado «(parcial)» hasta
  la fecha de corte.
- **Dona «Participación de marcas en el mercado %»:** las mismas 9 marcas + «Otros».
- **Dona «Tecnología de batería»:** participación en vehículos.
- **Barras «Energía en circulación por tipo de batería» [MWh].**

Correcciones respecto al tablero de Looker:
- El KPI «45.346 mil» se lee como 45 millones; el dato es **45.346** vehículos.
- La energía va en MWh, como el resto del sitio (2.426,5 MWh), por decisión del usuario.
- Cada gráfica tiene su «Ver como tabla», como en la 006 (accesibilidad).

Cálculos:
- **KPI:** vehículos vendidos = suma de unidades; energía almacenada [MWh] = Σ (unidades ×
  capacidad promedio de la línea) ÷ 1.000.
- **Capacidad promedio de una línea:** el promedio de la mínima y la máxima, como en la hoja.
- **Contexto:** junto a los créditos, la página muestra cuándo se actualizaron los datos, por
  ejemplo (ficticio): «Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última
  actualización: 22/10/2026 · Ventas hasta el 17/09/2026».
  - **Última actualización** = el día en que se importó la hoja al observatorio. La registra
    la importación.
  - **Ventas hasta** = la fecha de corte de los datos de origen, para que «2026 (parcial)» se
    entienda.

  La descarga CSV lleva la misma línea de créditos y fechas, y la licencia.
- **Formato y animación:** se reutilizan las tarjetas de KPI (es-CO, conteo animado,
  movimiento reducido).

## Dentro del MVP / después
- **MVP:**
  - el tablero descrito arriba (filtros, KPI, tabla de tecnología y cuatro gráficas), con la
    fecha de corte y la fuente;
  - la tabla en Supabase, solo con datos aprobados y respaldo diario;
  - la importación validada;
  - la descarga CSV de la sección.
- **Después:**
  - tabla completa por línea;
  - distinguir los híbridos enchufables y unificar líneas duplicadas;
  - pasar a datos del RUNT.

## Preguntas abiertas
Resueltas por el usuario el 2026-10-22:
1. Contenido: el tablero de Looker (capturas).
2. Fuente: créditos a ANDEMOS, RUNT y cálculos propios del Observatorio.
3. No hay tercer KPI (capacidad promedio por vehículo).
4. Los vehículos no entran al flujo de aportes.
5. Junto a la fuente va la fecha de la última actualización de la información subida.

Sigue anotado en la bitácora de `Vehiculos/` que hay que revisar si la licencia de ANDEMOS
permite publicar el detalle por línea. El usuario decidió publicarlo y dar los créditos.
