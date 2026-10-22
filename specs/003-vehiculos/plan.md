# 003 · Vehículos eléctricos — Plan

Estado: Terminado (2026-10-22)
Fecha: 2026-10-22
Spec: [spec.md](spec.md)

## Enfoque técnico
**Datos (modelo B).** El CSV exportado de la hoja (`;`, coma decimal, una columna por año) se
convierte con `scripts/convertir_vehiculos.py` en dos archivos de `datos/`:
- `vehiculos_lineas.csv`: Marca, Línea, Tipo de batería, capacidades, potencia;
- `vehiculos_ventas.csv`: Línea, Año, Unidades.

La conversión rechaza el archivo si el total o los kWh de la hoja no cuadran con lo calculado
(aclaración 3). Los dos archivos se describen en `datos/esquemas.json`, así que los valida el
mismo `validar_datos.py` (y su hook) que ya valida proyectos. Se agregan al validador:
- el tipo `entero`;
- la regla `min_de` (Capacidad máxima ≥ Capacidad mínima);
- la referencia venta → línea.

Las mismas reglas llegan a zod (`esquemas.ts`) y al disparador SQL generado
(`generar_validacion_sql.py`), con los mismos mensajes (RF-14).

**Base.** La migración `0005_vehiculos.sql` crea las tablas `vehiculos_lineas`,
`vehiculos_ventas` y `vehiculos_importaciones` (fecha de actualización `now()` y fecha de
corte). Les pone RLS de solo lectura pública y los disparadores de validación generados. Además
crea la función `reemplazar_vehiculos(lineas, ventas, corte)`, de uso exclusivo de la llave de
servicio, que en una transacción borra, inserta y registra la importación: todo o nada
(CA-14.1). `scripts/importar_vehiculos.py` (como `importar.py`) valida, la llama y tiene
`--simular`. El respaldo diario suma las tres tablas (RF-15).

**Web.** La página `/vehiculos` lee con caché de 5 minutos (etiqueta `vehiculos`, como los
proyectos) las líneas, las ventas y la última importación. Una vista de cliente filtra en el
navegador. Las agregaciones son funciones puras en `lib/vehiculos.ts`:
- KPI;
- participación por tipo de batería;
- las 9 marcas principales + «Otros» por año;
- energía por tipo;
- opciones de filtro con conteo;
- año «parcial».

Se reutilizan:
- `DesplegableFiltro` (T23), con `filtros-url` generalizado para recibir la lista de campos;
- `TarjetaGrafica` y `Pestanas` (006), con «Ver como tabla» y el aviso de vacío;
- la dona de la 006, generalizada para recibir filas;
- `KpiTarjeta` y `KpiValor`;
- el patrón de carga diferida de Recharts;
- `csvDe`, extendido con la línea de créditos y fechas.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `datos/esquemas.json` | Modificar | `vehiculos_lineas`, `vehiculos_ventas` (tipo `entero`, `min_de`, referencia) |
| `datos/vehiculos_lineas.csv`, `datos/vehiculos_ventas.csv` | Crear (generados) | Datos de la hoja convertidos |
| `scripts/validar_datos.py`, `pruebas/test_validar_datos.py` | Modificar | `entero`, `min_de`, referencia venta → línea |
| `scripts/convertir_vehiculos.py`, `pruebas/test_convertir_vehiculos.py` | Crear | Hoja → `datos/`, con control de cuadre |
| `scripts/generar_validacion_sql.py`, `pruebas/test_validacion_sql.py` | Modificar | Reglas nuevas y tablas de vehículos |
| `supabase/migrations/0005_vehiculos.sql` | Crear | Tablas, RLS, disparadores, `reemplazar_vehiculos` |
| `scripts/importar_vehiculos.py`, `pruebas/test_importar_vehiculos.py` | Crear | Importación todo o nada con fecha de corte |
| `scripts/respaldo.py`, `pruebas/test_respaldo.py` | Modificar | Tablas de vehículos en el respaldo |
| `web/src/lib/esquemas.ts` (+ test) | Modificar | `entero` y `min_de` en zod |
| `web/src/lib/vehiculos.ts` (+ test) | Crear | Agregaciones y opciones de filtro |
| `web/src/lib/filtros-url.ts` (+ test) | Modificar | Lista de campos como parámetro |
| `web/src/lib/datos-publicos.ts`, `web/tests/integracion/vehiculos-datos.test.ts` | Modificar / Crear | Lectura pública con caché |
| `web/src/lib/csv.ts` (+ test) | Modificar | CSV de vehículos con créditos y fechas |
| `web/src/components/graficas/dona.tsx` (+ test) | Crear | Dona genérica (la de tecnología de la 006 la usa) |
| `web/src/components/vehiculos/*.tsx` (+ tests) | Crear | Filtros, KPI, tabla de tecnología, gráficas, créditos, vista |
| `web/src/app/vehiculos/page.tsx`, `web/src/app/secciones.test.tsx` | Modificar | Reemplaza «en construcción» |
| `web/e2e/003-vehiculos.spec.ts` | Crear (agente E2E) | Escenarios |

