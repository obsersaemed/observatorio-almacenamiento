# Bitacora del proyecto - Observatorio de Vehiculos

Registro de decisiones, hallazgos y avances. Se actualiza en cada sesion de trabajo.

---

## 2026-09-19 - Sesion 1

### Objetivo
Extraer informacion de una pagina web y cargarla a una base de datos en Google Sheets,
con corrida trimestral (manual o automatica).

### Entorno
- Python 3.12.10, pip 25.0.1 (instalacion de usuario en Windows 11).
- Carpeta de trabajo: `OneDrive/Documentos/VSC/Observatorio/Vehiculos` (sin control de versiones).

### Andamiaje creado
Pipeline en tres etapas desacopladas: `scraper -> normalizador -> sink`.

| Ruta | Rol |
|---|---|
| `src/fetch.py` | Descarga con reintentos + backoff, corrige encoding, guarda snapshot en `data/raw/<fecha>/` |
| `src/parse.py` | HTML -> filas (`extraer_tablas` via pandas, o `extraer_por_selector` con CSS) |
| `src/normalizar.py` | snake_case sin tildes, `a_numero()` para formato `1.234.567,89`, agrega `periodo`/`fuente`/`id_fila` |
| `src/sinks.py` | `a_csv()` operativo; `a_google_sheets()` escrito con upsert por periodo |
| `src/main.py` | CLI que orquesta el pipeline |

**Decisiones de diseno:**
1. *Snapshot obligatorio del HTML crudo antes de parsear.* Con cadencia trimestral, si el
   sitio cambia de estructura no hay forma de recuperar el dato de hace tres meses. El
   crudo permite reparsear el historico sin volver a la web.
2. *CSV como salida primaria, Sheets como sink secundario.* El scraping funciona sin
   depender de resolver la autenticacion de Google.
3. *Carga idempotente.* Cada fila lleva `periodo` + `id_fila` (hash) para que reejecutar
   un trimestre reemplace en vez de duplicar.

### Hallazgo critico: la URL entregada no es HTML estatico

URL recibida:
`https://datastudio.google.com/reporting/ceb8deeb-3b00-4e08-8536-5a0f2ebb5cf2/page/p_20yns98e0d`

Verificacion hecha (descarga directa con curl, HTTP 200, 76 KB):

| Comprobacion | Resultado |
|---|---|
| Etiquetas `<table>` en el HTML | **0** |
| `<title>` | `INFORMES INTERACTIVOS ANDEMOS` |
| `datasourceId` hallado | `0B_U5RNpwhcE6MUZMMVZWaEVJTVE` = *[Sample] World Population Data*, el dataset de ejemplo de Google, **no** el del reporte |
| Datos del reporte en el HTML | Ninguno |

**Conclusion:** es un reporte de Looker Studio (ex Data Studio), una SPA. El HTML que
llega es solo el cascaron de la aplicacion; los datos se piden despues por POST al
endpoint interno `batchedDataV2` una vez arranca el JavaScript.
=> `requests` + `BeautifulSoup` **no sirven** para esta fuente. El andamiaje de
`parse.py` sigue siendo util, pero la etapa de `fetch` debe cambiar.

### Contexto de la fuente
- ANDEMOS = Asociacion Nacional de Movilidad Sostenible (Colombia).
- Sus informes se construyen sobre datos del **RUNT**, procesados por ANDEMOS.
- El acceso a los informes interactivos pasa por un formulario de registro
  (`https://www.andemos.org/pbi-informes`).
- ANDEMOS prohibe expresamente la reventa, comercializacion o publicacion en canales
  de terceros de esa informacion. **Punto a validar con el area juridica / el
  Observatorio antes de publicar resultados derivados.**

### Fuente alternativa encontrada y verificada
Portal de Datos Abiertos de Colombia, dataset **`u3vn-bdcy`**
("CRECIMIENTO DEL PARQUE AUTOMOTOR RUNT2.0", MinTransporte).

