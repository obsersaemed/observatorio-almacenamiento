# 002 · Implementación en el país — Plan

Estado: Terminado (2026-10-21)
Fecha: 2026-10-21
Spec: [spec.md](spec.md)

## Enfoque técnico
`/mapa` sigue el enfoque A del brainstorm. La página de servidor lee una sola vez los
proyectos aprobados, con la misma caché de 5 minutos que el inicio
(`datos-publicos.ts`, etiqueta `proyectos`). Se los pasa a un componente de cliente que
filtra en el navegador. Mapa, tabla, KPI «según filtros» y descarga leen el **mismo**
arreglo filtrado, calculado por una función pura (RF-09). Así, la lógica se prueba con
Vitest sin navegador y la vista solo pinta.

Los filtros viven en la URL (`?estado=…&departamento=…`, valores repetidos para la
selección múltiple), que es la fuente del estado; «Limpiar filtros» borra la consulta.
El mapa usa **MapLibre GL**, cargado de forma diferida y solo en el cliente para no
afectar el LCP (RNF-02). Las teselas vectoriales son de **OpenFreeMap** (basadas en OSM,
sin llave ni costo). Si no responden, se recurre a las teselas ráster de
`tile.openstreetmap.org`, con su atribución. Cada proyecto es un marcador HTML: un
`<button>` con `aria-label`. Así, el hover, el toque y el foco de teclado abren la misma
tarjeta, que se cierra con Escape (RF-04, RNF-03). Los colores de estado salen de tokens
TEJ (RNF-05), y la leyenda y la tarjeta dicen el estado en texto. La tabla usa **TanStack
Table** (orden por columna). La descarga del resultado filtrado reutiliza `csvDe()` de la
001 en el navegador (misma licencia y columnas, sin correos).

**Servicios como lista cerrada.** Se agrega a `datos/esquemas.json` un tipo `lista`
(`valores` + separador coma), que validan con el mismo mensaje el validador de Python, el
esquema zod (aprobación), el disparador SQL generado por `generar_validacion_sql.py` y la
importación. En la base, la columna `tipo_uso_conexion` sigue siendo `text`: guarda los
valores separados por «, » y el disparador los valida uno por uno. Con esto no cambian la
importación, el respaldo ni el CSV. En `/admin`, Servicios se elige con casillas.

Se reutiliza: `leerNumero`, `valorEsCo` y el formato es-CO, `KpiTarjeta`/`KpiValor`
(conteo animado con movimiento reducido), `ESTADOS`, `csvDe`, `columnasDe`, el formulario
de aportes y la plantilla de mensajes `_mensajes`. Librerías nuevas, ambas dentro del stack
aprobado: `maplibre-gl` y `@tanstack/react-table`.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `datos/esquemas.json` | Modificar | `Tipo uso/conexión` pasa a tipo `lista` con 3 valores |
| `datos/proyectos.csv` | Modificar | 2 textos de servicio convertidos a la lista (aprobado en la spec) |
| `scripts/validar_datos.py`, `pruebas/test_validar.py` | Modificar | Validar `lista` |
| `scripts/generar_validacion_sql.py`, `pruebas/test_generar_validacion_sql.py` | Modificar | Regla SQL para `lista` |
| `supabase/migrations/0004_servicios.sql` | Crear | Disparador regenerado + conversión de los textos en la base |
| `web/src/lib/esquemas.ts` (+ test) | Modificar | `lista` en zod, mismo mensaje |
| `web/src/lib/decision.ts`, `web/src/components/aportes/decision.tsx` (+ tests) | Modificar | Casillas de Servicios en la aprobación |
| `web/src/lib/proyectos-mapa.ts` (+ test) | Crear | Filtrado, opciones con conteo, municipios dependientes, duración, KPI filtrado |
| `web/src/lib/filtros-url.ts` (+ test) | Crear | Filtros ↔ URL |
| `web/src/lib/datos-publicos.ts` | Modificar | `proyectosParaMapa()` con las columnas públicas |
| `web/src/components/mapa/tabla-proyectos.tsx` (+ test) | Crear | Tabla ordenable |
| `web/src/components/mapa/tarjeta-proyecto.tsx` (+ test) | Crear | Tarjeta |
| `web/src/components/mapa/mapa-proyectos.tsx`, `leyenda.tsx` (+ test) | Crear | Mapa, marcadores y leyenda |
| `web/src/components/mapa/filtros.tsx` (+ test) | Crear | Panel de filtros (plegable en móvil) |
| `web/src/components/mapa/kpi-mapa.tsx` (+ test) | Crear | KPI «Instalado» y «según filtros» |
| `web/src/components/mapa/vista-mapa.tsx` (+ test) | Crear | Orquesta filtros, URL, selección y descarga |
| `web/src/app/mapa/page.tsx` | Modificar | Reemplaza «en construcción» |
| `web/src/app/aportar/page.tsx`, `web/src/components/formulario-aporte.tsx` (+ test) | Modificar | Prellenado de tipo y proyecto |
| `web/src/styles/tokens/colors.css` | Modificar (si falta) | Tokens semánticos de estado |
| `web/package.json` | Modificar | `maplibre-gl`, `@tanstack/react-table` |
| `web/e2e/002-implementacion.spec.ts` | Crear (agente E2E) | Escenarios |

