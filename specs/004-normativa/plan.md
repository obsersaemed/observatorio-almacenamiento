# 004 · Evolución normativa — Plan

Estado: Terminado
Fecha: 2026-10-24
Spec: [spec.md](spec.md)

## Enfoque técnico
La página `/normativa` lee de Supabase las normas aprobadas con la misma caché por etiqueta
que `/mapa` y `/vehiculos`. La etiqueta es `normas`, y `/admin` ya la revalida al aprobar
un aporte de tipo *Norma*. La lógica pura va en `web/src/lib/normativa.ts` con pruebas
unitarias:
- orden;
- grupos por año;
- separación entre la línea de tiempo y los documentos de referencia;
- filtros con conteo;
- años visibles;
- normas relacionadas.

Los componentes son de cliente: tarjeta, línea de tiempo, barra de años, filtros, sección
de referencia y vista. La vista se arma como en `/vehiculos`.

**Qué se reutiliza:**
- `DesplegableFiltro` y el patrón de filtros de `/mapa`.
- `useFiltrosUrl` y `descargarTexto`.
- `csvDe("normativa", …)` y la licencia de las descargas.
- `formatoFecha`.
- El enlace «Proponer corrección» de la 002.
- La cola de aportes y la aprobación en `/admin` de la 001.
- `scripts/proponer_aporte.py` para la carga inicial.

No hay librerías nuevas. Los colores de entidad salen de los tokens TEJ.

**Carga inicial:** cada norma se redacta a partir de su documento oficial, con la skill
`ficha-normativa`, como una propuesta JSON en `specs/004-normativa/propuestas/`. Una
prueba de Python valida las propuestas contra `datos/esquemas.json`: id con formato,
enlace oficial, relaciones existentes y sin duplicados. Después se envían a la base de
pruebas como aportes `Pendiente` y el usuario las aprueba en `/admin`.

**Datos de los E2E:** los E2E siembran normas ficticias marcadas como prueba y las borran
al final, como en la 006. Así no dependen de que la carga real esté aprobada.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `datos/esquemas.json` | Modificar | Emisor «Academia» y tipo «Estudio» (aclaración 1) |
| `supabase/migrations/0006_normativa.sql` | Crear | Mismos valores en las restricciones y en los triggers de validación de `normas` |
| `pruebas/test_validar_datos.py`, `pruebas/test_validacion_sql.py` | Modificar | Los valores nuevos son válidos en Python y en SQL |
| `web/src/lib/normativa.ts` (+ `.test.ts`) | Crear | Orden, años, filtros, conteo, referencia y relacionadas |
| `web/src/lib/datos-publicos.ts` | Modificar | `normasPublicas()` con caché y etiqueta `normas` |
| `web/src/components/normativa/tarjeta-norma.tsx` (+ test) | Crear | Tarjeta plegada y desplegada (RF-04, 05, 06, 15) |
| `web/src/components/normativa/linea-tiempo.tsx` (+ test) | Crear | Grupos por año, alternancia y navegación a relacionadas |
| `web/src/components/normativa/barra-anios.tsx` (+ test) | Crear | Salto al año (RF-03) |
| `web/src/components/normativa/filtros-normativa.tsx` (+ test) | Crear | Entidad, tipo, estado y año (RF-07) |
| `web/src/components/normativa/documentos-referencia.tsx` (+ test) | Crear | Estudios académicos (RF-12) |
| `web/src/components/normativa/vista-normativa.tsx` (+ test) | Crear | URL, conteo, vacío, CSV y composición |
| `web/src/app/normativa/page.tsx` | Modificar | Reemplaza «Sección en construcción» |
| `web/src/components/a11y.test.tsx` | Modificar | axe sobre la vista de normativa |
| `specs/004-normativa/propuestas/*.json` | Crear | Carga inicial redactada desde los documentos oficiales |
| `pruebas/test_propuestas_normativa.py` | Crear | Valida las propuestas antes de enviarlas |
| `web/e2e/004-normativa.spec.ts` | Crear | Escenarios E2E con datos sembrados |

