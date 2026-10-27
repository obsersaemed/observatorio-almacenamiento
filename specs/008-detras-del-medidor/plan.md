# 008 · Almacenamiento detrás del medidor — Plan

Estado: Publicado (2026-10-27); E2E final y E2E limpio pendientes por decisión del usuario
Fecha: 2026-10-27
Spec: [spec.md](spec.md)

## Enfoque técnico
**Datos, sin columnas nuevas.** En `datos/esquemas.json`, la columna `Tipo uso/conexión` gana el
valor «Maximización de autoconsumo PV y respaldo» y una propiedad `"segmentos": {"Detrás del
medidor": ["Maximización de autoconsumo PV y respaldo"]}`. El segmento de un proyecto se deduce
de sus servicios. Dos reglas nuevas, escritas en las capas de siempre (validador Python,
disparador SQL regenerado en la migración 0007, zod de `/admin`):
- un proyecto no mezcla servicios de los dos segmentos;
- la fuente acepta texto sin URL solo si el proyecto es «Detrás del medidor».

La 0007 no agrega columnas: solo regenera el disparador de validación (lista de servicios y
regla de fuente) y ajusta el check de `fuente` en `proyectos` y `aportes`.

**Web.**
- `lib/proyectos-mapa.ts` gana `segmentoDe(proyecto)` y `soloSegmento(filas, segmento)`, leídos
  del esquema.
- `lib/formato.ts` gana `formatoPotencia(mw, unidades)` y `formatoEnergia(mwh, unidades)`, que
  multiplican por 1000 en kW/kWh.
- `/mapa`: un componente `BotonesSegmento` va debajo del `<h1>`. `VistaMapa` lee
  `?segmento=detras-del-medidor` de la URL, filtra las filas **antes** de todo (KPI, opciones de
  filtros, gráficas, mapa, tabla, descarga) y pasa `unidades` a `KpiMapa`, las gráficas,
  `TarjetaProyecto` y `TablaProyectos`. Cambiar de segmento limpia los filtros.
- Las pestañas «Gran escala» / «Detrás del medidor» que hoy están dentro de `PanelMapa` se quitan
  (las reemplazan los botones). El aviso «Sección en construcción» pasa a `VistaMapa`, cuando el
  segmento elegido no tiene proyectos.
- El inicio filtra a «Gran escala».

**Carga.** `scripts/proponer_aporte.py` con 3 JSON que llenan las columnas de gran escala;
coordenadas de la DIVIPOLA del DANE; `Punto de conexión kV` vacío.

Sin librerías nuevas.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `datos/esquemas.json` | Modificar | Servicio nuevo, `segmentos` en `Tipo uso/conexión`, regla de fuente |
| `scripts/validar_datos.py` | Modificar | Segmento por servicio, sin mezcla, fuente según segmento |
| `scripts/generar_validacion_sql.py`, `supabase/migrations/0007_segmento.sql` | Modificar / Crear | Disparador regenerado y checks de fuente |
| `web/src/lib/esquemas.ts` | Modificar | Las dos reglas en zod (`/admin`) |
| `web/src/lib/proyectos-mapa.ts`, `web/src/lib/formato.ts` | Modificar | `segmentoDe`, `soloSegmento`, formato kW/kWh |
| `web/src/components/mapa/botones-segmento.tsx` | Crear | Botones debajo del título |
| `web/src/app/mapa/page.tsx`, `components/mapa/vista-mapa.tsx` | Modificar | Segmento en la URL; todo filtrado por segmento; aviso vacío; nota de ubicación |
| `components/mapa/kpi-mapa.tsx`, `components/graficas/*` | Modificar | Prop `unidades` |
| `components/mapa/tarjeta-proyecto.tsx`, `tabla-proyectos.tsx` | Modificar | Prop `unidades` |
| `components/mapa/panel-mapa.tsx` | Modificar | Quitar las pestañas internas |
| `web/src/app/page.tsx` | Modificar | Inicio solo con gran escala |
| `specs/008-detras-del-medidor/propuestas/*.json` | Crear | Los 3 aportes iniciales |
| `web/e2e/008-medidor.spec.ts` | Crear | Escenarios E2E |