## Cambios de datos
- **Esquema:**
  - `vehiculos_lineas`: Marca (texto, obligatoria), Línea (texto, obligatoria, clave), Tipo de batería (`enum`: LFP, Lithium-ion, NMC Lithium-ion, ULTIUM), Capacidad mínima [kWh] (número > 0, obligatoria), Capacidad máxima [kWh] (número, obligatoria, `min_de` Capacidad mínima) y Potencia [kW] (número > 0, opcional).
  - `vehiculos_ventas`: Línea (referencia), Año (`entero` 2000–2100) y Unidades (`entero` ≥ 0).
- **Validación:** Python, zod y SQL usan las mismas reglas y las plantillas de `_mensajes` (se agregan `entero` y `min_de`).
- **Base:** migración 0005, que aplica el usuario en el SQL Editor de **pruebas**, como las anteriores.
- **Importación:** se convierte la hoja (CSV de la carpeta raw de `Vehiculos/`, 49 líneas, corte 2026-09-17) y se importa con `--entorno pruebas`. No se inventa ni se corrige ningún dato.

## Tareas
- [x] **T01 · S** · Esquemas y validador de vehículos
  - Cubre: RF-14 · CA-14.1
  - Prueba primero (RED): en `test_validar_datos.py` se comprueba lo siguiente. Hoy los esquemas no existen.
    - Una venta con unidades «-3» o «2,5» falla con el mensaje de `entero`.
    - Un tipo «NMC» falla con el mensaje de `valores`.
    - Una capacidad máxima menor que la mínima falla con el mensaje de `min_de`.
    - Una venta de una línea inexistente da error.
    - Un caso válido pasa.
  - Hecho cuando (GREEN): pruebas en verde; `validar_datos.py` sin errores.
  - Depende de: —
  - Archivos: `datos/esquemas.json`, `scripts/validar_datos.py`, `pruebas/test_validar_datos.py`
- [x] **T02 · S** · Conversión de la hoja con control de cuadre
  - Cubre: RF-14, RF-04 · CA-14.1, CA-03.1
  - Prueba primero (RED): en `test_convertir_vehiculos.py`, con un CSV ficticio de 2 líneas se comprueba lo siguiente. Hoy el script no existe.
    - Convierte las columnas `v2024`… en filas y lee la coma decimal.
    - Un total que no es la suma de los años, o unos kWh que no son total × promedio, rechazan el archivo con la línea que falla.
  - Hecho cuando (GREEN): prueba en verde. Con el CSV real resultan 49 líneas, 45.346 unidades y 2.426.467 kWh, y `validar_datos.py` queda sin errores.
  - Depende de: T01
  - Archivos: `scripts/convertir_vehiculos.py`, `pruebas/test_convertir_vehiculos.py`, `datos/vehiculos_lineas.csv`, `datos/vehiculos_ventas.csv`
- [x] **T03 · S** · `entero` y `min_de` en zod
  - Cubre: RF-14 · CA-14.1
  - Prueba primero (RED): `esquemas.test.ts`. Unidades «2,5» y capacidad máxima < mínima se rechazan con el mismo texto que Python. Hoy se aceptan.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T01
  - Archivos: `web/src/lib/esquemas.ts`, test