## Cambios de datos
- **Esquema:** `normas.emisor` admite «Academia» y `normas.tipo` admite «Estudio». No hay
  columnas nuevas. La migración 0006 se genera con `scripts/generar_validacion_sql.py` y
  el usuario la aplica en el SQL Editor del proyecto de pruebas (y luego en el principal).
- **Validación:** se aplican las mismas reglas en `esquemas.json`, en zod (sale del mismo
  esquema) y en las restricciones y triggers SQL.
- **Importación y pruebas:** las propuestas entran por `proponer_aporte.py` (tipo *Norma*,
  origen *agente*, agente `ficha-normativa`). Al aprobarlas, `/admin` las copia a `normas`
  y el respaldo diario las escribe en `datos/normativa.csv`.

## Tareas
- [x] **T01 · S** · Emisor «Academia» y tipo «Estudio» en el esquema y en SQL
  - Cubre: RF-12 (datos), aclaración 1
  - Prueba primero (RED): en `pruebas/test_validar_datos.py`, una fila de normativa con
    emisor «Academia» y tipo «Estudio» es válida; en `pruebas/test_validacion_sql.py`, el
    SQL generado los acepta. Hoy fallan porque los enums no los tienen.
  - Hecho cuando (GREEN): pasan las dos pruebas y `esquemas.test.ts`; existe `0006_normativa.sql`.
  - Depende de: —
  - Archivos: `datos/esquemas.json`, `supabase/migrations/0006_normativa.sql`, pruebas de Python
- [x] **T02 · XS** · Verificar la 0006 aplicada en la base de pruebas
  - Cubre: RF-12, RF-14
  - Prueba primero (RED): prueba de base de datos (Vitest, proyecto «pruebas») que inserta
    una norma con emisor «Academia» y la borra. Falla hasta que el usuario aplique la 0006.
  - Hecho cuando (GREEN): la inserción pasa y una norma con emisor inventado la rechaza el trigger.
  - Depende de: T01 (y que el usuario aplique la migración)
  - Archivos: `web/src/lib/normativa-bd.test.ts`
- [x] **T03 · M** · Lógica de la línea de tiempo
  - Cubre: RF-01, RF-02, RF-03, RF-07, RF-09, RF-10, RF-12 · CA-01.1, CA-01.2, CA-02.1,
    CA-03.2, CA-07.1, CA-07.2, CA-09.1, CA-10.1, CA-12.1, aclaración 5
  - Prueba primero (RED): `web/src/lib/normativa.test.ts` cubre:
    - orden de la más reciente a la más antigua, y con la misma fecha por entidad y número;
    - grupos por año;
    - «Estudio» fuera de la línea de tiempo;
    - filtros por entidad, tipo, estado y año, con su conteo;
    - años visibles según los filtros;
    - «1 norma» y «3 normas»;
    - relacionadas con y sin publicar.

    Hoy falla porque el módulo no existe.
  - Hecho cuando (GREEN): pasan todas.
  - Depende de: —
  - Archivos: `web/src/lib/normativa.ts`
- [x] **T04 · S** · Lectura pública de normas
  - Cubre: RF-13, RF-16 · CA-13.1, CA-16.1
  - Prueba primero (RED): prueba de `normasPublicas()` con un cliente simulado: solo pide
    `publicacion = Aprobado` y usa la etiqueta `normas`. Hoy falla porque no existe.
  - Hecho cuando (GREEN): pasa, y la etiqueta coincide con la que revalida `/admin`.
  - Depende de: T03
  - Archivos: `web/src/lib/datos-publicos.ts`, su prueba
- [x] **T05 · M** · Tarjeta de norma
  - Cubre: RF-04, RF-05, RF-06, RF-15, RNF-02, RNF-04, RNF-07 · CA-04.1, CA-04.2,
    CA-05.1, CA-05.2, CA-05.3, CA-06.2, CA-15.1
  - Prueba primero (RED): `tarjeta-norma.test.tsx` comprueba:
    - plegada: fecha dd/mm/aaaa, entidad en texto, tipo y número, título, estado y resumen;
    - el color de la entidad sale de un token;
    - al desplegar con el teclado aparecen la explicación, «Aplica a», las relacionadas,
      «Ver documento oficial» (con `target=_blank` y `rel=noopener`) y «Proponer
      corrección» (enlace a `/aportar?tipo=Corrección&registro=<id>`);
    - `aria-expanded` cambia al desplegar.
  - Hecho cuando (GREEN): pasan todas.
  - Depende de: T03
  - Archivos: `web/src/components/normativa/tarjeta-norma.tsx`