## Cambios de datos
- **Esquema:** `{"nombre": "Tipo uso/conexión", "tipo": "lista", "separador": ",", "valores": [«Regulación primaria de frecuencia», «Inyección de energía en la noche», «Mercado regulado a través de contratos de largo plazo»]}`. No es obligatorio. Se mantienen el nombre y la posición de la columna.
- **Validación:** se separa por coma, se quitan los espacios y cada valor debe estar en la lista. Si no, se usa la plantilla `valores` existente («'Tipo uso/conexión' = '…' no está entre los valores permitidos: …»), igual en Python, zod y SQL.
- **Base (0004):** el disparador de `proyectos` se regenera con la regla de lista. La migración también actualiza los textos actuales: «Inyección de energia por la noche» → «Inyección de energía en la noche» y «Mercado regulado a través de los contratos de largo plazo» → «Mercado regulado a través de contratos de largo plazo». La aplica el usuario en el SQL Editor del proyecto **pruebas**, como 0001–0003.
- **CSV y Sheet:** se convierten los mismos 2 textos en `datos/proyectos.csv`. El usuario los corrige también en la `Base de datos SAEB`. Canadian solar queda vacío. Ninguna cifra cambia.

## Tareas
- [x] **T01 · S** · Tipo `lista` en el esquema y el validador de Python
  - Cubre: RF-14 · CA-14.1 (validador)
  - Prueba primero (RED): en `pruebas/test_validar.py`, un CSV con «Regulación primaria de frecuencia, Inyección de energía en la noche» pasa y uno con «Servicio X» falla con el mensaje de `valores` (hoy falla porque `lista` no existe y el texto se acepta).
  - Hecho cuando (GREEN): prueba en verde; `python scripts/validar_datos.py` sin errores con `datos/proyectos.csv` convertido.
  - Depende de: —
  - Archivos: `datos/esquemas.json`, `datos/proyectos.csv`, `scripts/validar_datos.py`, `pruebas/test_validar.py`
- [x] **T02 · S** · `lista` en zod con el mismo mensaje
  - Cubre: RF-14 · CA-14.1 (aprobación)
  - Prueba primero (RED): `web/src/lib/esquemas.test.ts`. `validar("proyectos", …)` acepta dos valores separados por coma y rechaza «Servicio X» con el mismo texto que Python (hoy lo acepta).
  - Hecho cuando (GREEN): prueba en verde; el valor normalizado se guarda como «a, b».
  - Depende de: T01
  - Archivos: `web/src/lib/esquemas.ts`, `web/src/lib/esquemas.test.ts`
- [x] **T03 · S** · Regla SQL y migración 0004
  - Cubre: RF-14 · CA-14.1 (base de datos e importación)
  - Prueba primero (RED): `pruebas/test_generar_validacion_sql.py`. El SQL generado para `lista` separa el valor y lanza el mensaje de `valores`. En `web/tests/integracion`, insertar «Servicio X» en **pruebas** se rechaza con el mismo texto (hoy se acepta).
  - Hecho cuando (GREEN): pruebas en verde después de que el usuario aplica 0004. `importar.py --simular` rechaza «Servicio X» con el mismo mensaje.
  - Depende de: T01
  - Archivos: `scripts/generar_validacion_sql.py`, `pruebas/test_generar_validacion_sql.py`, `supabase/migrations/0004_servicios.sql`, `web/tests/integracion/servicios.test.ts`
- [x] **T04 · S** · Servicios con casillas en la aprobación
  - Cubre: RF-14 · CA-14.1 (lista en la aprobación)
  - Prueba primero (RED): `decision.test.tsx`. El campo Servicios muestra 3 casillas, marca las del valor actual y el envío con dos marcadas produce «a, b» (hoy es un texto libre).
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T02
  - Archivos: `web/src/components/aportes/decision.tsx`, `web/src/lib/decision.ts`, tests