## Cambios de datos
- `datos/proyectos.csv`: **no cambia** (ni columnas ni filas).
- Migración 0007: sin columnas nuevas; servicio nuevo en el disparador; fuente textual permitida
  solo para servicios de «Detrás del medidor» (en `proyectos` y en `aportes`).
- **La 0007 la aplica el usuario**, primero en «pruebas» y luego en el principal, antes de la
  carga (T09) y de publicar.

## Tareas
- [x] **T01 · S** · Esquema y validador Python
  - Cubre: RF-01, RF-02, RF-09, RF-10, RNF-05 · CA-02.1, CA-02.2, CA-09.1, CA-09.2, CA-10.1
  - Prueba primero (RED): `pruebas/test_validar_datos.py`:
    - el servicio nuevo existe y está marcado como «Detrás del medidor»;
    - un proyecto con el servicio nuevo y fuente textual pasa;
    - uno de gran escala con fuente textual falla;
    - uno que mezcla servicios de los dos segmentos falla nombrando `Tipo uso/conexión`;
    - `datos/proyectos.csv` sigue validando sin cambios.
    - Falla hoy porque el valor y las reglas no existen.
  - Hecho cuando (GREEN): pasa y `validar_datos.py` da 0 errores.
  - Depende de: —
  - Archivos: `datos/esquemas.json`, `scripts/validar_datos.py`
- [x] **T02 · M** · Migración 0007 y validación SQL
  - Cubre: RF-02, RF-09, RF-10 · CA-02.x, CA-09.x, CA-10.1
  - Prueba primero (RED): `pruebas/test_validacion_sql.py` y `test_sql_esquemas.py`:
    - la 0007 no agrega columnas;
    - el disparador acepta el servicio nuevo, rechaza la mezcla y acepta la fuente textual solo
      con un servicio de «Detrás del medidor»;
    - `MIGRACION` apunta a la 0007.
    - Falla hoy porque la 0007 no existe.
  - Hecho cuando (GREEN): pasa. La prueba contra la base de pruebas espera a que el usuario aplique
    la 0007.
  - Depende de: T01
  - Archivos: `supabase/migrations/0007_segmento.sql`, `scripts/generar_validacion_sql.py`
- [x] **T03 · S** · Zod y `/admin`
  - Cubre: RF-09, RF-10 · CA-09.1, CA-09.2, CA-02.2, CA-10.1
  - Prueba primero (RED): `web/src/lib/esquemas.test.ts`: las mismas cuatro reglas de T01.
    Falla hoy porque zod exige URL siempre y no revisa la mezcla.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T01
  - Archivos: `web/src/lib/esquemas.ts`
- [x] **T04 · S** · Modelo web y formato kW/kWh
  - Cubre: RF-01, RF-05, RNF-02 · base de CA-01.x y CA-05.x
  - Prueba primero (RED): `proyectos-mapa.test.ts` y `formato.test.ts`:
    - `segmentoDe` devuelve «Detrás del medidor» con el servicio nuevo y «Gran escala» con los
      demás;
    - `soloSegmento` filtra;
    - `formatoPotencia(0.015, "kW")` = «15,0 kW», `formatoEnergia(0.04, "kW")` = «40,0 kWh», y con
      «MW» queda como hoy.
    - Falla hoy porque nada de eso existe.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T01
  - Archivos: `web/src/lib/proyectos-mapa.ts`, `web/src/lib/formato.ts`
