# 008 · Almacenamiento detrás del medidor

Estado: Aprobado (enfoque A y propuestas de las preguntas abiertas, 2026-10-27)
Fecha: 2026-10-27

## Idea
Llenar la pestaña «Detrás del medidor» del mapa de `/mapa` (hoy dice «Sección en
construcción», spec 007). Mostrará los SAEB instalados en usuarios (hogares, comercio e
industria), con su punto en el mapa, su tarjeta y una tabla, separados de los proyectos a gran
escala.

## Problema y público
El inventario solo incluye proyectos conectados al sistema como activos de generación o de red.
Las baterías detrás del medidor crecen con la autogeneración solar, pero no aparecen en ninguna
fuente pública. A empresas (desarrolladores e instaladores), ingenieros de distribución
(operadores de red) y academia les interesa saber dónde están, de qué tamaño son y para qué se
usan.

## Preguntas que responde al usuario final
- ¿Qué proyectos con baterías detrás del medidor hay, dónde están y en qué estado?
- ¿Qué potencia [kW] y qué energía [kWh] tienen, y con qué tecnología?
- ¿Para qué se usan (autoconsumo solar, respaldo) y a qué nivel de tensión se conectan?

## Datos iniciales (entregados por el usuario el 2026-10-27)
Fuente: información de Azimut Energía (comunicación directa, sin enlace público).

| Proyecto | Operador / desarrollador | Estado (dato) | Estado en el sitio | FPO | Ubicación | Potencia / energía | Conexión | Tecnología |
|---|---|---|---|---|---|---|---|---|
| Casa Alto de las Palmas | EPM / Azimut Energía | Operación | En operación | abril de 2025 | Medellín, Antioquia | 15 kW / 40 kWh | Nivel 2, 13,2 kV (transformador propio 13.200/240 V) | LFP |
| Centro Comercial Ipiales | Cedenar / Azimut Energía | En construcción | En construcción | marzo de 2026 | Ipiales, Nariño | 107 kW / 241 kWh (acople AC) | Nivel 3, 34,5 kV (transformador propio 34.500/240 V) | LFP |
| Planta Guarne | EPM / Azimut Energía | En ingeniería | Anunciado | julio de 2026 | Guarne, Antioquia | 107 kW / 241 kWh (acople AC) | Nivel 2, 13,2 kV (transformador propio 13.200/240 V) | LFP |

**Uso:** los tres son «Maximización de autoconsumo PV y respaldo».

**Configuración (texto del dato):**
- **Casa Alto de las Palmas:** sistema híbrido de 19,62 kWp en paneles de 545 Wp, con un inversor híbrido Deye monofásico (fase partida) de 15 kW y 4 baterías Soluna de 10 kWh.
- **Centro Comercial Ipiales:** 240 kWp en paneles de 280 y 725 Wp, con inversores trifásicos de 20, 50 (3 unidades) y 36 kW y una batería de 241 kWh / 107 kW.
- **Planta Guarne:** 130 kWp en paneles de 725 Wp, con inversores trifásicos de 50 (2 unidades) y 36 kW y una batería de 241 kWh / 107 kW.

**Observaciones para confirmar con la fuente (no se corrigen sin confirmación):**
- **Ipiales:** está «En construcción», pero su FPO (marzo de 2026) ya pasó.
- **Guarne:** su FPO (julio de 2026) también ya pasó, y el proyecto sigue en ingeniería.
- **Batería de Guarne e Ipiales:** es la misma (241 kWh / 107 kW). Puede ser correcto.

## Decisiones tomadas (2026-10-27)
- **Fuente:** «Información de Azimut Energía (2026-10)». Se acepta una fuente sin URL para estos
  proyectos. Hoy la columna `Fuente` exige URL, así que el esquema debe admitir una fuente
  textual.
- **Ubicación:** el punto va en la cabecera del municipio, con las coordenadas oficiales de la
  DIVIPOLA del DANE, y se marca como «ubicación aproximada». No se publica la dirección de la
  vivienda. «Alto de las Palmas» es parte del nombre del proyecto; su ubicación es Medellín
  (aclaración del usuario, 2026-10-27).
- **«En ingeniería»:** se registra como «Anunciado». No se crea un estado nuevo.
- **Carga:** por la cola de aportes. El usuario aprueba en `/admin`, como con normas y noticias.

## Alternativas de modelo de datos

### A. Misma tabla `proyectos`, con una columna `Segmento` (recomendada)
Los valores de la columna son «Gran escala» y «Detrás del medidor».
- **Ventajas:**
  - Reutiliza el esquema, la importación, la cola de aportes, `/admin`, la tarjeta y la tabla.
  - Los filtros y el CSV funcionan igual.
- **Costos:**
  - Hay que filtrar por segmento en todo lo que hoy suma (KPI, gráficas, crecimiento del inicio,
    mini mapa), para que estos proyectos no se mezclen con la gran escala.
  - Se agregan dos columnas: `Configuración` (texto) y `Ubicación aproximada` (sí/no).
- **Riesgo:** que alguna vista olvide el filtro. Se mitiga con pruebas en cada vista.

### B. Tabla aparte `proyectos_medidor`
- **Ventajas:** aislamiento total; nada de lo publicado cambia.
- **Costos:**
  - Duplica el esquema, la importación, el validador, la cola de aportes, `/admin`, la tarjeta,
    la tabla y el CSV.
  - Es más trabajo y más superficie de errores.

### C. Solo una lista estática en la pestaña
Sin base de datos.
- **Ventajas:** es lo más rápido.
- **Costos:** rompe la regla de que todo pasa por la cola y la aprobación del editor, y no escala.

## Enfoque elegido (propuesta)
**A.** Detalles:
- **Datos:** la columna `Segmento` va en el esquema, el CSV, la base, la importación, `/admin` y el
  validador. Los proyectos actuales quedan como «Gran escala».
- **Pestaña «Detrás del medidor»:**
  - el mismo mapa de OpenStreetMap, con sus puntos y la leyenda de estados;
  - una nota «ubicación aproximada (cabecera municipal)»;
  - tarjetas de proyecto con potencia en **kW** y energía en **kWh** (no en MW, que daría 0,0);
  - una tabla propia;
  - cifras propias del segmento: número de proyectos, kW y kWh en operación.
- **Lo que no cambia:** los KPI, las gráficas, la gráfica de crecimiento del inicio y el mini
  mapa siguen mostrando solo la gran escala. MW y MWh nunca se suman con los de este segmento.
- **Uso:** se agrega «Maximización de autoconsumo PV y respaldo» a la lista cerrada de
  `Tipo uso/conexión`.

## Dentro del MVP / después
- **MVP:** columna `Segmento`, fuente textual, ubicación aproximada, carga de los 3 proyectos por
  aportes, pestaña con mapa, tarjeta, tabla y cifras propias, y CSV con el segmento.
- **Después:**
  - formulario de `/aportar` con el segmento;
  - filtros propios de la pestaña (operador de red, uso, nivel de tensión);
  - gráficas del segmento cuando haya más proyectos.

## Preguntas abiertas
- ¿Las cifras del segmento (kW y kWh en operación) van en la pestaña o también en el inicio?
  **Propuesta:** solo en la pestaña.
- ¿Se pide a Azimut confirmar el estado y la FPO de Ipiales y Guarne antes de publicar?
  **Propuesta:** se publican como están y se anotan como pendientes en `BITACORA.md`.
- ¿La configuración (paneles, inversores y baterías) se publica completa en la tarjeta?
  **Propuesta:** sí, en un texto desplegable «Configuración».