Prueba ejecutada contra la API Socrata:
```
GET https://www.datos.gov.co/resource/u3vn-bdcy.json?$limit=2
GET https://www.datos.gov.co/resource/u3vn-bdcy.json?$select=count(*)
```
- Respondio correctamente. **191.640 filas.**
- Ultima publicacion observada en los datos: agosto de 2026.
- Campos: `nombre_departamento`, `nombre_municipio`, `nombre_servicio`,
  `estado_del_vehiculo`, `nombre_de_la_clase`, `fecha_de_registro`, `cantidad`,
  `mes_de_publicacion`, `a_o_de_publicacion`.

**Diferencia importante frente a ANDEMOS:** este dataset es *parque automotor* (stock)
desagregado por clase, servicio y municipio, y **no trae marca ni linea de vehiculo**.
Si el Observatorio necesita detalle por marca/modelo, este dataset no reemplaza a ANDEMOS.

### Decision pendiente
Elegir la ruta de extraccion (ver seccion siguiente).

### Proximos pasos
- [ ] Definir si la fuente sera ANDEMOS (Looker Studio) o datos.gov.co (o ambas).
- [ ] Si es ANDEMOS: implementar extraccion con navegador automatizado (Playwright).
- [ ] Definir metodo de autenticacion de Google Sheets (cuenta de servicio vs OAuth).
- [ ] Automatizar la corrida trimestral.

---

## 2026-09-19 - Sesion 1 (continuacion): ruta ANDEMOS confirmada

### Decision tomada
Se extrae de **ANDEMOS via Playwright**, porque el Observatorio necesita detalle por
**marca y linea de vehiculo**, que el dataset del RUNT en datos.gov.co no ofrece.
`u3vn-bdcy` queda documentado como respaldo agregado, no como fuente principal.

### Hallazgos de la exploracion con navegador

Ejecutado: `python src/explorar_looker.py --url "<reporte>" --espera 40000`

1. **`wait_until="networkidle"` no sirve.** Looker Studio mantiene trafico abierto de
   forma indefinida y el goto expira a los 90 s. Se cambio a `domcontentloaded` mas una
   espera fija. Anotado porque es el primer tropiezo que reaparece al retomar.
2. **El reporte es publico.** No pidio login ni el formulario de registro de
   `andemos.org/pbi-informes`. El titulo real es
   `INFORMES INTERACTIVOS ANDEMOS - Vehiculos 2026`.
3. **Se capturaron 7 respuestas de datos**, todas contra
   `https://datastudio.google.com/batchedDataV2?appVersion=20260914_0100`,
   entre 2,5 KB y 71 KB.
4. **Formato de las respuestas:** JSON precedido por el prefijo anti-XSSI `)]}'`.
   Estructura: `dataResponse[] -> dataSubset[] -> dataset.tableDataset`, con
   `columnInfo` (nombres opacos tipo `qt_1jebk9af0d`), `column` (orientado por
   columna, no por fila; nulos aparte en `nullIndex`) y `totalCount`.
5. **Hay datos de linea de vehiculo**: una de las respuestas trae 1.660 valores
   (`Bz4X`, `114Sd`, `118 I`, `1500`, ...). Confirma que el detalle que se necesita
   esta disponible por esta via.

### Modulos nuevos
| Ruta | Rol |
|---|---|
| `src/explorar_looker.py` | Abre el reporte en Chromium e intercepta/guarda las respuestas de `batchedDataV2` |
| `src/decodificar_looker.py` | Convierte esas respuestas en DataFrames (transpone la orientacion por columna y reinserta nulos) |

### Deuda tecnica conocida
- Los nombres de columna son **identificadores opacos** (`qt_1jebk9af0d`), no nombres
  de negocio. Falta mapearlos a `marca`, `linea`, `mes`, etc.
- `playwright` quedo instalado pero **no esta en `requirements.txt`**.

### Proximos pasos
- [ ] Mapear los identificadores `qt_*` a nombres de campo legibles.
- [ ] Recorrer todas las paginas/pestanas del reporte, no solo `p_20yns98e0d`.
- [ ] Agregar `playwright` a `requirements.txt`.
- [ ] Definir metodo de autenticacion de Google Sheets.

---

## 2026-09-19 - Mapa del reporte (pagina `p_20yns98e0d`)

Decodificadas las 7 respuestas capturadas. El reporte mezcla **listas de filtros**
(valores para los desplegables) con **tablas de datos** reales.

### Tablas de datos utiles