- [x] **T04 · M** · Migración 0005: tablas, RLS, disparadores e importación atómica
  - Cubre: RF-12, RF-14 · CA-14.1, CA-11.1
  - Prueba primero (RED):
    - En `test_validacion_sql.py`, el bloque generado de 0005 trae `vehiculos_lineas` y `vehiculos_ventas` con las reglas `entero` y `min_de` y los mismos mensajes. Hoy falla porque 0005 no existe.
    - En `web/tests/integracion/vehiculos-rls.test.ts`, contra **pruebas**: el visitante anónimo lee pero no escribe; `reemplazar_vehiculos` con una fila inválida no cambia nada y devuelve el mensaje; y con datos válidos registra la importación con la fecha de hoy.
  - Hecho cuando (GREEN): pruebas en verde después de que el usuario aplica 0005.
  - Depende de: T01
  - Archivos: `scripts/generar_validacion_sql.py`, `supabase/migrations/0005_vehiculos.sql`, `pruebas/test_validacion_sql.py`, `web/tests/integracion/vehiculos-rls.test.ts`
- [x] **T05 · S** · Comando de importación de vehículos
  - Cubre: RF-12, RF-14 · CA-14.1, CA-14.2
  - Prueba primero (RED): en `test_importar_vehiculos.py`, con un cliente simulado se comprueba lo siguiente. Hoy no existe.
    - Con errores de validación no llama a la base y sale con 1.
    - Con datos válidos llama a `reemplazar_vehiculos` una sola vez, con el corte.
    - `--simular` no envía nada.
    - `--corte` es obligatorio y no puede ser posterior a hoy.
  - Hecho cuando (GREEN): prueba en verde; `importar_vehiculos.py --entorno pruebas --corte 2026-09-17` importa las 49 líneas.
  - Depende de: T02, T04
  - Archivos: `scripts/importar_vehiculos.py`, `pruebas/test_importar_vehiculos.py`
- [x] **T06 · XS** · Vehículos en el respaldo diario
  - Cubre: RF-15 · CA-15.1
  - Prueba primero (RED): `test_respaldo.py`. El respaldo escribe `vehiculos_lineas.csv` y `vehiculos_ventas.csv`. Hoy solo escribe tres tablas.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T04
  - Archivos: `scripts/respaldo.py`, `pruebas/test_respaldo.py`