- [x] **T05 · S** · Filtrado y opciones con conteo
  - Cubre: RF-08, RF-12, RF-14 · CA-08.1, CA-08.2, CA-12.1, CA-14.2
  - Prueba primero (RED): `web/src/lib/proyectos-mapa.test.ts`. Usa datos ficticios. Comprueba que el filtro admite varios valores dentro de un mismo filtro y que entre filtros deben cumplirse todos, que un proyecto con dos servicios coincide con cualquiera de los dos, que los municipios dependen de los departamentos, que se cuentan los proyectos por opción y que un resultado vacío da 0 (hoy el módulo no existe).
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/lib/proyectos-mapa.ts`, test
- [x] **T06 · S** · KPI filtrado, duración y filtros en la URL
  - Cubre: RF-05, RF-10, RF-11 · CA-05.1, CA-10.1, CA-10.2, CA-11.1
  - Prueba primero (RED): en `proyectos-mapa.test.ts`, la duración de 50 MW / 195 MWh es 3,9 h y queda vacía si falta un dato. Los KPI «Instalado» solo suman `En operación` y los «según filtros» suman todos los estados del resultado. En `filtros-url.test.ts`, el viaje de ida y vuelta de filtros a URL y de vuelta a filtros conserva tildes y valores múltiples, y los filtros vacíos dan una URL sin consulta.
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: T05
  - Archivos: `web/src/lib/proyectos-mapa.ts`, `web/src/lib/filtros-url.ts`, tests
- [x] **T07 · XS** · Lectura de proyectos para el mapa
  - Cubre: RF-01 · CA-01.2
  - Prueba primero (RED): `web/tests/integracion/mapa-datos.test.ts`. `proyectosParaMapa()` contra **pruebas** devuelve solo los aprobados y no incluye columnas internas (hoy la función no existe).
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/lib/datos-publicos.ts`, test
- [x] **T08 · M** · Tabla ordenable
  - Cubre: RF-02, RF-03, RF-12, RNF-04 · CA-02.1, CA-03.1, CA-12.1
  - Prueba primero (RED): `tabla-proyectos.test.tsx`. Comprueba que la tabla tiene encabezados con unidades entre corchetes, que ordena por MW de mayor a menor, que usa coma decimal, que marca «sin ubicación en el mapa», que muestra «Ningún proyecto cumple estos filtros» y que una fila se puede elegir con el teclado.
  - Hecho cuando (GREEN): prueba en verde; `@tanstack/react-table` instalado.
  - Depende de: T05
  - Archivos: `web/src/components/mapa/tabla-proyectos.tsx`, test, `web/package.json`
- [x] **T09 · S** · Tarjeta del proyecto
  - Cubre: RF-05, RF-06 · CA-05.1, CA-05.2, CA-06.1
  - Prueba primero (RED): `tarjeta-proyecto.test.tsx`. Con 50 MW y 195 MWh muestra «50,0 MW», «195,0 MWh» y «3,9 h». Muestra «Servicios: Sin dato», oculta los campos vacíos y no tiene enlaces de fuente. «Proponer corrección» apunta a `/aportar?tipo=Corrección&registro=<nombre>`.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T06
  - Archivos: `web/src/components/mapa/tarjeta-proyecto.tsx`, test