| Origen | Contenido | Filas |
|---|---|---|
| `resp_006` t1 | **linea + marca + acumulado ano anterior + acumulado ano actual + variacion** | 1.679 (solo llegaron 1.000) |
| `resp_007` t0 | marca + acumulados + variacion | 144 |
| `resp_007` t2 | categoria (Utilitario, Automovil, Carga <10,5T, Pick Up, Van, Taxi...) + acumulados + variacion + dos participaciones | 14 |
| `resp_004` t0 | combustible (Gasolina, Hibrido, Electrico, Diesel, Gnv, Gas Convertido) + acumulados | 7 |
| `resp_004` t2 | ciudad (Bogota, Medellin, Envigado, Cali...) + acumulados | 281 |
| `resp_001` t1 | serie mensual (mes 1-12) + acumulados + variacion | 8 |

### Listas de filtros (no son datos, son los desplegables)
Clase (14), departamento (32), municipio (281), combustible (7), marca (144),
linea (1.660), mes (12), `Marcas Premium / No Marcas Premium`,
`Vehiculos Combustibles Fosiles / Vehiculos Hibridos Y Electricos`.

### Cifras de control
Totales que se repiten en casi toda respuesta y sirven para **validar cada corrida**:
- Acumulado ano anterior: **150.263**
- Acumulado ano actual: **213.704**
- Variacion: **0,4222** (42,2 %)

Si una extraccion futura no cuadra con el total de su propio periodo, algo se rompio.

### Problema detectado: paginacion a 1.000 filas
La tabla de marca+linea declara `totalCount: 1679` pero la respuesta trae **1.000
valores**. Looker Studio pagina. Extraer solo lo que llega en la carga inicial
**perderia 679 filas (40 %)** sin ningun error visible. Hay que resolverlo por scroll
en la tabla o replicando la peticion con desplazamiento de filas.

### Segundo problema: nombres de columna opacos
Los identificadores (`qt_gjv504af0d`, ...) **cambian entre versiones del reporte**, asi
que no se pueden fijar por nombre. Hay que identificar las columnas por posicion y por
el contenido (tipo de dato y valores de muestra), y validar contra las cifras de control.

### Proximos pasos
- [ ] Resolver la paginacion de 1.000 filas (bloqueante: sin esto el dato sale incompleto).
- [ ] Mapear columnas por posicion/contenido en vez de por identificador.
- [ ] Recorrer las demas paginas del reporte, no solo `p_20yns98e0d`.
- [ ] Agregar `playwright` a `requirements.txt`.
- [ ] Definir autenticacion de Google Sheets.

---

## 2026-09-19 - Decodificador verificado y bug corregido

### Bug encontrado y corregido: reinsercion de nulos
La primera version de `_valores()` en `src/decodificar_looker.py` **sobrescribia**
valores reales en las posiciones de `nullIndex`. Era corrupcion silenciosa: no lanzaba
ningun error, pero desalineaba las columnas numericas contra marca/linea.

Semantica real, comprobada sobre la tabla marca+linea:
```
qt_gjv504af0d (linea):  valores=1000  nulos=0     suma=1000
qt_hjv504af0d (marca):  valores=1000  nulos=0     suma=1000
qt_jru504af0d (ano-1):  valores=649   nulos=351   suma=1000
qt_kru504af0d (actual): valores=1000  nulos=0     suma=1000
qt_lru504af0d (variac): valores=649   nulos=351   suma=1000
```
`values` trae **solo los no nulos**; `nullIndex` dice en que filas va vacio. Los nulos
se **insertan**, no se sobrescriben. Corregido y anotado en el docstring de la funcion.

### Validacion cruzada (quedo como prueba de cada corrida)
Sumando la columna de acumulado del ano actual de la tabla por marca:
**213.704**, identico a la cifra de control del reporte. La decodificacion es correcta.
Esta comprobacion debe ejecutarse en cada extraccion futura.

### Correccion a lo anotado antes
El `El?ctrico` que se veia en consola **no es corrupcion de datos**: los bytes son
`Ã©` = `e` acentuada, UTF-8 correcto. Era la consola de Windows. No hay nada que arreglar.

### Entorno: dos tropiezos reales
1. `pip install` fallo con `OSError: access violation writing 0x48` al descargar pandas.
   Fue un problema de red transitorio del entorno; reintentar resolvio.