- [x] **T06 · M** · Línea de tiempo y barra de años
  - Cubre: RF-02, RF-03, RF-06, RNF-01, RNF-03 · CA-02.1, CA-03.1, CA-06.1
  - Prueba primero (RED): `linea-tiempo.test.tsx` y `barra-anios.test.tsx` comprueban:
    - un separador por año, con sus normas debajo;
    - las clases de alternancia solo en escritorio;
    - la barra de años lleva al ancla del año, sin animación con movimiento reducido;
    - el enlace a una relacionada publicada despliega la tarjeta destino y le da el foco.
  - Hecho cuando (GREEN): pasan todas.
  - Depende de: T05
  - Archivos: `linea-tiempo.tsx`, `barra-anios.tsx`
- [x] **T07 · S** · Filtros de normativa
  - Cubre: RF-07, RNF-01 · CA-07.1, CA-07.3
  - Prueba primero (RED): `filtros-normativa.test.tsx` comprueba los cuatro desplegables
    con conteo («CNO (5)») y que el panel empiece plegado en móvil. Hoy falla porque el
    componente no existe.
  - Hecho cuando (GREEN): pasan todas, usando `DesplegableFiltro`.
  - Depende de: T03
  - Archivos: `filtros-normativa.tsx`
- [x] **T08 · M** · Vista de normativa: URL, conteo, vacío, CSV y referencia
  - Cubre: RF-08, RF-09, RF-10, RF-11, RF-12 · CA-07.2, CA-07.3, CA-08.1, CA-09.1, CA-10.1,
    CA-11.1, CA-12.1
  - Prueba primero (RED): `vista-normativa.test.tsx` y `documentos-referencia.test.tsx`
    comprueban:
    - un filtro cambia la URL y el resultado;
    - «Limpiar filtros» vuelve a todas;
    - sin resultados se lee «Ninguna norma cumple estos filtros» y la barra queda vacía;
    - el conteo «N normas»;
    - el CSV filtrado con licencia;
    - los estudios siguen visibles con filtros.
  - Hecho cuando (GREEN): pasan todas.
  - Depende de: T06, T07
  - Archivos: `vista-normativa.tsx`, `documentos-referencia.tsx`
- [x] **T09 · S** · Página `/normativa`
  - Cubre: RF-17, RNF-05, RNF-06 · CA-17.1
  - Prueba primero (RED): `secciones.test.tsx`: `/normativa` muestra la línea de tiempo y no
    «Sección en construcción». Hoy falla.
  - Hecho cuando (GREEN): pasa; el build sale bien, y `/normativa` lee con Suspense sin
    bloquear el título.
  - Depende de: T04, T08
  - Archivos: `web/src/app/normativa/page.tsx`
- [x] **T10 · XS** · Accesibilidad
  - Cubre: RNF-04 · CA-04.2
  - Prueba primero (RED): `a11y.test.tsx` corre axe sobre la vista con normas de varias
    entidades y comprueba el contraste AA de cada color de entidad sobre su fondo.
  - Hecho cuando (GREEN): sin violaciones.
  - Depende de: T08
  - Archivos: `web/src/components/a11y.test.tsx` (y ajustes de color en `tarjeta-norma.tsx`)
