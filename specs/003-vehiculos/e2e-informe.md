# Informe E2E · 003
Fecha: 2026-10-22 (tercera corrida, corta) · Entorno: local (`npm run dev`, puerto 3000) contra el proyecto Supabase **pruebas** (49 vehículos reales, corte 2026-09-17; esta corrida no sembró nada) · Comando: `E2E_DATOS_375=1 E2E_MATCH=003-vehiculos.spec.ts npx playwright test -c e2e/006.config.ts --project=escritorio --project=movil-375 --retries=0 -g "E2E-0[678] |E2E-11 |E2E-18 "` (1 worker)

Pruebas: `web/e2e/003-vehiculos.spec.ts`. Las cifras esperadas se calculan de forma independiente
desde `datos/vehiculos_lineas.csv` y `datos/vehiculos_ventas.csv`. El indicador de desarrollo de
Next.js se oculta en todas las pruebas. El servidor y sus procesos hijos se detuvieron al final.

## Alcance de esta corrida
Se corrieron E2E-06, E2E-07, E2E-08, E2E-11 y E2E-18, en escritorio y a 375 px, contra la spec
vigente (historial del 2026-10-22: CA-05.1 y CA-07.1 admiten ±0,1 por redondeo; CA-06.1 y CA-07.1
exigen «Otros» siempre al final; las ventas se identifican por Línea + Año). Los demás escenarios
conservan el resultado de la segunda corrida (ver «Corridas anteriores»).

Cambios en las pruebas:
- **E2E-06:** la suma de la tabla de tecnología se compara con 100 % ±0,1 (antes, exacta).
- **E2E-07:** comprueba además que «Otros» es la última barra y que vale la suma de las marcas
  que no están entre las 9 primeras.
- **E2E-08:** la suma de la tabla y la de la leyenda se comparan con 100 % ±0,1; «Otros» al final
  en ambas.
- **E2E-11:** comprueba que cada tabla de «Ver como tabla» está dentro de una región llamada
  «Tabla de <título>».
- **E2E-18:** para cada tabla que no cabe a 375 px, comprueba que la región «Tabla de <título>»
  es el contenedor que se desplaza, que se llega a ella con Tab y que la flecha derecha la
  desplaza sin desbordar la página. El recorrido con Tab empieza en el elemento enfocable anterior
  a la región en el documento. Como la región va **antes** del botón «Ver como gráfica», el
  recorrido empieza en el título de la tarjeta. La prueba le pone `tabIndex = -1` al título para
  poder enfocarlo, solo en el navegador de prueba.
- **Opción `E2E_DATOS_375=1`:** permite correr a 375 px los escenarios de lectura de datos, que por
  defecto solo corren en escritorio. No afecta a los escenarios de importación.