2. La version instalada de pandas es **3.0.6**, no la 2.2.3 que se habia fijado a ciegas
   en `requirements.txt`. El archivo ya refleja las versiones realmente verificadas.

### Estado de `requirements.txt`
Actualizado con `pandas==3.0.6` y `playwright==1.56.0`, mas la nota de que hay que
correr `python -m playwright install chromium` despues de instalar.

### Proximos pasos
- [ ] **Resolver la paginacion de 1.000 filas** (bloqueante: faltan 679 de 1.679).
- [ ] Mapear columnas por posicion/contenido en vez de por identificador `qt_*`.
- [ ] Recorrer las demas paginas del reporte, no solo `p_20yns98e0d`.
- [ ] Definir autenticacion de Google Sheets.

---

## 2026-09-19 - Via RUNT / datos.gov.co evaluada e implementada

### Pregunta: se puede bajar todo desde el RUNT y evitar el scraping?
Se reviso el catalogo completo de datos.gov.co (14 datasets con "RUNT" mas busquedas
por "vehiculos matriculados" y "parque automotor").

**Respuesta: no para marca/linea.** Ningun dataset abierto del RUNT publica marca ni
linea a nivel nacional. Detalle de lo revisado:

| Dataset | Marca? | Veredicto |
|---|---|---|
| `u3vn-bdcy` Crecimiento parque automotor RUNT2.0 | No | **Util**: 191.640 filas, nacional, mensual |
| `ntxy-q9ix` Electricos e hibridos matriculados | No | Util para el eje de transicion energetica |
| `bj7e-xc9g` "Vehiculos matriculados 2020-2022" | Si | **Descartado**, ver abajo |
| `6jmc-vaxk` Vehiculos en accidentes | Si | Otro dominio (siniestralidad) |
| `fvnt-frpb` Parque automotor activo/inactivo | Si | Alcance local, no nacional |

**Por que se descarto `bj7e-xc9g`** (el unico nacional con marca): el titulo dice
"enero 2020 a mayo 2022", pero al agrupar por ano cubre **2000-2022 con ~700 filas
por ano** (16.943 en total). Colombia matricula cientos de miles de vehiculos al ano.
El dataset esta mal rotulado y no tiene cobertura nacional. **No sirve.**

> Trampa detectada: `min()/max()` sobre `fecha_matricula_radicacion` devuelve
> "01/01/2000" a "31/12/2003" porque la fecha esta guardada como **texto dd/mm/yyyy**
> y Socrata la ordena alfabeticamente. Hay que agrupar por el campo `a_o` para conocer
> el rango real. Aplica a cualquier dataset de datos.gov.co con fechas en texto.

**Conclusion: se confirma la decision anterior.** ANDEMOS sigue siendo la unica fuente
para marca y linea; el RUNT entra como complemento territorial y de validacion.

### Modulo nuevo: `src/runt.py`
Conector Socrata, sin scraping ni navegador.
```
python src/runt.py --listar
python src/runt.py --dataset u3vn-bdcy
python src/runt.py --dataset u3vn-bdcy --where "nombre_departamento='ANTIOQUIA'"
```
- Pagina con `$limit`/`$offset` en lotes de 50.000.
- Ordena por `:id`: **sin un orden estable la paginacion puede repetir u omitir filas**
  entre peticiones. Mismo riesgo que en Looker Studio, distinta causa.
- Compara el total descargado contra `count(*)` y avisa si no cuadra.

### Prueba ejecutada (descarga real completa)
`u3vn-bdcy`: **191.640 / 191.640 filas**, 0 duplicadas, 9 columnas.
- Parque automotor total: **22.496.860** vehiculos (cifra plausible para Colombia).
- Top clases: Motocicleta 14.402.448 | Automovil 4.052.258 | Camioneta 2.144.479.
- Cobertura: 32 departamentos, **288 municipios**.
- `fecha_de_registro` va de 1900 a 2026 (serie historica de registro).

### Dos limitaciones del dataset del RUNT, a tener presentes
1. **Es una foto, no una serie.** Todas las filas son de publicacion `AGOSTO 2026`. El
   portal reemplaza el snapshot cada mes, asi que **la serie historica de publicaciones
   hay que construirla acumulando descargas**. Un motivo mas para guardar cada corrida.