- [x] **T07 · S** · Agregaciones de vehículos
  - Cubre: RF-02 a RF-09 · CA-02.1, CA-03.1, CA-03.2, CA-05.1, CA-06.1, CA-07.1, CA-08.1, CA-09.1
  - Prueba primero (RED): `vehiculos.test.ts`, con datos ficticios. Hoy no existe.
    - KPI: unidades y MWh; 100 u × (40 + 60) / 2 kWh = 5,0 MWh.
    - Participación por tipo: suma 100.
    - Marcas: las 9 principales + «Otros», ordenadas, con ventas por año.
    - Energía por tipo: suma igual al KPI.
    - Opciones con conteo, y la línea depende de la marca.
    - «Parcial»: el último año con corte antes del 31/12.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/lib/vehiculos.ts`, test
- [x] **T08 · S** · Filtros genéricos y en la URL
  - Cubre: RF-02 · CA-02.1, CA-02.2
  - Prueba primero (RED): `filtros-url.test.ts`. Con los campos `marca`, `tipo` y `linea` hay ida y vuelta, y los parámetros de otros campos se ignoran. Hoy la lista de campos está fija en los de `/mapa`. Las pruebas de `/mapa` siguen en verde.
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: —
  - Archivos: `web/src/lib/filtros-url.ts`, test, `web/src/components/mapa/vista-mapa.tsx`
- [x] **T09 · XS** · Lectura pública de vehículos
  - Cubre: RF-01, RF-12 · CA-01.1, CA-11.1
  - Prueba primero (RED): `vehiculos-datos.test.ts` (integración). `leerVehiculos` trae líneas, ventas y la última importación (fecha de actualización y corte). Hoy no existe.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T05
  - Archivos: `web/src/lib/datos-publicos.ts`, test
- [x] **T10 · M** · Gráficas de vehículos
  - Cubre: RF-06 a RF-10, RNF-03, RNF-05, RNF-06, RNF-07 · CA-06.1, CA-07.1, CA-08.1, CA-09.1, CA-10.1, CA-10.2
  - Prueba primero (RED): tests de componente, con Recharts de tamaño fijo. Hoy no existen.
    - Barras apiladas: 10 barras, leyenda por año con «2026 (parcial)».
    - Dona genérica: total en el centro y porcentajes en la leyenda; la dona de tecnología de la 006 sigue en verde.
    - Energía por tipo: eje en [MWh].
    - Las cuatro gráficas tienen «Ver como tabla» y el aviso de vacío.
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: T07
  - Archivos: `web/src/components/graficas/dona.tsx`, `web/src/components/graficas/grafica-tecnologia.tsx`, `web/src/components/vehiculos/grafica-marcas.tsx`, `web/src/components/vehiculos/grafica-energia-tipo.tsx`, tests
- [x] **T11 · S** · KPI, tabla de tecnología y créditos
  - Cubre: RF-03, RF-05, RF-11, RNF-04 · CA-03.1, CA-05.1, CA-11.1
  - Prueba primero (RED): tests de componente. Hoy no existen.
    - «45.346» sin «mil» y «2.426,5 MWh».
    - Tabla con porcentajes de 1 decimal.
    - Créditos con «Última actualización: dd/mm/aaaa · Ventas hasta el dd/mm/aaaa».
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: T07
  - Archivos: `web/src/components/vehiculos/kpi-vehiculos.tsx`, `web/src/components/vehiculos/tabla-tecnologia.tsx`, `web/src/components/vehiculos/creditos.tsx`, tests
- [x] **T12 · M** · Vista y página `/vehiculos`, con descarga CSV
  - Cubre: RF-01, RF-02, RF-13, RNF-01, RNF-02 · CA-01.1, CA-02.1, CA-02.2, CA-10.2, CA-13.1
  - Prueba primero (RED): todo falla hoy porque la página es «en construcción».
    - `vista-vehiculos.test.tsx`: un filtro cambia los KPI, la tabla, las gráficas y la URL, y la descarga trae solo esas líneas con créditos, fechas y licencia.
    - `secciones.test.tsx`: `/vehiculos` ya no dice «en construcción».
    - `a11y.test.tsx`: axe sin violaciones.
  - Hecho cuando (GREEN): pruebas en verde; build correcto; LCP de `/vehiculos` < 2,5 s con build local.
  - Depende de: T08, T09, T10, T11
  - Archivos: `web/src/components/vehiculos/vista-vehiculos.tsx`, `web/src/app/vehiculos/page.tsx`, `web/src/lib/csv.ts`, tests

Estimación total: 12 tareas (3 M, 7 S, 2 XS) · unas 9 h, el 2026-10-22 y el 2026-10-23 (fecha del cronograma).

### Correcciones del informe E2E (2026-10-22)
- [x] **T13 · XS** · Conteos de los filtros con punto de miles (F: E2E-02, RNF-04)
  - Prueba primero (RED): en `desplegable-filtro` (vía `filtros-vehiculos`), la opción se llama «Model 3 (1.577)». Hoy se llama «(1577)».
  - Archivos: `web/src/components/mapa/desplegable-filtro.tsx`, test
- [x] **T14 · XS** · Porcentajes de las donas con un decimal (F: E2E-08, E2E-09, RNF-04)
  - Prueba primero (RED): en `dona.test.tsx`, la leyenda dice «71,4 %». Hoy redondea a «71 %», y la leyenda no coincide con la tabla ni suma 100.
  - Archivos: `web/src/components/graficas/dona.tsx`, tests de la dona y de la 006
- [x] **T15 · XS** · Unidad en la columna de vehículos de las donas (F: E2E-11, RNF-04)
  - Prueba primero (RED): `graficas-vehiculos.test.tsx`. El encabezado es «Ventas [vehículos]». Hoy dice «Vehículos», sin unidad.
  - Archivos: `web/src/components/vehiculos/donas-vehiculos.tsx`, test
- [x] **T16 · XS** · Tablas equivalentes sin desbordar a 375 px (F: E2E-18, RNF-01)
  - Prueba primero (RED): `tarjeta-grafica.test.tsx`. La tabla de «Ver como tabla» va dentro de un contenedor con desplazamiento horizontal propio (`overflow-x-auto`). Hoy la página se desplaza 25 px.
  - Archivos: `web/src/components/graficas/tarjeta-grafica.tsx`, test
- [x] **T17 · XS** · Tabla desplazable alcanzable con el teclado (observación de la segunda corrida, RNF-03)
  - Prueba primero (RED): en `tarjeta-grafica.test.tsx`, el contenedor con desplazamiento propio tiene `tabIndex` 0, rol `region` y el nombre «Tabla de <título>». Hoy no tiene ninguno.
  - Archivos: `web/src/components/graficas/tarjeta-grafica.tsx`, test

**Prerrequisito del usuario:** aplicar `0005_vehiculos.sql` en el SQL Editor de **pruebas**,
durante T04.

## Escenarios E2E
Contra `npm run dev` y el proyecto **pruebas**, en escritorio y a 375 px. Los datos son los
importados (49 líneas, corte 2026-09-17). Los escenarios que necesitan datos propios los
siembran con el prefijo `e2e-` y la marca «E2E» y los borran al final.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1 | 1. Abrir `/vehiculos` | Sin «en construcción»; dos KPI, la tabla de tecnología y cuatro gráficas |
| E2E-02 | CA-02.1 | 1. Elegir la marca «Tesla» en el filtro | Los KPI, la tabla y las gráficas muestran solo Tesla; el filtro de Línea ofrece solo sus líneas, con conteo |
| E2E-03 | CA-02.2 | 1. Filtrar 2. Abrir la URL en otra pestaña | Mismos filtros y mismo resultado |
| E2E-04 | CA-03.1 | 1. Sin filtros, leer los KPI | «45.346» (sin «mil») y «2.426,5 MWh» |
| E2E-05 | CA-03.2 | 1. Sembrar la marca «E2E» con una línea de 100 u y capacidades de 40/60 kWh 2. Filtrar por ella | Energía «5,0 MWh» |
| E2E-06 | CA-05.1 | 1. Leer la tabla de tecnología | LFP 67,5 %; los porcentajes suman 100 % ±0,1 |
| E2E-07 | CA-06.1 | 1. Mirar «Vehículos vendidos por marca y año de registro» | 10 barras ordenadas (9 marcas + «Otros»); leyenda 2024, 2025, «2026 (parcial)» |
| E2E-08 | CA-07.1 | 1. Mirar la dona de marcas | Las mismas 10 categorías, «Otros» al final; los porcentajes suman 100 % ±0,1 |
| E2E-09 | CA-08.1 | 1. Comparar la dona de tecnología con la tabla | Mismos porcentajes |
| E2E-10 | CA-09.1 | 1. Sumar la energía por tipo («Ver como tabla») | Igual al KPI de energía |
| E2E-11 | CA-10.1 | 1. «Ver como tabla» en cada gráfica | Mismas categorías y cifras, unidad en el encabezado |
| E2E-12 | CA-10.2 | 1. Filtros sin resultados | Gráficas con «Sin datos para estos filtros»; KPI en 0 |
| E2E-13 | CA-11.1 | 1. Leer la línea de créditos | «Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última actualización: <fecha de la importación> · Ventas hasta el 17/09/2026» |
| E2E-14 | CA-13.1 | 1. Filtrar por una marca 2. Descargar CSV | Solo sus líneas; columnas del esquema; créditos, fechas y licencia |
| E2E-15 | CA-14.1 | 1. `importar_vehiculos.py --simular` con un CSV de prueba con unidades negativas 2. Insertar el mismo dato directo en **pruebas** | Rechazo de todo el archivo con el error y su fila; la base rechaza con el mismo mensaje; la página no cambia |
| E2E-16 | CA-14.2 | 1. Reimportar el CSV válido con `--entorno pruebas` | En ≤ 5 min la «Última actualización» cambia a la fecha de hoy |
| E2E-17 | CA-15.1 | 1. `respaldo.py --entorno pruebas --carpeta <tmp>` | Escribe los CSV de vehículos junto a los demás |
| E2E-18 | RNF-01, RNF-03, RNF-06 | 1. A 375 px y con movimiento reducido, recorrer con teclado | Sin desplazamiento horizontal, filtros plegados, sin animación, consola sin errores |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1 | T09, T12 | E2E-01 |
| RF-02 | CA-02.1, CA-02.2 | T07, T08, T12 | E2E-02, E2E-03 |
| RF-03 | CA-03.1 | T07, T11 | E2E-04 |
| RF-04 | CA-03.2 | T02, T07 | E2E-05 |
| RF-05 | CA-05.1 | T07, T11 | E2E-06 |
| RF-06 | CA-06.1 | T07, T10 | E2E-07 |
| RF-07 | CA-07.1 | T07, T10 | E2E-08 |
| RF-08 | CA-08.1 | T07, T10 | E2E-09 |
| RF-09 | CA-09.1 | T07, T10 | E2E-10 |
| RF-10 | CA-10.1, CA-10.2 | T10, T12 | E2E-11, E2E-12 |
| RF-11 | CA-11.1 | T11 | E2E-13 |
| RF-12 | CA-11.1, CA-14.2 | T04, T05, T09 | E2E-13, E2E-16 |
| RF-13 | CA-13.1 | T12 | E2E-14 |
| RF-14 | CA-14.1, CA-14.2 | T01–T05 | E2E-15, E2E-16 |
| RF-15 | CA-15.1 | T06 | E2E-17 |
| RNF-01, RNF-03, RNF-06 | — | T10, T12 | E2E-18 |
| RNF-02 | — | T12 | LCP con build local |
| RNF-04 | — | T11 | E2E-04, E2E-06 |
| RNF-05, RNF-07 | — | T10 | E2E-07, E2E-10 |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Con 3,4 GB de RAM, la suite y el E2E crecen | `testTimeout` de 20 s (ya está), 1 worker y tandas |
| Generalizar `filtros-url` y la dona puede romper `/mapa` y la 006 | Sus pruebas actuales deben seguir en verde dentro de T08 y T10 |
| La migración la aplica el usuario a mano | Prerrequisito explícito en T04; la prueba de integración lo detecta |
| ANDEMOS: licencia del detalle por línea | Decisión del usuario: se publica con créditos; queda anotado en la bitácora |
| El CSV real está en la copia de OneDrive (`Vehiculos/data/raw/`) | T02 lo copia a una ruta de entrada documentada; no se edita a mano |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-22 | T01 | Las pruebas de vehículos no podían correr: faltaban los esquemas y los archivos | 66/66 en Python; validador sin errores | Tipo `entero`, regla `min_de`, clave compuesta (Línea + Año) y `referencias` (error, no aviso). Las plantillas `entero` y `min_de` se agregaron a `_mensajes` |
| 2026-10-22 | T02 | `convertir_vehiculos` no existía | 5/5. Con la hoja real (`Vehiculos/data/raw/…/2026-10-01_VEHICULOS_ELECTRICOS.csv`): 49 líneas, 45.346 unidades y 2.426.467,27 kWh | También revisa que el promedio de capacidad sea el de la mínima y la máxima. Escribe `datos/vehiculos_lineas.csv` (49) y `datos/vehiculos_ventas.csv` (147) |
| 2026-10-22 | T03 | Las 2 pruebas fallaron: zod no conocía `entero` ni `min_de` | 12/12 | `min_de` con `superRefine` |
| 2026-10-22 | T04 (en curso) | `test_validacion_sql` y `test_sql_esquemas` (ahora leen todas las migraciones) fallaron: no existía la 0005. `vehiculos-rls.test.ts`: «Could not find the table» | Python en verde. **Falta que el usuario aplique la 0005 en pruebas** | Columnas `numeric` con regla `entero` en el disparador (Postgres redondearía 2,5 en una columna `integer`). `delete … where true` por `pg_safeupdate`. La prueba de integración restaura los datos y borra sus importaciones |
| 2026-10-22 | T05 (en curso) | `importar_vehiculos` no existía | 5/5 con servidor simulado; `--simular` con los datos reales: 49 líneas y 45.346 unidades válidas | `ClienteRest.rpc()`. Se extrajo `errores_de_referencias()` del validador. Falta la importación real |
| 2026-10-22 | T06 | El respaldo solo escribía tres tablas | 66/66 | Las tablas de vehículos se respaldan sin el filtro de publicación |
| 2026-10-22 | T07 | `vehiculos.ts` no existía | 9/9 | — |
| 2026-10-22 | T08 | `filtros-url` tenía fijos los campos de `/mapa` | 5/5; `/mapa` sigue en verde | Además, `useFiltrosUrl` y `descargarTexto` salieron de `vista-mapa` a `lib/use-filtros-url.ts` (refactor sin cambio de comportamiento: 167/167) |
| 2026-10-22 | T10 | No existían; la tarjeta exigía pestañas | 6/6 en vehículos y 25/25 en gráficas | `Dona` genérica: la de tecnología de la 006 la usa. Pestañas opcionales en `TarjetaGrafica`. Error de cuenta en la prueba de energía corregido antes del GREEN (28,0 y 11,0 MWh) |
| 2026-10-22 | T11 | No existían | 4/4 | Una sola constante de fuentes, en `csv.ts` |
| 2026-10-22 | T12 (en curso) | La vista, la página y el CSV no existían | 267/267 en la suite; tipos y lint limpios. **`npm run build` falla** hasta que exista la 0005, porque `/vehiculos` se prerenderiza leyendo la base | Orden para publicar: primero la 0005 y la importación en la base, después el push |
| 2026-10-22 | T04 (cierre) | — | El usuario aplicó la 0005 en **pruebas**; `vehiculos-rls.test.ts` 5/5 | La prueba dejó la base vacía, como estaba |
| 2026-10-22 | T05 (cierre) | — | `importar_vehiculos.py --entorno pruebas --corte 2026-09-17`: 49 líneas y 45.346 unidades | — |
| 2026-10-22 | T09 | `vehiculos-datos.test.ts` no podía leer las tablas | Integración 34/34 | `vehiculosPublicos()` con caché de 5 min (etiqueta `vehiculos`) |
| 2026-10-22 | T12 (cierre) | — | 269/269; build correcto (`/vehiculos` estática, revalida cada 5 min); LCP con build local y 4G lenta: 2276, 1596 y 1368 ms (mediana 1,60 s). Chromium: 45.346, 2.426,5 MWh, LFP 67,5 %, Tesla 7.760; sin errores ni desplazamiento a 375 px | **En el navegador se vio que la paleta no distinguía colores:** 2024 y 2026 salían en el mismo gris, y en las donas había grises contiguos. Prueba RED con los valores reales de `colors.css`; paleta nueva de 10 colores distintos, y años como en Looker (gris claro, gris oscuro, durazno). El total de la dona se dibuja en dos líneas para que quepa en el anillo |
| 2026-10-22 | T13–T16 | Las 4 pruebas fallaron como se esperaba | 273/273; tipos y lint limpios; build correcto | Se actualizaron 3 pruebas que exigían el formato anterior («71 %», «100 %», «Vehículos»). El conteo con punto de miles también aplica a los filtros de `/mapa`, y el decimal de las donas a la de la 006. **Entorno:** con 300 MB libres, la suite en paralelo completo fallaba al leer `node_modules` (errno -4094, sin relación con el código); `maxWorkers: 2` en `vitest.config.mts` |
| 2026-10-22 | T17 | La región desplazable no existía | 274/274; tipos y lint limpios; build correcto | Con la aprobación del usuario, la spec acepta ±0,1 de redondeo en CA-05.1 y CA-07.1, deja «Otros» al final e identifica las ventas por Línea + Año |

## Informe E2E
[e2e-informe.md](e2e-informe.md): tres corridas (13/18, 17/18 y 18/18). Las fallas se corrigieron en T13–T17 y con los ajustes de spec aprobados. RNF-02 se midió aparte con build local (mediana de 1,60 s). Cerrada con la aprobación del usuario.