- [x] **T11 · S** · Validador de propuestas
  - Cubre: RF-14, RNF-08
  - Prueba primero (RED): `pruebas/test_propuestas_normativa.py` valida cada JSON de
    `specs/004-normativa/propuestas/`:
    - tipo *Norma*;
    - `datos` válidos según el esquema;
    - id con formato `EMISOR-TIPO-NÚMERO-AÑO`, sin duplicados;
    - `relacionada_con` apunta a ids propuestos o publicados;
    - el enlace es de un dominio oficial (creg.gov.co, funcionpublica.gov.co, cno.org.co,
      xm.com.co, upme.gov.co, minenergia.gov.co, repositorio.unal.edu.co).

    También lista los ids esperados por lote. Falla porque no hay propuestas.
  - Hecho cuando (GREEN): pasa con un lote vacío marcado como pendiente (se habilita lote a lote en T12–T16).
  - Depende de: T01
  - Archivos: `pruebas/test_propuestas_normativa.py`
- [x] **T12 · S** · Propuestas CREG (7 del usuario + 074 y 110 de 2021)
  - Cubre: RF-14, RNF-08
  - Prueba primero (RED): se habilitan en T11 los 9 ids de la CREG; falla porque no existen los JSON.
  - Hecho cuando (GREEN): cada norma se leyó del documento oficial (fecha, número,
    título, estado, relaciones). El resumen y la explicación son breves. La prueba pasa.
    Los datos que no se puedan confirmar quedan vacíos y se anotan en `BITACORA.md`.
  - Depende de: T11
  - Archivos: `specs/004-normativa/propuestas/creg-*.json`
- [x] **T13 · S** · Propuestas CNO (5 acuerdos)
  - Cubre: RF-14, RNF-08 · aclaración 3
  - Prueba primero (RED): ids del CNO habilitados; faltan los JSON.
  - Hecho cuando (GREEN): pasa, con el enlace propio de cada acuerdo, o el índice SAEB si
    no existe.
  - Depende de: T11
  - Archivos: `propuestas/cno-*.json`
- [x] **T14 · S** · Propuestas XM (3 documentos)
  - Cubre: RF-14, RNF-08 · aclaraciones 2 y 4
  - Prueba primero (RED): ids de XM habilitados; faltan los JSON.
  - Hecho cuando (GREEN): pasa. Un documento sin fecha verificable no se carga y queda
    anotado para que el usuario confirme la fecha.
  - Depende de: T11
  - Archivos: `propuestas/xm-*.json`
- [x] **T15 · S** · Propuestas MME y Congreso (5 + Res. 40178 de 2026)
  - Cubre: RF-14, RNF-08
  - Prueba primero (RED): ids habilitados; faltan los JSON.
  - Hecho cuando (GREEN): pasa. La 40178 se carga solo si se encuentra el texto oficial.
  - Depende de: T11
  - Archivos: `propuestas/mme-*.json`, `propuestas/congreso-*.json`
- [x] **T16 · S** · Propuestas UPME y estudios académicos
  - Cubre: RF-12, RF-14, RNF-08
  - Prueba primero (RED): ids de la UPME (convocatorias STR 01-2020 y 01-2021) y de los
    dos estudios de la UNAL habilitados; faltan los JSON.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T11, T01
  - Archivos: `propuestas/upme-*.json`, `propuestas/academia-*.json`
- [x] **T17 · S** · Enviar la carga inicial a la cola de aportes
  - Cubre: RF-14 · CA-14.1
  - Prueba primero (RED): en `pruebas/test_proponer_aporte.py`, enviar una carpeta de
    propuestas manda un aporte por archivo y se detiene en el primer error. Hoy el script
    solo acepta un archivo.
  - Hecho cuando (GREEN): pasa. Luego se envían las propuestas a pruebas y el usuario ve
    los aportes *Norma* pendientes en `/admin`.
  - Depende de: T02, T12–T16
  - Archivos: `scripts/proponer_aporte.py`
- [x] **T18 · M** · E2E de la 004
  - Cubre: todos los CA
  - Prueba primero (RED): `web/e2e/004-normativa.spec.ts` con los escenarios de abajo,
    sobre normas ficticias sembradas. Falla antes de T09.
  - Hecho cuando (GREEN): pasa en escritorio y a 375 px, y la limpieza deja la base como estaba.
  - Depende de: T09, T10, T02
  - Archivos: `web/e2e/004-normativa.spec.ts`