- Corregí dos errores de la propia prueba durante la corrida (no son fallas de la app). En E2E-07,
  la comprobación nueva de «Otros» no tenía en cuenta la columna «Total» de la tabla (la fila suma
  el doble). Además, el registro del recorrido con Tab fallaba al leer `innerText` de un elemento SVG.

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1 | ✅ Pasa (2.ª corrida) | Sin «en construcción»; dos KPI, tabla «Participación por tipo de batería» y las cuatro regiones con su gráfica; consola sin errores |
| E2E-02 | CA-02.1 (y RNF-04) | ✅ Pasa (2.ª corrida) | Con Tesla: KPI 7.760 y 538,6 MWh, tabla «Lithium-ion 100,0 %», gráficas solo con Tesla; Línea ofrece «Model 3 (1.577)», «Model Y (6.183)» |
| E2E-03 | CA-02.2 | ✅ Pasa (2.ª corrida) | URL `/vehiculos?marca=Tesla&linea=Model+Y`; en otra pestaña, mismos filtros y resultado |
| E2E-04 | CA-03.1 | ✅ Pasa (2.ª corrida) | «45.346» (sin «mil»), «· 2024–2026», «2.426,5 MWh» |
| E2E-05 | CA-03.2 | ✅ Pasa (2.ª corrida) | Línea E2E de 100 u y 40/60 kWh: 100 vehículos y «5,0 MWh» |
| E2E-06 | CA-05.1 | ✅ Pasa (escritorio y 375 px) | LFP 67,5 %, Lithium-ion 29,7 %, NMC Lithium-ion 2,2 %, ULTIUM 0,6 %; suma 100,0 % (dentro de ±0,1) |
| E2E-07 | CA-06.1 | ✅ Pasa (escritorio y 375 px) | Eje: Byd, Tesla, Volvo, Chery, Chevrolet, Kia, Bmw, DEEPAL, Peugeot, Otros. Las 9 marcas van de mayor a menor (19.793 … 955). «Otros» va al final con 3.930, que es la suma de las demás marcas, aunque supera a Volvo y a las 6 marcas siguientes. Leyenda «2024», «2025», «2026 (parcial)» |
| E2E-08 | CA-07.1 | ✅ Pasa (escritorio y 375 px; antes ❌) | Mismas 10 categorías que las barras, con «Otros» al final en la leyenda y en la tabla. Leyenda y tabla: 43,6; 17,1; 6,6; 5,4; 4,8; 4,6; 3,6; 3,4; 2,1; 8,7 = **99,9 %**, dentro del margen de ±0,1 que ahora admite la spec |
| E2E-09 | CA-08.1 | ✅ Pasa (2.ª corrida) | Dona de tecnología = tabla de RF-05 = «Ver como tabla» (67,5 / 29,7 / 2,2 / 0,6 %) |
| E2E-10 | CA-09.1 | ✅ Pasa (2.ª corrida) | 1.544,5 + 791,1 + 69,6 + 21,3 = 2.426,5 MWh = KPI; eje «Energía [MWh]» |
| E2E-11 | CA-10.1 (y RNF-03, RNF-04) | ✅ Pasa (escritorio y 375 px) | Las cuatro tablas se abren con teclado (Enter) y cada una está dentro de la región «Tabla de <título>». Tienen las mismas categorías y cifras es-CO, con la unidad entre corchetes en cada columna de cifras («2024 [vehículos]» … «Total [vehículos]», «Ventas [vehículos]», «Participación [%]», «Energía [MWh]»). La tabla de energía coincide con las etiquetas de la gráfica |
| E2E-12 | CA-10.2 | ✅ Pasa (2.ª corrida) | `?marca=Tesla&tipo=LFP`: «Sin datos para estos filtros» en las cuatro gráficas; KPI «0» y «0,0 MWh» |
| E2E-13 | CA-11.1 | ✅ Pasa (2.ª corrida) | «Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última actualización: 22/10/2026 · Ventas hasta el 17/09/2026» |
| E2E-14 | CA-13.1 | ✅ Pasa (2.ª corrida) | CSV de Byd: solo sus líneas, columnas del esquema, créditos, fechas y «CC BY 4.0» |
| E2E-15 | CA-14.1 | ✅ Pasa (2.ª corrida) | Se rechaza todo el archivo y se lista cada error con su fila; la base rechaza el dato (23514) con el mismo mensaje; la página no cambió |
| E2E-16 | CA-14.2 | ✅ Pasa (1.ª corrida) | Datos nuevos visibles a los 289 s (límite 300 s) y «Última actualización: 22/10/2026». No se repitió en la 2.ª ni en la 3.ª corrida |
| E2E-17 | CA-15.1 | ✅ Pasa (2.ª corrida) | `respaldo.py --entorno pruebas --carpeta <tmp>`: proyectos (7), normativa (0), noticias (0), vehiculos_lineas (49), vehiculos_ventas (147) |
| E2E-18 | RNF-01, RNF-03, RNF-06 | ✅ Pasa (375 px) | Con movimiento reducido, el KPI no tiene conteo animado (un solo valor, «2.426,5») y la geometría de las gráficas es estable. Los KPI se apilan y los filtros se pliegan en «Filtros»; Tesla se elige con teclado. La página no se desborda (`scrollWidth − clientWidth = 0`) al cargar, con el desplegable abierto ni con las cuatro tablas abiertas. La tabla de barras mide 367 px (58 px de exceso). Su contenedor es un `div[role=region]` con `tabindex="0"`, el nombre «Tabla de Vehículos eléctricos vendidos por marca y año de registro» y `overflow-x: auto`. Con **un Tab** desde el título de la tarjeta, el foco llega a la región, y la flecha derecha la desplaza (`scrollLeft` 0 → 40) sin desbordar la página. Las otras tres tablas caben (309 px). Consola sin errores. Captura: `web/test-results/006/003-vehiculos-003-·-Vehícu-9d239-in-animación-consola-limpia-movil-375/attachments/E2E-18-375-a4cc1b649f108149cdd7f543b79a128e32bf32bf.png` |

**Total: 18 escenarios · 18 pasan · 0 fallan · 0 no comprobables.** En esta corrida se ejecutaron 5
(E2E-06, 07, 08, 11 y 18): 9 ejecuciones entre escritorio y 375 px, todas en verde y sin reintentos
en la corrida de confirmación. Los otros 13 conservan el resultado de la segunda corrida, salvo
E2E-16, que conserva el de la primera. Algunos aspectos parciales no se pueden comprobar; se listan
abajo.

## Fallas
Ninguna en esta corrida.