- [x] **T05 · S** · KPI, gráficas, tarjeta y tabla con unidades
  - Cubre: RF-05, RNF-02 · CA-05.1, CA-05.2, CA-05.3
  - Prueba primero (RED): `kpi-mapa.test.tsx`, pruebas de las gráficas, `tarjeta-proyecto.test.tsx`
    y `tabla-proyectos.test.tsx`:
    - con `unidades="kW"`: KPI «15,0 kW» y «40,0 kWh»; ejes y leyendas de las gráficas en kW y
      kWh; tarjeta «107,0 kW» y «241,0 kWh» sin enlaces de fuente ni nivel de tensión; tabla con
      «Potencia [kW]» y «Energía [kWh]»;
    - con `unidades="MW"`, todo como hoy.
    - Falla hoy porque las unidades son fijas.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T04
  - Archivos: `kpi-mapa.tsx`, `components/graficas/*`, `tarjeta-proyecto.tsx`, `tabla-proyectos.tsx`
- [x] **T06 · M** · Botones de segmento y página filtrada
  - Cubre: RF-03, RF-04, RF-06, RF-08, RNF-01, RNF-03 · CA-01.1, CA-01.2, CA-03.1, CA-03.2,
    CA-04.1, CA-04.2, CA-04.3, CA-06.1, CA-08.1
  - Prueba primero (RED): `botones-segmento.test.tsx`, `vista-mapa.test.tsx` y
    `panel-mapa.test.tsx`:
    - los botones están debajo del título, antes de los KPI, y marcan el segmento con
      `aria-pressed`;
    - con 7 proyectos de gran escala y 3 ficticios del segmento: en «Gran escala» los KPI, el
      conteo, las gráficas, los marcadores y la tabla cuentan 7; en «Detrás del medidor», 3, en
      kW/kWh y con la nota de ubicación aproximada;
    - las opciones de los filtros salen del segmento; cambiar de segmento limpia los filtros y
      escribe `?segmento=` en la URL;
    - un clic en un marcador del segmento abre su tarjeta;
    - con 0 proyectos del segmento se lee «Sección en construcción» y no hay mapa ni KPI;
    - `PanelMapa` ya no tiene pestañas internas.
    - Falla hoy porque no hay botones y todo usa todas las filas.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T05
  - Archivos: `botones-segmento.tsx`, `app/mapa/page.tsx`, `vista-mapa.tsx`, `panel-mapa.tsx`
- [x] **T07 · XS** · Inicio solo con gran escala
  - Cubre: RF-07 · CA-07.1
  - Prueba primero (RED): `secciones.test.tsx` o la prueba del inicio: con un proyecto ficticio
    del segmento, la gráfica de crecimiento, las cifras y el mini mapa no lo cuentan. Falla hoy
    porque se cuentan todos.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T04
  - Archivos: `web/src/app/page.tsx`
- [x] **T08 · XS** · Importación y respaldo
  - Cubre: RF-09, RNF-05 · CA-09.3
  - Prueba primero (RED): `pruebas/test_importar.py`: una fila con el servicio nuevo y fuente
    textual se importa; el encabezado no cambia. Falla hoy si la importación exige URL en la
    fuente; si ya pasa, la tarea solo lo confirma.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T01
  - Archivos: `scripts/importar.py`
- [ ] **T09 · S** · Carga inicial por la cola de aportes
  - Cubre: RF-11 · CA-06.2, CA-11.1, CA-11.2, CA-11.3
  - Prueba primero (RED): `pruebas/test_propuestas_medidor.py`:
    - hay 3 JSON en `specs/008-detras-del-medidor/propuestas/`, que validan con el esquema;
    - tienen el servicio nuevo y la fuente de Azimut, cifras en MW/MWh que coinciden con el
      brainstorm (15 kW = 0,015 MW, etc.), Guarne como «Anunciado», `Punto de conexión kV` vacío
      y coordenadas dentro de Colombia.
    - Falla hoy porque no existen.
  - Hecho cuando (GREEN): pasa; las coordenadas salen de la DIVIPOLA del DANE con su fuente en
    `BITACORA.md`; tras la 0007 en pruebas, se envían con `proponer_aporte.py` y quedan 3 aportes
    `Pendiente`.
  - Depende de: T01, T02 (aplicada por el usuario)
  - Archivos: `specs/008-detras-del-medidor/propuestas/*.json`