- [x] **T10 · XS** · Prellenado de `/aportar`
  - Cubre: RF-06 · CA-06.1
  - Prueba primero (RED): `formulario-aporte.test.tsx`. Con `tipo=Corrección` y `registro=La Martina`, el tipo y el proyecto llegan elegidos (hoy se ignoran). Un tipo inválido se ignora.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/app/aportar/page.tsx`, `web/src/components/formulario-aporte.tsx`, test
- [x] **T11 · M** · Mapa con marcadores accesibles y leyenda
  - Cubre: RF-01, RF-04, RF-07, RNF-03, RNF-05, RNF-06 · CA-01.1, CA-04.1, CA-04.2, CA-04.3, CA-07.1
  - Prueba primero (RED): `mapa-proyectos.test.tsx`, con `maplibre-gl` simulado. Comprueba que hay un botón por proyecto con coordenadas y con `aria-label` (nombre y estado), y que el color del botón viene de un token. La tarjeta se abre con `mouseenter`, `click` y `focus`, y se cierra con Escape y con `mouseleave`. `seleccionado` centra con `flyTo` o, con movimiento reducido, con `jumpTo`. La leyenda nombra los 4 estados. Se ve la atribución de OSM.
  - Hecho cuando (GREEN): prueba en verde; `maplibre-gl` instalado y cargado con `dynamic(…, { ssr: false })`.
  - Depende de: T09
  - Archivos: `web/src/components/mapa/mapa-proyectos.tsx`, `web/src/components/mapa/leyenda.tsx`, test, `web/package.json`, `web/src/styles/tokens/colors.css`
- [x] **T12 · S** · Panel de filtros y KPI de la sección
  - Cubre: RF-08, RF-11, RNF-01 · CA-08.2, CA-11.1
  - Prueba primero (RED): en `filtros.test.tsx`, el panel muestra 7 filtros con el conteo de cada opción, el municipio depende del departamento y el panel se pliega en móvil. En `kpi-mapa.test.tsx`, aparecen dos grupos con MW y MWh en tarjetas distintas y el rótulo «(todos los estados)».
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: T06
  - Archivos: `web/src/components/mapa/filtros.tsx`, `web/src/components/mapa/kpi-mapa.tsx`, tests
- [x] **T13 · M** · Vista completa de `/mapa` con URL, selección y descarga
  - Cubre: RF-07, RF-09, RF-10, RF-13, RNF-07 · CA-07.1, CA-09.1, CA-10.1, CA-10.2, CA-13.1
  - Prueba primero (RED): `vista-mapa.test.tsx`, con el mapa simulado. Un filtro cambia a la vez la tabla, los KPI, los marcadores y la URL. Elegir una fila marca el proyecto seleccionado. «Limpiar filtros» vacía la URL. La descarga produce `csvDe` con solo las filas filtradas, la licencia y la columna `Fuente`. En `metadatos.test.ts`, `/mapa` tiene su título y su descripción.
  - Hecho cuando (GREEN): pruebas en verde; `/mapa` se abre en `npm run dev` sin errores de consola.
  - Depende de: T07, T08, T11, T12
  - Archivos: `web/src/components/mapa/vista-mapa.tsx`, `web/src/app/mapa/page.tsx`, tests
- [x] **T14 · XS** · Accesibilidad, 375 px y LCP de `/mapa`
  - Cubre: RNF-01, RNF-02, RNF-03 · (todos los CA a 375 px)
  - Prueba primero (RED): agregar `/mapa` con datos ficticios a `a11y.test.tsx` (axe sin violaciones) y a `001-lcp.spec.ts` (LCP < 2,5 s con 4G simulado). Hoy `/mapa` es la página «en construcción»: la prueba de la vista falla.
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: T13
  - Archivos: `web/src/components/a11y.test.tsx`, `web/e2e/001-lcp.spec.ts`


### Correcciones del informe E2E (aprobadas el 2026-10-21)
- [x] **T15 · S** · Toque en pantalla táctil (F1, E2E-06)
  - Cubre: RF-04 · CA-04.2
  - Prueba primero (RED): `mapa-proyectos.test.tsx`. Un `pointerenter` con `pointerType: "touch"` no abre la tarjeta, y el toque (`click`) sí la abre y la deja abierta aunque después llegue un `mouseleave`. Hoy el *mouseenter* simulado del toque la abre y el *mouseleave* la cierra.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/components/mapa/mapa-proyectos.tsx`, test
- [x] **T16 · S** · Tarjeta alcanzable con mouse y teclado (F2, E2E-10b)
  - Cubre: RF-04, RF-06 · CA-04.1, CA-04.4
  - Prueba primero (RED): `mapa-proyectos.test.tsx`. Al pasar el mouse del punto a la tarjeta, esta sigue abierta, y al salir de ambos se cierra. Enter sobre el punto deja la tarjeta abierta y mueve el foco a ella. Si el foco sale del punto hacia la tarjeta, esta no se cierra. Hoy se cierra en los tres casos.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T15
  - Archivos: `web/src/components/mapa/mapa-proyectos.tsx`, test
- [x] **T17 · XS** · Contenedor del mapa accesible (O-1)
  - Cubre: RNF-03
  - Prueba primero (RED): `mapa-proyectos.test.tsx`. Ningún ancestro de un elemento que recibe el foco tiene `aria-hidden`. El mapa se crea con `locale` en español («Mostrar atribución»…) y el lienzo tiene un nombre accesible. Hoy el contenedor tiene `aria-hidden="true"` y no se pasa `locale`.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T16
  - Archivos: `web/src/components/mapa/mapa-proyectos.tsx`, test
- [x] **T18 · S** · Servicio fuera de la lista en la aprobación (O-3)
  - Cubre: RF-14 · CA-14.1
  - Prueba primero (RED): en `decision.test.ts` y `decision.test.tsx`, si el aporte propone «Servicio X», el campo muestra un aviso con el valor propuesto que no está en la lista, para que el editor decida, y el grupo se llama «Servicios». Hoy el valor se descarta sin avisar y el grupo se llama «Tipo uso/conexión».
  - Hecho cuando (GREEN): pruebas en verde.
  - Depende de: —
  - Archivos: `web/src/lib/decision.ts`, `web/src/components/aportes/decision.tsx`, tests