2. **288 municipios**, no los ~1.100 del pais: solo aparecen los que tienen organismo
   de transito. No es cobertura municipal completa.

### Proximos pasos
- [ ] **Resolver la paginacion de 1.000 filas en ANDEMOS** (bloqueante para marca/linea).
- [ ] Mapear columnas `qt_*` por posicion/contenido.
- [ ] Recorrer las demas paginas del reporte ANDEMOS.
- [ ] Definir autenticacion de Google Sheets.

---

## 2026-09-20 - Sesion 2: ANDEMOS filtrado a hibridos y electricos (marca + linea)

Objetivo: extraer de ANDEMOS solo las tablas que traen **marca y linea en la misma
tabla**, filtradas a vehiculos hibridos y electricos. Script nuevo: `src/andemos.py`.

### El control de filtro del reporte
El reporte expone un boton `BUTTON.lego-control` con la etiqueta `HIBRIDOS Y ELECTRICOS`.
Al pulsarlo despliega tres `md-checkbox`: *(seleccionar todas)*, *Vehiculos Combustibles
Fosiles* y *Vehiculos Hibridos Y Electricos*. Se llega a el asi:

    pag.get_by_text("HIBRIDOS Y ELECTRICOS", exact=False).locator(
        "xpath=ancestor::button[contains(@class,'lego-control')][1]")

### Dos errores que costaron una corrida cada uno

**1. El filtro se aplicaba invertido.** Se leyo el estado de las tres casillas UNA vez
y se planificaron los clics sobre esa lectura. Pero destildar *(seleccionar todas)*
desmarca tambien las demas, asi que el clic siguiente sobre *Combustibles Fosiles* la
**volvia a marcar**: el resultado fue el complemento exacto de lo buscado.
Se detecto por aritmetica: la suma daba 116.506 = 213.704 - 97.198, o sea combustion.
Correccion: releer el estado **despues de cada clic** y validar el estado final antes
de continuar.

**2. Se elegia la tabla sin filtrar.** El reporte pide los mismos datos al cargar y otra
vez al aplicar el filtro, asi que la captura contiene ambas versiones. El criterio
"quedarse con la tabla mas grande" premiaba la version SIN filtrar, que tiene mas filas.
Correccion: `indice.json` guarda la fase (`inicial` / `filtrada`) de cada respuesta;
se descartan las previas al filtro.

### Como se identifican las columnas
Looker ofusca los nombres (`qt_gjv504af0d`), asi que **se reconocen por contenido**:
se compara cada columna contra `config/vocabulario_andemos.json` (144 marcas y 1.660
lineas extraidas de la captura del 2026-09-19). Discrimina limpiamente: la columna de
linea da 100% contra la lista de lineas y 0% contra la de marcas.

Las metricas se etiquetan por posicion (`acum_2025`, `acum_2026`, `variacion`) y el
orden **se verifica con aritmetica**: `variacion == (acum_2026 - acum_2025) / acum_2025`.

### Resultado verificado
Tabla `resp_012_t0`: **799 / 799 filas** (totalCount completo), 104 marcas, 790 lineas.
- Suma acumulados: **2025 = 49.774** y **2026 = 97.198**.
- Coinciden **exactamente** con Hibrido (39.099 -> 63.270) + Electrico (10.675 -> 33.928)
  de la tabla por combustible del propio reporte. Desvio cero.
- `comprobar_filtro()` confirma que en la captura solo aparecen `electrico` e `hibrido`.
- Top marcas 2026: Tesla 14.126 | Toyota 10.528 | Suzuki 9.934 | Kia 8.746 | Byd 8.137.

### La paginacion de 1.000 filas dejo de ser bloqueante
Sin filtrar, la tabla marca+linea declara `totalCount: 1679` y solo llegan 1.000. **Con
el filtro aplicado son 799 y llegan las 799**, asi que para hibridos y electricos el
problema no se presenta. Sigue pendiente si alguna vez se quiere la tabla completa.

### Proximos pasos
- [ ] Paginacion de Looker, solo si se necesita la tabla sin filtrar (>1.000 filas).
- [ ] Recorrer las demas paginas del reporte ANDEMOS (son 10).
- [ ] Revisar la licencia de ANDEMOS antes de publicar estos datos en un dashboard.