- [ ] **T10 · M** · E2E de la 008, E2E previos y build
  - Cubre: RNF-01, RNF-03, RNF-04 y los CA en navegador
  - Prueba primero (RED): `web/e2e/008-medidor.spec.ts` con los escenarios de abajo. Siembra y
    limpia sus propios proyectos ficticios (prefijo E2E) en la base de pruebas.
  - Hecho cuando (GREEN): 008 en verde; 002, 006 y 007 en verde, en serie (los que miraban las
    pestañas internas del mapa se ajustan a los botones nuevos); `npm run build` en verde, sin
    `npm run dev` encendido.
  - Depende de: T01–T09
  - Archivos: `web/e2e/008-medidor.spec.ts`, E2E previos que tocaban las pestañas

- [x] **T11 · XS** · Tabla sin «Servicios» y con «Promotor» (cambio del usuario)
  - Cubre: RF-12 · CA-12.1
  - Prueba primero (RED): `tabla-proyectos.test.tsx`: los encabezados son Nombre, Promotor,
    Estado, Departamento, Municipio, Potencia, Energía y Año de FPO. Falla hoy porque la tabla
    trae «Operador» y «Servicios».
  - Hecho cuando (GREEN): pasa; E2E 007 E2E-28 y 008 E2E-07 ajustados.
  - Depende de: T05
  - Archivos: `web/src/components/mapa/tabla-proyectos.tsx`

Estimación total: 11 tareas (3 XS, 5 S, 3 M), unas 8 h.

## Escenarios E2E
Base de pruebas con la 0007 aplicada. «Sembrados» = proyectos E2E del segmento creados por la
prueba; «los 3 iniciales» = aportes aprobados por el editor.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1, CA-05.3 | Abrir `/mapa` | «Gran escala» resaltado; mismos proyectos y cifras de hoy, en MW/MWh |
| E2E-02 | CA-01.2, CA-04.1 | Con sembrados, elegir «Detrás del medidor» | KPI, conteo, gráficas, puntos y tabla solo del segmento; filtros con sus opciones |
| E2E-03 | CA-03.1 | Mirar la parte de arriba de `/mapa` | Botones debajo del título, antes de los KPI |
| E2E-04 | CA-03.2 | Copiar la URL con «Detrás del medidor» y abrirla de nuevo; usar los botones con Tab y Enter | Abre en ese segmento; botones usables con teclado |
| E2E-05 | CA-04.2 | Filtrar por un departamento en «Gran escala» y cambiar de segmento | No queda filtro activo |
| E2E-06 | CA-04.3 | Clic en un punto; luego Tab y Enter en otro | Se abre su tarjeta |
| E2E-07 | CA-05.1 | Con los 3 iniciales aprobados, elegir el segmento | «15,0 kW» y «40,0 kWh» en tarjetas separadas; tabla con [kW] y [kWh] |
| E2E-08 | CA-05.2 | Abrir la tarjeta de «Centro Comercial Ipiales» | 107,0 kW; 241,0 kWh; En construcción; Cedenar / Azimut Energía; LFP; uso; 2026; Ipiales, Nariño; sin enlaces de fuente |
| E2E-09 | CA-06.1, CA-06.2 | Mirar la nota y la tarjeta de «Casa Alto de las Palmas» | Nota de ubicación aproximada; nombre completo; «Medellín, Antioquia»; sin dirección |
| E2E-10 | CA-07.1 | Con sembrados, abrir `/` | Gráfica de crecimiento, cifras y mini mapa sin cambios |
| E2E-11 | CA-08.1 | Sin proyectos del segmento, elegirlo | «Sección en construcción», sin mapa ni KPI |
| E2E-12 | CA-09.3 | Descargar el CSV | Mismas columnas de hoy; todas las filas con fuente |
| E2E-13 | CA-02.1, CA-02.2, CA-10.1 | En `/admin`, aprobar un aporte sembrado con el servicio nuevo; repetir con un servicio inventado y con servicios mezclados | El primero se acepta; los otros se rechazan |
| E2E-14 | CA-09.1, CA-09.2 | En `/admin`, aprobar un aporte del segmento con fuente textual; repetir con uno de gran escala | El primero se acepta; el segundo se rechaza |
| E2E-15 | CA-11.1 | Abrir `/admin` tras la carga | 3 aportes «Proyecto nuevo» pendientes con el servicio nuevo y la fuente de Azimut |
| E2E-16 | CA-11.3 | Con los aportes pendientes, elegir el segmento | No aparecen |
| E2E-17 | RNF-01 | `/mapa` a 375 px en los dos segmentos | Sin desplazamiento horizontal |
| E2E-18 | RNF-03 | axe en los dos segmentos y recorrido con Tab | Sin violaciones serias o críticas |
| E2E-19 | RNF-04 | Abrir `/mapa` y `/` | Consola sin errores |