- [x] **T19 · S** · Precisión de fecha (mes y año, o solo año)
  - Cubre: RF-04 · CA-04.3 (cambio de spec del 2026-10-24)
  - Prueba primero (RED): validador de Python («Mes» válido, «Semana» no); `test_sql_esquemas`
    (la columna existe con su check, aunque llegue por `alter table … add column`);
    `normativa.test.ts` (`fechaDeNorma` da «19/06/2026», «septiembre de 2026» o «2025»);
    `tarjeta-norma.test.tsx` (la tarjeta muestra «abril de 2026»).
  - Hecho cuando (GREEN): pasan; la 0006 agrega la columna y el CSV la incluye.
  - Depende de: T01, T05
  - Archivos: `datos/esquemas.json`, `datos/normativa.csv`, `supabase/migrations/0006_normativa.sql`, `web/src/lib/normativa.ts`, `tarjeta-norma.tsx`, `datos-publicos.ts`

- [x] **T20 · XS** · El CSV no inventa el día (falla F-1 del E2E)
  - Cubre: CA-04.3
  - Prueba primero (RED): `csv.test.ts`: una norma con precisión «Mes» o «Año» salía como `2022-09-01` y `2022-01-01`.
  - Hecho cuando (GREEN): el CSV filtrado y `/datos/normativa.csv` muestran «septiembre de 2022» y «2022».
  - Depende de: T19
  - Archivos: `web/src/lib/csv.ts`
- [x] **T21 · XS** · El desplegable de filtros dice qué cuenta (observación 1 del E2E)
  - Cubre: RF-07
  - Prueba primero (RED): `filtros-normativa.test.tsx` y `vista-vehiculos.test.tsx`: el encabezado de las opciones decía «Proyectos».
  - Hecho cuando (GREEN): dice «Normas» en `/normativa` y «Vehículos» en `/vehiculos`; `/mapa` sigue con «Proyectos».
  - Depende de: T07
  - Archivos: `desplegable-filtro.tsx`, `filtros-normativa.tsx`, `filtros-vehiculos.tsx`

- [x] **T22 · XS** · Sin descargas CSV en `/normativa` (cambio de spec del 2026-10-25)
  - Cubre: RF-11 · CA-11.1
  - Prueba primero (RED): `vista-normativa.test.tsx` (no hay botón «Descargar CSV») y `secciones.test.tsx` (no hay enlace «Descargar datos completos»). Hoy fallan porque los dos existen.
  - Hecho cuando (GREEN): ni el botón ni el enlace aparecen; el resto de la vista no cambia.
  - Depende de: T08, T09
  - Archivos: `vista-normativa.tsx`, `web/src/app/normativa/page.tsx`

Estimación total: 18 tareas (2 XS, 11 S, 5 M), sin tareas L · de 12 a 16 h. La carga de datos
(T12–T16) es la parte más larga, porque cada documento se lee completo.