---

## 2026-10-01 - Sesion 3: dashboard web de almacenamiento en VE

### Insumos
- Diseno: `../Obs vehiculos/Observatorio TEJ Design System/ui_kits/observatorio-ve/` (Claude Design).
- Panel original de Looker: `uploads/Vehiculos_Electricos.pdf` dentro del design system.
- Datos: hoja de Google **`VEHICULOS_ELECTRICOS`** (id `1THqOYEPpG5Dr6NWFvDFZV0CR_evvM7sGOIAg2uLI-NA`,
  propietario fevelezf@unal.edu.co, compartida). 49 lineas: ventas 2024/2025/2026, tipo de bateria,
  capacidad min/max, potencia y kWh. Copia en `data/raw/sheet_vehiculos_electricos/2026-10-01_*.csv`.

### Hallazgos
1. **El `data.js` del diseno inventaba el reparto por ano** de cada marca (porcentajes fijos). Ejemplo:
   Tesla salia 38/42/20 % en 2024/25/26; el dato real es 0 / 21 / 7.739 (entro en 2026).
2. **Los filtros del diseno escalaban totales** (p. ej. linea = total / numero de lineas). Se reemplazo
   por filtrado real de filas.
3. **"LFP 85,2 %" del panel original es solo 2025**, aunque se presenta como total. Sobre 2024-2026:
   LFP 67,5 % | Lithium-ion 29,7 % | NMC 2,2 % | ULTIUM 0,6 %.
4. **"Potencia acumulada" sumaba las capacidades de ficha de cada modelo** (LFP 1.261 = 26 modelos x
   ~48 kWh). No mide nada del parque. Se reemplazo por **energia almacenada por tecnologia**
   (vehiculos x capacidad promedio): LFP 1,54 M kWh, Li-ion 791 mil, NMC 70 mil, ULTIUM 21 mil.
5. Controles que cuadran: 45.346 vehiculos y 2.426.467 kWh (= panel original 45,3 mil y 2,4 M);
   total = suma de anos en las 49 filas; kWh = total x capacidad promedio en las 49 filas.

### Pendiente de validar con el equipo
- La base incluye **hibridos enchufables** (Song plus dm-i, Qin plus dmi, 330e, X5 xdrive50e,
  Xc60, Xc90, X3 xdrive30e). Si el observatorio es solo de electricos puros, hay que sacarlos.
- **"Byd song plus dm-i" y "Song plus dmi"** parecen la misma linea escrita distinto.
- Origen de las ventas por linea: si viene de ANDEMOS, aplica la restriccion de publicacion ya anotada.

### Implementacion
| Ruta | Rol |
|---|---|
| `dashboard/index.html` | Pagina; React UMD de produccion, sin Babel en el navegador |
| `dashboard/app.js` | Dashboard en JS plano (`React.createElement`) sobre componentes del design system |
| `dashboard/datos.js` | Generado; no editar a mano |
| `dashboard/ds/` | Copia de `styles.css`, `tokens/`, `_ds_bundle.js` y el mapa de marca |
| `src/dashboard_datos.py` | CSV de la hoja -> `datos.js`, con las validaciones de arriba |

Verificado en navegador: sin errores de consola; filtro Tesla = 7.760 vehiculos y 538.569 kWh
(coincide con el CSV); en movil (375 px) sin desborde horizontal.

Para actualizar: exportar la hoja a CSV (separador `;`) y correr
`python src/dashboard_datos.py <csv> --corte AAAA-MM-DD`.

### Guia de Looker Studio (el dashboard tambien va en Looker)
- `GUIA_LOOKER_VE.md` -> `Guia_Looker_Studio_VE.docx` (7 paginas), con el conversor `../BESS/md2docx.py`
  (ahora acepta `--antetitulo` y `--pie`):
  `python ../BESS/md2docx.py GUIA_LOOKER_VE.md Guia_Looker_Studio_VE.docx --antetitulo "..." --pie "..."`
- Incluye las correcciones de esta sesion, valores esperados para verificar y el campo opcional
  `Propulsion` para excluir hibridos enchufables si el equipo lo decide.
- La pagina web de `dashboard/` queda como referencia funcional del diseno corregido.