- [x] **T19 · XS** · Filtros de la URL sin resultados (O-2)
  - Cubre: RF-08, RF-10 · CA-10.1, CA-12.1
  - Prueba primero (RED): `filtros.test.tsx`. Un valor elegido que no tiene proyectos con los demás filtros aparece marcado con «(0)» y se puede desmarcar. Hoy no aparece.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/components/mapa/filtros.tsx`, test

### Correcciones de la segunda corrida E2E (2026-10-21)
- [x] **T20 · S** · Tarjeta completa, sin recortes ni tapada por la atribución (F: E2E-06, E2E-23)
  - Cubre: RF-04, RF-06 · CA-04.2, CA-04.4
  - Prueba primero (RED): en `posicion-tarjeta.test.ts`, la función pura `posicionTarjeta(punto, tarjeta, marco)` deja la tarjeta dentro del marco con un margen de 8 px. La pone encima del punto si cabe y debajo si no. La centra en x sin salirse de los bordes. Si es más alta que el marco, limita su alto (`maxHeight`). En `mapa-proyectos.test.tsx`, la tarjeta no queda dentro del marco que recorta el mapa (`overflow-hidden`) ni debajo de la atribución. Hoy la función no existe y la tarjeta está dentro del marco.
  - Hecho cuando (GREEN): pruebas en verde. A 375 px la tarjeta va debajo del mapa, en el flujo de la página. En escritorio se posiciona con `posicionTarjeta`.
  - Depende de: T19
  - Archivos: `web/src/lib/posicion-tarjeta.ts`, `web/src/components/mapa/mapa-proyectos.tsx`, tests
- [x] **T21 · XS** · Sin hueco entre el punto y la tarjeta (F: E2E-23 con mouse)
  - Cubre: RF-04 · CA-04.4
  - Prueba primero (RED): en `posicion-tarjeta.test.ts`, el borde de la tarjeta se monta 6 px sobre el punto, arriba o abajo, en lugar de dejar 14 px de separación. Hoy hay un hueco que cierra la tarjeta al cruzarlo.
  - Hecho cuando (GREEN): prueba en verde. El margen de salida sube a 400 ms.
  - Depende de: T20
  - Archivos: `web/src/lib/posicion-tarjeta.ts`, `web/src/components/mapa/mapa-proyectos.tsx`, test

### Observación de la tercera corrida E2E (2026-10-21)
- [x] **T22 · XS** · Escape cierra también la tarjeta abierta con el mouse (O-8)
  - Cubre: RF-04
  - Prueba primero (RED): en `mapa-proyectos.test.tsx`, con la tarjeta abierta por el mouse y el foco en el cuerpo de la página, Escape la cierra. Hoy Escape solo se escucha dentro del mapa.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T21
  - Archivos: `web/src/components/mapa/mapa-proyectos.tsx`, test

Estimación total: 22 tareas (3 M, 12 S, 7 XS) · unas 12 h, entre el 2026-10-21 y el 2026-10-22.

**Prerrequisitos del usuario:** aplicar `0004_servicios.sql` en el SQL Editor de **pruebas**
(durante T03) y corregir los 2 textos de servicio en la `Base de datos SAEB`.

## Escenarios E2E
Se ejecutan con Playwright contra `npm run dev` conectado al proyecto **pruebas**, en
escritorio y a 375 px, con datos sembrados por el propio escenario (prefijo `e2e-`) y
borrados al final.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1 | 1. Abrir `/mapa` 2. Contar los puntos y leer la leyenda | Un punto por proyecto aprobado con coordenadas, del color de su estado según la leyenda; atribución de OpenStreetMap visible |
| E2E-02 | CA-01.2 | 1. Sembrar un proyecto `Pendiente` con coordenadas 2. Abrir `/mapa` | No aparece en el mapa ni en la tabla |
| E2E-03 | CA-02.1 | 1. Abrir `/mapa` 2. Ordenar la tabla por «Potencia [MW]» de mayor a menor | Primero el de mayor potencia; cifras con coma decimal |
| E2E-04 | CA-03.1 | 1. Sembrar un proyecto aprobado sin coordenadas 2. Abrir `/mapa` | Está en la tabla con «sin ubicación en el mapa» y no tiene punto |
| E2E-05 | CA-04.1 | 1. En escritorio, pasar el mouse sobre un punto 2. Salir del punto | La tarjeta se abre y luego se cierra |
| E2E-06 | CA-04.2 | 1. A 375 px con pantalla táctil, tocar un punto | La tarjeta se abre completa, sin desplazamiento horizontal |
| E2E-07 | CA-04.3 | 1. Solo con el teclado, llegar con Tab a un punto 2. Pulsar Escape | La tarjeta se abre con el foco y se cierra con Escape |
| E2E-08 | CA-05.1 | 1. Sembrar un proyecto de 50 MW y 195 MWh 2. Abrir su tarjeta | «50,0 MW», «195,0 MWh», «3,9 h»; sin enlaces de fuente |
| E2E-09 | CA-05.2 | 1. Abrir la tarjeta de un proyecto sin servicios | «Servicios: Sin dato»; los campos técnicos vacíos no aparecen |
| E2E-10 | CA-06.1 | 1. En una tarjeta, pulsar «Proponer corrección» | `/aportar` con tipo *Corrección* y el proyecto ya indicados |
| E2E-11 | CA-07.1 | 1. Elegir en la tabla la fila de un proyecto con coordenadas | El mapa se centra en él y su tarjeta queda abierta |
| E2E-12 | CA-08.1 | 1. Sembrar proyectos en varios departamentos y estados 2. Elegir dos departamentos y `En operación` | Solo los proyectos en operación de esos dos departamentos |
| E2E-13 | CA-08.2 | 1. Elegir un departamento 2. Abrir el filtro de municipio | Solo municipios de ese departamento, cada uno con su conteo |
| E2E-14 | CA-09.1 | 1. Aplicar un filtro 2. Contar puntos, filas, KPI «proyectos según filtros» y filas del CSV descargado | Los cuatro coinciden |
| E2E-15 | CA-10.1 | 1. Aplicar filtros 2. Copiar la URL y abrirla en otra pestaña | Mismos filtros y mismo resultado |
| E2E-16 | CA-10.2 | 1. Con filtros activos, pulsar «Limpiar filtros» | URL sin filtros; todos los proyectos aprobados |
| E2E-17 | CA-11.1 | 1. Filtrar solo `Anunciado` 2. Leer los KPI | «Instalado» no cambia; «según filtros (todos los estados)» suma solo anunciados; MW y MWh en tarjetas distintas |
| E2E-18 | CA-12.1 | 1. Aplicar filtros sin resultados | Mapa sin puntos; «Ningún proyecto cumple estos filtros»; KPI filtrados en 0 |
| E2E-19 | CA-13.1 | 1. Filtrar 2. Descargar | El CSV tiene solo esos proyectos, columna `Fuente`, licencia CC BY 4.0 y ningún correo |
| E2E-20 | CA-14.1 | 1. Proponer y aprobar en `/admin` un servicio fuera de la lista (no se puede elegir: verificar las casillas) 2. Insertar «Servicio X» directo en la base de **pruebas** 3. `importar.py --simular` y `validar_datos.py` con un CSV que lo tenga | Las casillas solo ofrecen los 3 valores; la base, la importación y el validador rechazan con el mismo mensaje |
| E2E-21 | CA-14.2 | 1. Sembrar un proyecto con dos servicios 2. Filtrar por cada uno | Aparece en ambos casos y su tarjeta lista los dos |
| E2E-23 | CA-04.4 | 1. En escritorio, pasar el mouse a un punto y moverlo a su tarjeta; pulsar «Proponer corrección» 2. A 375 px, tocar un punto y pulsar el enlace 3. Solo con el teclado: Tab hasta un punto, Enter, Tab hasta el enlace, Enter | En los tres casos se abre `/aportar` con tipo *Corrección* y el proyecto ya indicados |
| E2E-22 | RNF-01, RNF-06, RNF-07 | 1. Abrir `/mapa` a 375 px y con movimiento reducido 2. Elegir una fila | Sin desplazamiento horizontal; filtros plegados; centrado sin vuelo animado; consola sin errores |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1, CA-01.2 | T07, T11 | E2E-01, E2E-02 |
| RF-02 | CA-02.1 | T08 | E2E-03 |
| RF-03 | CA-03.1 | T08 | E2E-04 |
| RF-04 | CA-04.1, CA-04.2, CA-04.3, CA-04.4 | T11, T15, T16, T20, T21 | E2E-05, E2E-06, E2E-07, E2E-23 |
| RF-05 | CA-05.1, CA-05.2 | T06, T09 | E2E-08, E2E-09 |
| RF-06 | CA-06.1 | T09, T10, T16 | E2E-10, E2E-23 |
| RF-07 | CA-07.1 | T11, T13 | E2E-11 |
| RF-08 | CA-08.1, CA-08.2 | T05, T12, T19 | E2E-12, E2E-13 |
| RF-09 | CA-09.1 | T13 | E2E-14 |
| RF-10 | CA-10.1, CA-10.2 | T06, T13, T19 | E2E-15, E2E-16 |
| RF-11 | CA-11.1 | T06, T12 | E2E-17 |
| RF-12 | CA-12.1 | T05, T08 | E2E-18 |
| RF-13 | CA-13.1 | T13 | E2E-19 |
| RF-14 | CA-14.1, CA-14.2 | T01–T05, T18 | E2E-20, E2E-21 |
| RNF-01 | — | T12, T14 | E2E-06, E2E-22 |
| RNF-02 | — | T11, T14 | LCP (`001-lcp.spec.ts`) |
| RNF-03 | — | T08, T11, T14, T17 | E2E-07 |
| RNF-04 | — | T08, T09 | E2E-03, E2E-08 |
| RNF-05 | — | T11 | E2E-01 |
| RNF-06 | — | T11 | E2E-22 |
| RNF-07 | — | T13 | E2E-22 |
| RNF-08 | — | T11 | E2E-01 (sin llaves en la red) |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| MapLibre necesita WebGL; Chromium sin interfaz puede no tenerlo | Pruebas unitarias con `maplibre-gl` simulado; E2E con `--use-angle=swiftshader`. Si aun así falla, se reporta como no comprobable y se verifica a mano en el navegador del panel |
| MapLibre pesa ~200 kB y puede dañar el LCP | Carga diferida solo en cliente; KPI y tabla se pintan antes (T14 mide el LCP) |
| OpenFreeMap u OSM caídos o con límites | Fallo controlado: la tabla y los KPI siguen funcionando y el mapa muestra un aviso; respaldo con teselas ráster de OSM con atribución |
| 3,4 GB de RAM con `next dev` + Playwright + WebGL | 1 worker; cerrar otros procesos; correr E2E por proyecto (escritorio, luego móvil) |
| La Sheet conserva los textos viejos y la próxima importación los rechaza | Prerrequisito del usuario: corregirlos allá; el mensaje de rechazo lista los valores permitidos |
| `tipo_uso_conexion` como texto con comas (no arreglo) | Una sola función por lenguaje separa y normaliza; ningún valor de la lista puede llevar coma (regla del esquema) |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-21 | T01 | `test_servicio_fuera_de_la_lista` falló con KeyError: la columna no tenía `valores` | 2 pruebas nuevas en verde; `validar_datos.py` 0 errores con los textos convertidos | `fila_proyecto()` usaba «STN» como servicio: ahora el valor es un parámetro y por defecto va vacío. El mensaje muestra el valor completo, igual que con `enum` |
| 2026-10-21 | T03 | `test_validacion_sql`: faltaban la regla `lista` y la 0004; `rls.test.ts` (integración): la base aceptó «Servicio X» | Python 45/45 en verde. La integración queda en rojo hasta que el usuario aplique la 0004 en **pruebas** | El generador ahora escribe en la última migración (0004). `test_sql_esquemas` exige el `check` en línea solo para `enum`: `lista` se valida en el disparador. El historial registra la conversión con el editor «migración 0004 (spec 002)» |
| 2026-10-21 | T02 | Los 2 tests de `esquemas.test.ts` fallaron: no normalizaba ni rechazaba | 125/125 | `separarLista()` exportada para reutilizarla en la aprobación |
| 2026-10-21 | T04 | 3 pruebas fallaron (unión de casillas, `multiple`, `fieldset`) | 128/128 | Una casilla oculta vacía permite quitar todos los servicios. Una prueba de rechazo (CA-09.1) falló una vez por tiempo con el equipo cargado y pasó al repetir (intermitencia, no regresión) |
| 2026-10-21 | T05 | `proyectos-mapa.test.ts` no compilaba: el módulo no existía | 19/19 (junto con T06) | Los conteos de cada filtro se calculan con los demás filtros (facetas), así el municipio depende del departamento sin regla aparte. «Sin dato» también es una opción del filtro de servicios |
| 2026-10-21 | T06 | `filtros-url.test.ts` no compilaba: el módulo no existía | 19/19 | `filtrosDeConsulta` acepta `URLSearchParams` y los `searchParams` de Next |
| 2026-10-21 | T07 | `mapa-datos.test.ts` (integración): `leerProyectosMapa is not a function` | 2/2 contra **pruebas** | Se separó `leerProyectosMapa(cliente)`, que se puede probar, de `proyectosParaMapa()`, que se cachea. Se instalaron `@tanstack/react-table` 8 y `maplibre-gl` 5 |
| 2026-10-21 | T08 | No compilaba: el componente no existía | 5/5 | La fila elegida usa `--surface-tint`. La tabla se desplaza dentro de su caja en móvil, no la página |
| 2026-10-21 | T09 | No compilaba: el componente no existía | 4/4 | `enlaceCorreccion()` exportada para el mapa. kV con `valorEsCo` (13,8 kV) |
| 2026-10-21 | T10 | El tipo no llegaba prellenado | 158/158 en la suite | `/aportar` lee `tipo` y `registro` de la URL. Un tipo inválido se ignora |
| 2026-10-21 | T11 | No compilaba: el componente no existía | 9/9 con `maplibre-gl` simulado | Refactor por el lint (React Compiler): el mapa se guarda en estado y las posiciones se calculan al pintar. La tarjeta fija es la selección que controla la vista, y un clic en un punto no mueve el mapa. **En el navegador se encontraron dos fallas que las pruebas no cubren**, las dos ya corregidas. (1) El CSS de MapLibre pone `position: relative` al contenedor y lo dejaba con 0 px de alto, sin mapa base: ahora usa `size-full`. (2) Las tarjetas de los puntos del norte se cortaban: ahora se abren hacia el lado con más espacio. El encuadre usa los límites de Colombia (`bounds`) en lugar de un zoom fijo |
| 2026-10-21 | T12 | No compilaba: los componentes no existían | 7/7 | La prueba cuenta solo los `fieldset`, porque `<details>` también tiene el rol `group`. En móvil, el panel se pliega cambiando el DOM y no con `setState`, por el lint |
| 2026-10-21 | T13 | No compilaba: la vista no existía. Además, `secciones.test` seguía esperando «en construcción» | 6/6 en la vista; 180/180 en la suite | La URL se lee con `useSyncExternalStore` (al hidratar no hay filtros, así el HTML coincide) y se escribe con `history.replaceState`. **Desviación de T07:** `leerProyectosMapa` trae todas las columnas públicas del CSV, porque la descarga filtrada (RF-13) necesita la `Fuente`. Su prueba de integración se ajustó primero (RED) y luego pasó. `csv.ts` importa `columnaSql` de `columnas.ts` para no cargar `decision.ts` en el navegador |
| 2026-10-21 | T14 | La prueba axe de la vista, la tarjeta y el mapa se escribió después de T13 y **pasó de entrada**: no hubo RED real. Se deja como regresión | 183/183. LCP de `/mapa` con build local y 4G lenta: 2108, 1144 y 1156 ms (mediana 1,16 s) | **`npm run build` falló** en `/aportar` por leer `searchParams` fuera de `<Suspense>` (T10; las pruebas unitarias no lo detectan). Se corrigió con un `Suspense` que muestra el formulario sin prellenar mientras se lee la URL. El build pasa: `/mapa` es estática con revalidación de 5 min |
| 2026-10-21 | T03 (cierre) | — | El usuario aplicó la 0004 en **pruebas**. Integración 28/28, con «Servicio X» rechazado con el mismo mensaje. `importar.py --simular`: 7 válidos. La base tiene los 3 valores de la lista y Canadian solar queda vacío | — |
| 2026-10-21 | T15 | Con `touchstart → mouseenter → mouseleave → click` la tarjeta se abría con el *mouseenter* simulado y se cerraba con el *mouseleave* | 36/36 en el mapa | Durante 800 ms después de un toque se ignoran los eventos de mouse que el navegador simula. La tarjeta solo se abre con el toque (clic) |
| 2026-10-21 | T16 | 3 pruebas: la tarjeta se cerraba al pasar del punto a ella, Enter no movía el foco y el *blur* hacia el enlace la cerraba | 36/36 | 250 ms de margen para pasar el mouse del punto a la tarjeta. Enter (clic con `detail` 0) deja la tarjeta abierta y enfoca el diálogo (`tabIndex -1`). Un *blur* hacia la tarjeta no la cierra. **CA-04.1 ajustado:** la prueba espera el cierre (`waitFor`) en lugar de comprobarlo al instante |
| 2026-10-21 | T17 | El contenedor tenía `aria-hidden` y no se pasaba `locale` | 36/36 | Se quitó `aria-hidden`. Los controles de MapLibre están en español y el lienzo se llama «Mapa de los proyectos de almacenamiento» |
| 2026-10-21 | T18 | 2 pruebas: no había aviso y la etiqueta era «Tipo uso/conexión» | 190/190 | `etiqueta: "Servicios"` en `datos/esquemas.json` (fuente única; el validador la ignora). Los valores fuera de la lista se avisan con `role="status"` |
| 2026-10-21 | T19 | El valor elegido sin resultados no aparecía | 191/191; `npm run build` correcto | Los valores elegidos que no tienen proyectos se muestran con «(0)» al final de su filtro |
| 2026-10-21 | T20, T21 | `posicion-tarjeta.test.ts` no compilaba y la tarjeta estaba dentro del marco que recorta el mapa | 197/197 | La tarjeta salió del marco: en escritorio se posiciona con `posicionTarjeta` y se monta 6 px sobre el punto; en móvil va debajo del mapa. Margen de salida de 400 ms. Revisión en Chromium sin interfaz (Playwright, WebGL por software): con el mouse en escritorio y con el toque a 375 px, «Proponer corrección» queda visible y sin nada encima en los 7 puntos (14/14), sin desplazamiento horizontal. La primera revisión no encontró los puntos porque el selector `button[aria-expanded]` coincidía con el indicador de Next (solo en desarrollo) |
| 2026-10-21 | T22 | Con la tarjeta abierta por el mouse, Escape en el cuerpo de la página no la cerraba | 198/198; `npm run build` correcto | Mientras hay una tarjeta abierta, Escape se escucha en todo el documento. Esto reemplaza el `onKeyDown` del contenedor |

## Informe E2E
[e2e-informe.md](e2e-informe.md): tercera corrida del 2026-10-21, 23/23 escenarios en verde. Hubo 3 RNF no comprobables desde fuera: RNF-02 se midió aparte, con una mediana de 1,16 s; RNF-05 y RNF-08 se confirman en el código. O-8 se corrigió con T22. Cerrada con la aprobación del usuario.