## Escenarios E2E
Entrada del agente E2E limpio. Datos sembrados de prueba, ficticios:
- 6 normas aprobadas de 2019, 2022 y 2026, de CREG, CNO y XM;
- una relacionada con otra;
- dos con la misma fecha;
- una pendiente;
- un estudio de Academia.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1, CA-01.2 | 1. Abrir `/normativa` | Las normas van de la más reciente a la más antigua; con la misma fecha, por entidad y número |
| E2E-02 | CA-02.1 | 1. Abrir `/normativa` | Hay separadores 2026, 2022 y 2019, cada uno antes de sus normas |
| E2E-03 | CA-03.1 | 1. Usar «2019» en la barra de años | La página llega al separador de 2019 |
| E2E-04 | CA-03.2 | 1. Filtrar entidad = CNO 2. Mirar la barra de años | Solo están los años con acuerdos del CNO |
| E2E-05 | CA-04.1, CA-04.2 | 1. Mirar una tarjeta plegada 2. Comparar las tarjetas de dos entidades | Fecha dd/mm/aaaa, entidad escrita, tipo y número, título, estado y resumen; colores distintos y nombre escrito |
| E2E-06 | CA-05.1, CA-05.2 | 1. Desplegar una norma 2. Usar «Ver documento oficial» | Explicación, «Aplica a», relacionadas; el enlace oficial abre en una pestaña nueva |
| E2E-07 | CA-05.3 | 1. Con Tab llegar a una norma 2. Enter 3. Enter | Se despliega y se pliega; el control anuncia el estado |
| E2E-08 | CA-06.1 | 1. Desplegar la norma que cita otra 2. Usar el enlace de la relacionada | Se llega a la relacionada, desplegada |
| E2E-09 | CA-06.2 | 1. Desplegar una norma que cita una no publicada | La relacionada se ve como texto, sin enlace |
| E2E-10 | CA-07.1 | 1. Abrir el filtro de entidad | Cada opción con su conteo |
| E2E-11 | CA-07.2, CA-07.3 | 1. Filtrar CREG + Vigente 2. «Limpiar filtros» | Solo CREG vigentes; luego todas |
| E2E-12 | CA-08.1 | 1. Filtrar 2. Abrir la URL en otra pestaña | Mismos filtros y mismo resultado |
| E2E-13 | CA-09.1 | 1. Aplicar filtros sin resultados | «Ninguna norma cumple estos filtros»; barra de años vacía |
| E2E-14 | CA-10.1 | 1. Filtrar hasta dejar 3 normas 2. Luego 1 | «3 normas»; «1 norma» |
| E2E-15 | CA-11.1 | 1. Abrir `/normativa` 2. Aplicar un filtro | No hay botón «Descargar CSV» ni enlace «Descargar datos completos (CSV)» |
| E2E-16 | CA-12.1 | 1. Abrir la página 2. Aplicar un filtro | El estudio está en «Documentos de referencia», fuera de la línea, con o sin filtro |
| E2E-17 | CA-13.1 | 1. Abrir la página | La norma pendiente no aparece |
| E2E-18 | CA-14.1 | 1. Entrar a `/admin` como editor | Se ven los aportes *Norma* pendientes de origen agente; no están en `/normativa` |
| E2E-19 | CA-15.1 | 1. Desplegar una norma 2. «Proponer corrección» | `/aportar` con tipo *Corrección* y el id de la norma |
| E2E-20 | CA-16.1 | 1. Aprobar en `/admin` la norma pendiente 2. Esperar ≤ 5 min y recargar `/normativa` | La norma aparece |
| E2E-21 | CA-17.1 | 1. En el inicio, usar la tarjeta de normativa | Se llega a la línea de tiempo |
| E2E-22 | RNF-01, RNF-03, RNF-06 | 1. A 375 px con movimiento reducido, abrir la página 2. Usar la barra de años | Una columna, sin desborde, filtros plegados, salto sin animación, consola limpia |
| E2E-23 | RNF-04 | 1. axe sobre la página 2. Recorrer con Tab | Sin violaciones; foco visible |
| E2E-24 | RNF-05 | 1. Medir el LCP de la página publicada (3 veces) | Mediana ≤ 2,5 s |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1, CA-01.2 | T03, T06 | E2E-01 |
| RF-02 | CA-02.1 | T03, T06 | E2E-02 |
| RF-03 | CA-03.1, CA-03.2 | T03, T06 | E2E-03, E2E-04 |
| RF-04 | CA-04.1, CA-04.2 | T05, T10 | E2E-05 |
| RF-05 | CA-05.1–05.3 | T05 | E2E-06, E2E-07 |
| RF-06 | CA-06.1, CA-06.2 | T03, T05, T06 | E2E-08, E2E-09 |
| RF-07 | CA-07.1–07.3 | T03, T07, T08 | E2E-10, E2E-11 |
| RF-08 | CA-08.1 | T08 | E2E-12 |
| RF-09 | CA-09.1 | T03, T08 | E2E-13 |
| RF-10 | CA-10.1 | T03, T08 | E2E-14 |
| RF-11 | CA-11.1 | T08, T22 | E2E-15 |
| RF-12 | CA-12.1 | T01, T02, T03, T08, T16 | E2E-16 |
| RF-13 | CA-13.1 | T04 | E2E-17 |
| RF-14 | CA-14.1 | T11–T17 | E2E-18 |
| RF-15 | CA-15.1 | T05 | E2E-19 |
| RF-16 | CA-16.1 | T04 | E2E-20 |
| RF-17 | CA-17.1 | T09 | E2E-21 |
| RNF-01, 03, 06 | — | T06, T07, T09 | E2E-22 |
| RNF-02 | — | T05 | E2E-05 |
| RNF-04, 07 | — | T05, T10 | E2E-23 |
| RNF-05 | — | T09 | E2E-24 |
| RNF-08 | — | T11–T16 | Revisión del usuario en `/admin` |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| La carga de datos tarda más de lo previsto (más de 25 documentos, algunos largos) | Va en lotes por entidad (T12–T16), independientes de la interfaz. Si no cabe en el cronograma, los faltantes de la búsqueda (CREG 074 y 110, UPME, MME 40178) pasan a después del MVP. |
| Un dato no se puede confirmar (fecha de un documento de XM, enlace propio de un acuerdo CNO, texto oficial de la 40178) | Se deja vacío o no se carga, y se anota en `BITACORA.md` (RNF-08). Nunca se inventa. |
| Aprobar más de 25 aportes uno a uno en `/admin` toma tiempo al usuario | Las propuestas llegan completas y validadas; la revisión es de contenido. Se puede aprobar por lotes en varias sesiones. |
| Los E2E en paralelo con otras suites chocan en la base de pruebas | Se corren en serie, con sus propias normas ficticias y su limpieza (como en la 006). |
| Los colores de entidad no cumplen AA con 6 o 7 entidades | T10 lo comprueba con los valores reales de los tokens; si un color no alcanza AA, la entidad se distingue con borde y texto. |
| Cronograma: hoy (10-24) está la 004 y el 10-25 las noticias | Se prioriza la interfaz (T01–T10, T18) y los datos del usuario (T12–T14, T15 sin la 40178). Los faltantes de la búsqueda pueden ir el 10-26. |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-24 | T01 | `test_validar_datos`: un estudio (Academia/Estudio) daba error; `test_validacion_sql`: faltaba la 0006 | Python 67/67, validador sin errores, `esquemas.test.ts` 12/12 | La validación SQL ahora se regenera en la 0006. `test_sql_esquemas` acepta un `alter table … check` posterior como el check vigente. La prueba de la 0005 (vehículos) lee su propia migración |
| 2026-10-24 | T02 | `rls.test.ts` (integración): la base rechaza «Academia» y el mensaje del emisor no la incluye | En rojo hasta que el usuario aplique la 0006 en **pruebas** | — |
| 2026-10-24 | T03 | `normativa.test.ts`: el módulo no existía | 13/13 | — |
| 2026-10-24 | T04 | `datos-publicos.test.ts`: `leerNormas` y `ETIQUETA_NORMAS` no existían | 3/3 | La etiqueta es la misma que devuelve `tablaDestino` para un aporte *Norma* |
| 2026-10-24 | T05 | `tarjeta-norma.test.tsx`: el componente no existía | 7/7 | Se corrigió una aserción de la prueba: la explicación plegada existe en la página pero oculta (`not.toBeVisible`, no `not.toBeInTheDocument`). La fecha usa `--text-body` y no `--text-muted`, que no cumple AA |
| 2026-10-24 | T06 | `linea-tiempo.test.tsx`: componentes inexistentes | 8/8 | Las pruebas de la barra de años van en el mismo archivo. Se corrigió el nombre esperado en una prueba (el número ficticio sale del id sin espacio). Lint: el salto usa un objeto nuevo por destino en vez de reiniciar el estado dentro del efecto |
| 2026-10-24 | T07 | `filtros-normativa.test.tsx`: el componente no existía | 4/4 | — |
| 2026-10-24 | T08 | `vista-normativa.test.tsx`: la vista no existía | 8/8 | Una relacionada oculta por los filtros quita los filtros y abre la norma. Las pruebas de la referencia van en el mismo archivo |
| 2026-10-24 | T09 | `secciones.test.tsx`: `/normativa` seguía en construcción | 7/7 | — |
| 2026-10-24 | T10 | axe (vista y tarjeta desplegada) y contraste con los valores reales de los tokens | 17/17 + 5/5 | Pasó de entrada porque el ajuste de contraste se hizo en T05. Se agregó un control (`--text-muted` < 4,5:1) que valida la medición. Suite: 335/335, tsc y lint sin errores |
| 2026-10-24 | T19 | Validador: «Mes» no era válido; `normativa.test.ts`: `fechaDeNorma` no existía; tarjeta sin «abril de 2026» | Python 68/68; web 68/68 | Cambio de spec aprobado por el usuario: columna `precision_fecha`, CA-04.3. `test_sql_esquemas` acepta `alter table … add column`. El `dateTime` de la fecha también va sin día |
| 2026-10-24 | T11 | `test_propuestas_normativa`: faltaban todos los lotes | 7/7 al terminar T16 | Lotes ajustados con las decisiones del usuario (solo acuerdos CNO vigentes; el 2186 ya fue sustituido por el 2234) |
| 2026-10-24 | T12–T16 | Faltaban los JSON de cada lote | 22 propuestas válidas: 8 CREG, 4 CNO, 3 XM, 5 MME y Congreso, 2 Academia | Texto leído con `pdftotext` o del gestor oficial (los PDF de la CREG 098, 127 y D-064 son escaneados). Fechas sin día: Modelo XM (sep. 2026), grid-forming (abr. 2026) y estudios UNAL (2025). El Acuerdo CNO 2028 lleva el enlace del índice SAEB (no se encontró su página propia). Faltantes que quedan para después: UPME STR 01-2020 y 01-2021, MME 40178 de 2026, MME 40042 de 2024, CREG 070 de 2021 y 101 097 de 2026 |
| 2026-10-24 | T17 | `test_proponer_aporte`: `proponer_carpeta` no existía | Python 77/77 | El envío a **pruebas** espera a que el usuario aplique la 0006 (sin ella, aprobar en `/admin` falla) |
| 2026-10-25 | T02 (cierre) | — | El usuario aplicó la 0006 en **pruebas**. Integración 36/36 | — |
| 2026-10-25 | T17 (envío) | — | 22 aportes *Norma* pendientes en **pruebas** (273 a 294), origen agente `ficha-normativa` | — |
| 2026-10-25 | T18 | E2E limpio: 24/26 en verde, F-1 (CSV con día inventado) y E2E-24 (LCP) no comprobable en local | — | El agente agregó E2E-05b (CA-04.3) y E2E-22b (alternancia en escritorio) |
| 2026-10-25 | T20 | `csv.test.ts`: el CSV traía `2022-09-01` y `2022-01-01` | 7/7 | — |
| 2026-10-25 | T21 | El encabezado del desplegable decía «Proyectos» en normativa y vehículos | Suite 340/340, tsc y lint sin errores | Prop `unidad` con «Proyectos» por defecto |
| 2026-10-25 | Carga (ajuste) | `test_propuestas_normativa`: faltaban CNO 1354, CREG 074 de 2021 y MME 40178 de 2026 | 25 propuestas válidas (7/7) | Carpeta corregida por el usuario. Enlaces propios del CNO (1354, 1898, 2028, 2231) y CREG 110 en el gestor. Los 6 aportes pendientes que cambiaron se corrigieron en la cola (275, 276, 277, 286, 287, 288) y se enviaron 3 nuevos (299, 300, 301). El 2186 no se carga: lo sustituyó el 2234 |
| 2026-10-25 | Repetición E2E | — | `004-normativa.spec.ts`: 27 pasan, 0 fallan (escritorio y 375 px) | El LCP (E2E-24) se mide en el sitio publicado |
| 2026-10-25 | T22 | `vista-normativa.test.tsx` y `secciones.test.tsx`: el botón «Descargar CSV» y el enlace de datos completos existían | Suite 340/340; E2E 004 27/27 | Cambio de spec pedido por el usuario. E2E-05b, E2E-07, E2E-15 y E2E-17 ajustados (sin descarga). La ruta `/datos/normativa.csv` sigue existiendo, sin enlace desde la página |

## Informe E2E
Enlace a `e2e-informe.md` cuando exista.