CA-10.1 en Python y SQL y CA-11.2 (fuente de las coordenadas) se comprueban con las pruebas de
T01, T02 y T09, y con la revisión de `BITACORA.md`.

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1, CA-01.2 | T01, T04, T06 | E2E-01, E2E-02 |
| RF-02 | CA-02.1, CA-02.2 | T01, T02, T03 | E2E-13 |
| RF-03 | CA-03.1, CA-03.2 | T06 | E2E-03, E2E-04 |
| RF-04 | CA-04.1–04.3 | T06 | E2E-02, E2E-05, E2E-06 |
| RF-05 | CA-05.1–05.3 | T04, T05 | E2E-01, E2E-07, E2E-08 |
| RF-06 | CA-06.1, CA-06.2 | T06, T09 | E2E-09 |
| RF-07 | CA-07.1 | T07 | E2E-10 |
| RF-08 | CA-08.1 | T06 | E2E-11 |
| RF-09 | CA-09.1–09.3 | T01, T02, T03, T08 | E2E-12, E2E-14 |
| RF-10 | CA-10.1 | T01, T02, T03 | E2E-13, E2E-14 |
| RF-11 | CA-11.1–11.3 | T09 | E2E-15, E2E-16 |
| RNF-01 | — | T06, T10 | E2E-17 |
| RNF-02 | — | T04, T05 | E2E-07, E2E-08 |
| RNF-03 | — | T06, T10 | E2E-18 |
| RNF-04 | — | T10 | E2E-19 y build |
| RNF-05 | — | T01 | Revisión de `Mapa/index.html` |
| RNF-06 | — | Todas | Revisión de `package.json` |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Un proyecto futuro detrás del medidor con otro servicio (p. ej. reducción de pico) quedaría como gran escala | El servicio nuevo se agrega a la lista `segmentos` del esquema; es un cambio de una línea más su prueba |
| Alguna vista mezcla los segmentos | `VistaMapa` filtra antes de todo; T06 y T07 prueban cada vista; E2E-02 y E2E-10 |
| Las tres capas de validación difieren | Mismos casos en Python, SQL y zod (CA-10.1) |
| La 0007 no se aplica antes de la carga o de publicar | El plan lo pide al usuario antes de T09 y de publicar |
| Los E2E de 002 y 007 dependían de las pestañas internas del mapa | T10 los ajusta y los vuelve a correr |
| Las coordenadas DIVIPOLA no están disponibles en línea | T09 se detiene y lo reporta; no se inventan |
| Fallas solo en producción (como en la 007) | T10 corre `npm run build` antes de publicar |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-27 | T01 | `test_validar_datos.TestSegmentos`: 3 de 6 fallan (servicio nuevo ausente del esquema; fila del segmento rechazada por servicio fuera de la lista; mezcla sin mensaje de segmento). Las de gran escala con fuente textual y el CSV real ya pasaban (comportamiento de hoy). | 26/26 en `test_validar_datos`; `validar_datos.py` 0 errores, 0 avisos | `segmentos_de()` y `segmento_de_fila()` en `validar_datos.py`. Desviación: además de `segmentos`, el esquema lleva `segmento_por_defecto: "Gran escala"` en `Tipo uso/conexión`, `texto_si_segmento: "Detrás del medidor"` en `Fuente` (proyectos) y `fuente` (aportes) y la plantilla `_mensajes.segmentos` («'{columna}' mezcla servicios de dos segmentos ({segmentos}): un proyecto es de un solo segmento»). |
| 2026-10-27 | T02 | `test_validacion_sql`: 5 fallas y 1 error (falta la 0007; `MIGRACION` apunta a la 0006; sin mensaje de mezcla; la regla de URL de `fuente` no mira el segmento). Integración `web/tests/integracion/segmento.test.ts` con `MIGRACION_0007_APLICADA=1` contra «pruebas» (sin la 0007): 3 de 5 fallan (fuente textual rechazada en proyectos y aportes; mezcla con el mensaje de lista). | 17/17 en `test_validacion_sql`; suite Python 99/99 | Generador: `segmento_sql`, `orden_sql`, `servicios_de`, `columna_de_segmentos`; en aportes el segmento sale de `datos ->> 'tipo_uso_conexion'`. La 0007 reemplaza `proyectos_fuente_check` y `aportes_fuente_check` (URL) por «no vacía»; la regla según segmento queda en el disparador. La prueba de integración queda **en espera** (se salta sin `MIGRACION_0007_APLICADA=1`) hasta que el usuario aplique la 0007 en «pruebas». |
| 2026-10-27 | T03 | `esquemas.test.ts` (008): 2 de 4 fallan (fuente textual del segmento rechazada con el mensaje de URL; la mezcla no da error). | 16/16 en `esquemas.test.ts`; suite web unitaria 402/402 (un archivo, `vista-vehiculos.test.tsx`, falló al cargar en la corrida completa por memoria/tiempo y pasa solo, 9/9) | `segmentosDe()` exportado; la regla de URL según segmento va en `superRefine` (como `min_de`), así que se reporta después de los errores de campo. Desviación: `decision.test.ts` esperaba 3 servicios; ahora 4 (servicio nuevo de la spec). |
| 2026-10-27 | T08 | `test_importar` (008): no falló; la importación usa `validar_tabla`, que ya tiene las reglas de T01. La tarea solo lo confirma, como prevé el plan. | 6/6 en `test_importar` | Sin cambios en `scripts/importar.py`. |
| 2026-10-27 | T04 | `proyectos-mapa.test.ts` y `formato.test.ts` (008): 4 fallan (`segmentoDe`, `soloSegmento`, `formatoPotencia` y `formatoEnergia` no existen). | 24/24 en los dos archivos; suite web 443 pasan (las 3 fallas de esa corrida eran pruebas de T05 ya escritas, en RED) | `segmentoDe` usa `segmentosDe()` de `esquemas.ts` con la columna `Tipo uso/conexión` del esquema; acepta un `ProyectoMapa` o una fila SQL. Además: `SEGMENTOS`, `SEGMENTO_POR_DEFECTO`; en `formato.ts`, tipo `Unidades`, `factorDe` y `unidadEnergia`. |
| 2026-10-27 | T05 | `kpi-mapa`, `tarjeta-proyecto`, `tabla-proyectos`, `grafica-estados`, `grafica-evolucion` y `grafica-tecnologia` (008): 6 fallan, uno por archivo (las unidades son fijas en MW/MWh). | 58/58 en los archivos afectados (con `kpi-valor`); `tsc --noEmit` limpio; suite web 450 pasan (las 3 fallas de esa corrida eran pruebas de T06 ya escritas, en RED) | Prop opcional `unidades` (por defecto «MW», así todo queda como hoy) en `KpiMapa`, `KpiValor`, `Graficas` y sus tres gráficas, `TarjetaProyecto` y `TablaProyectos`. Los datos siguen en MW/MWh y se multiplican por 1000 al mostrar; la duración no cambia. Con «kW» la tarjeta no muestra el nivel de tensión. |
| 2026-10-27 | T06 | `botones-segmento.test.tsx` (nuevo) y `vista-mapa.test.tsx`: no cargan (falta `botones-segmento`); `panel-mapa.test.tsx`: 2 fallan (tiene pestañas; no pasa `unidades`); `mapa-proyectos.test.tsx`: 1 falla (tarjeta en MW); `secciones.test.tsx`: 1 falla (sin botones bajo el título). | 62/62 en los archivos afectados; `a11y.test.tsx` 16/16; suite web completa **472/472 (64 archivos)**, incluida `vista-vehiculos` | `BotonesSegmento` va en `app/mapa/page.tsx` entre el `<h1>` y el `<Suspense>` (se ve mientras cargan los datos). El segmento se lee con `useSegmentoUrl()` (mismo almacén de `useFiltrosUrl`, sobre `window.location`; sin `useSearchParams`, así que no necesita `<Suspense>`); elegir otro segmento escribe solo `?segmento=` y así limpia los filtros. `useFiltrosUrl` gana `conservar` para que filtrar y «Limpiar filtros» mantengan `?segmento=`; «Limpiar filtros» se habilita según haya filtros (antes, según hubiera consulta). `VistaMapa` filtra con `soloSegmento` antes de todo y pasa `unidades`; la selección del mapa es por segmento. «Sección en construcción» pasa de `PanelMapa` a `VistaMapa` (mismo texto, sin filtros ni descarga). `PanelMapa` sin pestañas; `MapaProyectos` pasa `unidades` a la tarjeta. Desviaciones: se reemplazaron las pruebas 007 · T15 de `panel-mapa.test.tsx` y de `vista-mapa.test.tsx` (pestañas internas, retiradas por la spec 008), y en `secciones.test.tsx` la prueba 007 «el h1 va primero, luego el contenido» admite en `/mapa` el grupo de botones entre el título y el contenido. El mapa simulado de `vista-mapa.test.tsx` deja elegir un punto con un clic. Se agregó axe de «Detrás del medidor» (con y sin proyectos) en `a11y.test.tsx`, ya en verde (regresión de RNF-03). |
| 2026-10-27 | T07 | `app/inicio-segmento.test.tsx` (nuevo; resuelve los componentes async de la página): 3 de 3 fallan (crecimiento 10,015 MW en vez de 10; el mini mapa y las cifras cuentan el proyecto del segmento). | 3/3; `secciones.test.tsx` 13/13; suite completa 472/472 | `proyectos()` de `app/page.tsx` filtra con `soloSegmento(…, SEGMENTO_POR_DEFECTO)`. |
| 2026-10-27 | T09 (parcial) | `test_propuestas_medidor.py` (nuevo): 2 de 3 fallan (no existen los JSON); `test_proponer_aporte.py`: la fuente textual del segmento se rechaza («no es un enlace http(s)»). | Suite Python 103/103 | `proponer_aporte.py` deduce el segmento de `datos.tipo_uso_conexion` y acepta la fuente textual (desviación: no estaba en la lista de archivos de T09, pero bloqueaba la carga). FPO solo con el año, como el resto de proyectos. Coordenadas: DANE, DIVIPOLA centros poblados tipo CM (datos.gov.co `xaxy-8nri`, consultado el 2026-10-27). **Falta:** enviar los 3 aportes tras aplicar la 0007 en «pruebas». |
| 2026-10-27 | T10 (parcial) | `web/e2e/008-medidor.spec.ts` (nuevo, con `e2e/008.config.ts`: trazas apagadas, workers=1, timeout 120 s). Un sondeo (insert `Pendiente` del segmento que se borra) confirma que **la 0007 no está aplicada en «pruebas»**: el disparador responde «'Tipo uso/conexión' = 'Maximización de autoconsumo PV y respaldo' no está entre los valores permitidos». | 008 (escritorio): **9 escenarios en verde** (E2E-03, 04, 11, 12a, 13b, 14b, 17a, 18a, 19) más preparación y limpieza; **10 bloqueados por la 0007** (E2E-01, 02, 05, 06, 10, 12b, 13a, 14a, 17b, 18b: se saltan con «BLOQUEADO (0007)»); **5 omitidos** por falta de los 3 iniciales (E2E-07, 08, 09 sin proyectos aprobados; E2E-15, 16 sin aportes pendientes). 002: 24 pasan, E2E-20 bloqueado por la 0007 (el resto se salta por proyecto, como siempre). 006: 16/16. 007: 43/43 (E2E-24, 25 y 27 fallaron por tiempo en la corrida completa —el mapa con SwiftShader y poca RAM pasó de 30 s— y pasan con `--timeout=120000`). `npm run build` en verde sin servidor dev. | E2E-12, 13, 14, 17 y 18 se dividieron en «a» (no depende de la 0007) y «b» (con sembrados o aprobación del segmento). E2E previos ajustados: 007 E2E-05 (en `/mapa` el segundo hijo de `main` son los botones), E2E-22 (orden con la región «Mapa»), E2E-23 (botones con `aria-pressed`, Tab y Enter) y E2E-27 (botón de segmento; se salta si ya hay proyectos del segmento); 002 E2E-20 (4 casillas de servicios; la comparación entre vías queda «BLOQUEADO (0007)»). **Falta:** aplicar la 0007 en «pruebas», volver a correr la 008 (los 10 bloqueados), enviar y aprobar los 3 iniciales (T09) para E2E-07–09, 15 y 16, y volver a correr 002 E2E-20. |
| 2026-10-27 | T11 | `tabla-proyectos.test.tsx`: 1 de 8 falla (9 encabezados con «Operador» y «Servicios» en vez de 8). | 8/8; componentes 267/267; app y lib 195/195 | Solo la tabla: la tarjeta y los filtros siguen diciendo «Operador» y el filtro de servicios se queda. E2E 008 interrumpido por pedido del usuario (la sesión iba lenta); los E2E se corren al final con su aprobación. |
| 2026-10-27 | Promotor (dato) | `test_propuestas_medidor.py`: 1 de 3 falla (operador «EPM / Azimut Energía» y «Cedenar / Azimut Energía»). | 3/3 | Pedido del usuario: promotor solo «Azimut Energía». Cambian los JSON de `propuestas/` y la spec (CA-05.2); en «pruebas», correcciones 348–350 aprobadas por el editor (`correcciones/*.json`). Los aportes 340–342 quedaron «Rechazado»; se reenviaron como 345–347 y el editor los aprobó. |
| 2026-10-27 | Arreglo CA-03.2 | En el navegador, `/mapa?segmento=detras-del-medidor` abierto directo mostraba «Gran escala» con el botón del segmento marcado. `use-filtros-url.test.tsx` (hidratación con Suspense) no lo reproduce en jsdom: queda como prueba de regresión, no como RED. | Lib, mapa, vehículos y app 291/291; en el navegador el enlace abre el segmento con 15,0 kW, 40,0 kWh y los 3 proyectos | `useFiltrosUrl` y `useSegmentoUrl` leen la URL con `useState` + `useEffect` (después de montar) en lugar de `useSyncExternalStore`. Desviación de TDD anotada: el defecto solo se vio en el navegador. |

## Informe E2E
Pendiente (`e2e-informe.md`).