## No comprobables
- **RNF-02 (LCP < 2,5 s en 4G):** el plan lo mide sobre un build local, y en este equipo no se puede correr `npm run build` con `npm run dev` encendido (memoria). No se midió.
- **CA-14.2, cambio de la fecha:** E2E-16 no se repite desde la primera corrida. En esa corrida la base ya se había importado el mismo día, así que no se pudo ver el cambio de «Última actualización» a nivel de día.
- **CA-15.1, «cuando corre el respaldo diario»:** solo se comprobó la ejecución manual contra una carpeta temporal. Que corra a diario y actualice el repositorio no se ve desde fuera.
- **RNF-05 (solo tokens TEJ, sin colores escritos a mano):** exige leer el código. No se evaluó.
- **RNF-03, contraste:** las gráficas tienen leyendas y etiquetas en texto y tablas equivalentes. El contraste no se midió.
- **Datos, clave Línea + Año:** no se ve desde la interfaz. En la segunda corrida (observación 3) se vio que `vehiculos_ventas` tiene `linea`, `ano` y `unidades`, lo que coincide con la spec vigente. No se probó que la base rechace una combinación Línea + Año repetida.

## Observaciones (no son fallas)
1. **E2E-18, orden de foco:** la región de la tabla va antes del botón «Ver como gráfica» en el orden de Tab. Con Tab desde ese botón, el foco pasa a la gráfica siguiente; a la región se llega desde el título de la tarjeta (o con Shift+Tab desde el botón). Es coherente con el orden visual: la tabla se ve arriba del botón.
2. **Elementos SVG enfocables:** al recorrer con Tab, el foco pasa por un elemento `g` sin nombre de las gráficas antes de «Ver como tabla». No se evaluó qué anuncia un lector de pantalla.
3. Cada KPI expone su cifra dos veces en el texto del grupo («7.760 7.760»). No cambió desde la segunda corrida; no se verificó cómo se anuncia.
4. Los mensajes de rechazo de la importación numeran las filas contando el encabezado como fila 1 (observado en la segunda corrida).
5. La región desplazable recibe el foco gracias a su `tabindex="0"`, así que ya no depende del comportamiento de Chromium (observación 5 de la segunda corrida). Solo se probó en Chromium.

## Corridas anteriores

### Segunda corrida (2026-10-22)
Comando: `E2E_MATCH=003-vehiculos.spec.ts npx playwright test -c e2e/006.config.ts --project=escritorio --retries=0 -g "<tanda>"` y `--project=movil-375 -g "E2E-18"`. Resultado: 18 escenarios · 17 pasan (E2E-16 con el resultado de la primera) · 1 falla · 0 no comprobables.

| Escenario | Resultado | Nota |
|---|---|---|
| E2E-01, 03, 04, 05, 06, 10, 12, 13, 14, 15, 17 | ✅ | Igual que en la tabla vigente |
| E2E-02 | ✅ (antes ❌) | Conteo de Línea con punto de miles |
| E2E-07 | ✅ con observación | «Otros» al final aunque supera a varias marcas; la spec no lo decía (ahora lo exige) |
| E2E-08 | ❌ | Leyenda y tabla de la dona de marcas sumaban 99,9 %; la spec de entonces no admitía tolerancia. Traza: `web/test-results/006/003-vehiculos-003-·-Vehícu-2bdef--porcentajes-que-suman-100--escritorio/trace.zip` |
| E2E-09 | ✅ (antes ❌) | Dona de tecnología = tabla de RF-05 |
| E2E-11 | ✅ (antes ❌) | «Ventas [vehículos]» en las tablas de las donas |
| E2E-16 | ✅ (1.ª corrida) | No se repitió |
| E2E-18 | ✅ (antes ❌) | Sin desborde de página; el contenedor desplazable de la tabla de barras no tenía `tabindex`, rol ni nombre (ahora es la región «Tabla de <título>») |

### Primera corrida (2026-10-22)
Resultado: 18 escenarios · 13 pasan · 5 fallan · 0 no comprobables.

| Escenario | Resultado entonces | Falla | En la segunda corrida |
|---|---|---|---|
| E2E-02 | ❌ | Conteo de las opciones de Línea sin punto de miles: «Model 3 (1577)», «Model Y (6183)» | ✅ «Model 3 (1.577)», «Model Y (6.183)» |
| E2E-08 | ❌ | Leyenda de la dona de marcas sin decimal (suma 101 %); tabla con un decimal (suma 99,9 %) | ❌ Leyenda corregida (un decimal, igual a la tabla), pero ambas sumaban 99,9 % |
| E2E-09 | ❌ | Dona de tecnología con enteros (68/30/2/1 %) distintos de la tabla de RF-05 (67,5/29,7/2,2/0,6 %) | ✅ Coinciden |
| E2E-11 | ❌ | Columna «Vehículos» de las tablas de las donas sin unidad entre corchetes | ✅ «Ventas [vehículos]» |
| E2E-18 | ❌ | A 375 px, con la tabla de barras abierta, la página se desplazaba 25 px en horizontal | ✅ Sin desborde de página; la tabla se desplazaba en su contenedor |

Los demás escenarios (E2E-01, 03 a 07, 10, 12 a 17) pasaron en ambas corridas. E2E-16 pasó en la
primera corrida con 289 s de espera (límite 300 s).
