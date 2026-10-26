# Informe E2E · 004
Fecha: 2026-10-25 · Entorno: local (`next start` en http://localhost:3000) contra el proyecto Supabase «pruebas» · Comando: `npx playwright test e2e/004-normativa.spec.ts --output=test-results/004` (desde `web/`, un trabajador y un reintento según `playwright.config.ts`; proyectos `escritorio` y `movil-375`)

Prueba: `web/e2e/004-normativa.spec.ts`. Los datos son ficticios y se sembraron con el prefijo `e2e-20261025-004-`. Hay 6 normas aprobadas de 2019, 2022 y 2026 (CREG, CNO y XM): una cita a otra, dos tienen la misma fecha, una solo tiene mes y año y otra solo tiene año. Además hay una norma `Pendiente`, citada por una aprobada, y un estudio de Academia. Al terminar se borró todo lo sembrado: las tablas `normas` y `aportes` no tienen filas con el prefijo, y los 22 aportes *Norma* de la carga inicial siguen `Pendiente`, sin cambios.

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1, CA-01.2 | ✅ Pasa | Orden 20/08/2026 › 15/03/2026 CNO › 15/03/2026 CREG › sept. 2022 › 2022 › 10/05/2019. Consola sin errores |
| E2E-02 | CA-02.1 | ✅ Pasa | Separadores 2026, 2022 y 2019, cada uno encima de sus normas. El estudio (2025) no genera separador |
| E2E-03 | CA-03.1 | ✅ Pasa | Al elegir «2019», el separador queda en la ventana. `location.search` no cambia |
| E2E-04 | CA-03.2 | ✅ Pasa | Con entidad = CNO, la barra muestra solo 2026 y 2022 |
| E2E-05 | CA-04.1, CA-04.2 | ✅ Pasa | Muestra «15/03/2026», CREG, Resolución E2E 901, título, Vigente y resumen. Franja de color por entidad: CREG rgb(63,69,72), CNO rgb(46,155,78), XM rgb(239,159,46), con el nombre escrito. La misma entidad usa el mismo color |
| E2E-05b (adicional) | CA-04.3 | ❌ Falla | La tarjeta se ve bien («septiembre de 2022», «2022») y el orden también, pero el CSV trae `2022-09-01` y `2022-01-01`. Falló también en el reintento. `web/test-results/004/…día-1-escritorio/` y `…-retry1/` |
| E2E-06 | CA-05.1, CA-05.2 | ✅ Pasa | Al desplegar aparecen la explicación, «Aplica a», «Normas relacionadas» y «Ver documento oficial (abre en una pestaña nueva)» con `target=_blank`. La pestaña nueva abre la URL de `enlace` |
| E2E-07 | CA-05.3 | ✅ Pasa | Se llega con Tab. Enter y Espacio despliegan y pliegan; `aria-expanded` pasa de false a true y vuelve a false |
| E2E-08 | CA-06.1 | ✅ Pasa | El enlace «Resolución CREG E2E 098 de 2019» lleva a esa tarjeta, que queda en la ventana y desplegada |
| E2E-09 | CA-06.2 | ✅ Pasa | La relacionada no publicada aparece como texto, «Resolución CREG E2E999 de 2026», sin enlace. El título de la pendiente no aparece (ver observación 2) |
| E2E-10 | CA-07.1 | ✅ Pasa | Muestra «CNO (2)», «CREG (3)» y «XM (1)» (ver observación 1) |
| E2E-11 | CA-07.2, CA-07.3 | ✅ Pasa | CREG + Vigente deja solo las dos CREG vigentes. «Limpiar filtros» devuelve las 6 y los botones vuelven a «Todas» |
| E2E-12 | CA-08.1 | ✅ Pasa | `/normativa?entidad=CNO&anio=2022` en otra pestaña tiene los mismos filtros marcados y la misma norma |
| E2E-13 | CA-09.1 | ✅ Pasa | Muestra «Ninguna norma cumple estos filtros» y la barra de años queda vacía. La combinación se aplicó por URL porque, con XM elegido, la opción «Vigente» desaparece del filtro (ver observación 3) |
| E2E-14 | CA-10.1 | ✅ Pasa | «6 normas» sin filtros, «3 normas» con CREG y «1 norma» con XM |
| E2E-15 | CA-11.1 | ✅ Pasa | El CSV filtrado por CNO trae la línea de licencia CC BY 4.0, solo los 2 acuerdos del CNO, la columna `enlace` con su URL y las 13 columnas publicadas, sin `publicacion` |
| E2E-16 | CA-12.1 | ✅ Pasa | La región «Documentos de referencia» está debajo de la línea de tiempo, con título, autor (Aplica a), 2025, resumen y enlace. Sigue ahí con XM y con un filtro sin resultados. Academia no aparece como opción de entidad |
| E2E-17 | CA-13.1 | ✅ Pasa | La pendiente no aparece en el HTML, en el CSV filtrado ni en «Descargar datos completos (CSV)» (`/datos/normativa.csv`). Este último tampoco trae ninguna de las 22 normas de la carga inicial, que siguen pendientes |
| E2E-18 | CA-14.1 | ✅ Pasa | `/admin` lista los 22 aportes como «Norma» y «Agente: ficha-normativa», cada uno con su enlace oficial. Ninguno aparece en `/normativa` (ver observación 4) |
| E2E-19 | CA-15.1 | ✅ Pasa | «Proponer corrección» abre `/aportar` con el tipo «Corrección» y el registro `CNO-ACU-E2E1001-2026` |
| E2E-20 | CA-16.1 | ✅ Pasa | Al aprobar en `/admin/<id>` un aporte *Norma* sembrado, la norma aparece en `/normativa` en la primera consulta (alrededor de 0 s) |
| E2E-21 | CA-17.1 | ✅ Pasa | La tarjeta del inicio y el menú «Normativa» llevan a la línea de tiempo, sin «Sección en construcción» |
| E2E-22 | RNF-01, RNF-03, RNF-06 | ✅ Pasa | A 375 px y con movimiento reducido: una sola columna (todas las tarjetas en x=40, 319 px de ancho), sin desplazamiento horizontal y con los filtros plegados en «▸ Filtros». No hay animaciones en curso al cargar ni al desplegar. El salto a 2019 es inmediato (scrollY 1720 al hacer clic y 1,2 s después). Consola sin errores |
| E2E-22b (adicional) | RNF-01 (escritorio) | ✅ Pasa | En escritorio las tarjetas se alternan a cada lado del eje (x: 36, 672, 36, 672, 36, 672) |
| E2E-23 | RNF-04 | ✅ Pasa | axe (WCAG 2.0/2.1 A y AA) no encuentra violaciones con la tarjeta plegada, desplegada ni con el filtro abierto, en escritorio y a 375 px. Los 17 y 16 elementos alcanzados con Tab tienen el foco visible |
| E2E-24 | RNF-05 | ⚠️ No comprobable | No se midió en la página publicada (producción está fuera del entorno permitido). Como referencia, el LCP local en móvil emulado (4G lenta, CPU 4×) fue de 1444, 1200 y 1236 ms, con mediana de 1,24 s |

## Fallas

### F-1 · CA-04.3: el CSV muestra una fecha con día para normas que solo tienen mes y año, o solo año
- **Pasos**
  1. Tener aprobadas una norma con `fecha = 2022-09-01` y `precision_fecha = Mes`, y otra con `fecha = 2022-01-01` y `precision_fecha = Año`.
  2. Abrir `/normativa`. La tarjeta muestra «septiembre de 2022» y «2022», como se espera.
  3. Usar «Descargar CSV».
- **Esperado (CA-04.3):** «cuando se mira su tarjeta **o el CSV**, entonces se ve "septiembre de 2026" (o "2025") y no un día inventado». En el CSV, la columna `fecha` debería decir «septiembre de 2022» y «2022».
- **Obtenido:** la columna `fecha` trae `2022-09-01` y `2022-01-01`, con el día 1 que no está en el documento. Al lado va la columna `precision_fecha` (`Mes` y `Año`), pero el criterio pide no mostrar el día inventado.
- **Evidencia:** falla en el primer intento y en el reintento (`Expected: "septiembre de 2022" · Received: "2022-09-01"`). Trazas en `web/test-results/004/004-normativa-004-·-Evoluc-4594a-el-CSV-ordena-como-el-día-1-escritorio/trace.zip` y en la carpeta `…-retry1`.
- **Nota:** CA-04.3 no tiene escenario en la sección «Escenarios E2E» del plan. Lo añadí como E2E-05b.

## No comprobables
- **RNF-05 (E2E-24), LCP en la página publicada:** medirlo exige usar el sitio publicado, que es producción. Solo hay una medición local de referencia (mediana de 1,24 s) con `next start`, que no equivale al despliegue en Vercel.
- **RNF-07, colores desde los tokens TEJ:** desde fuera solo se ve el color calculado (por ejemplo, la franja CNO en rgb(46,155,78)). No se puede saber si sale de un token o está escrito a mano sin leer el código.
- **RNF-08, nada inventado:** comprobar que cada número, fecha y enlace de la carga inicial corresponde al documento oficial requiere leer los documentos fuente. No es una prueba de interfaz.
- **CA-16.1 en el peor caso:** la aprobación se vio de inmediato en este entorno local. No se comprobó el límite de 5 minutos con la caché del despliegue en Vercel.

## Observaciones (no son fallas de un criterio)
1. **Texto ajeno en el filtro.** Al abrir cualquier desplegable de filtro, el árbol accesible muestra «Todas Proyectos» junto a la casilla «Todas». Parece texto heredado de `/mapa`, porque en esta página no hay proyectos.
2. **Número de la relacionada no publicada.** Sale del id sin el formato de la entidad: «E2E999» en lugar de «E2E 999». Con datos reales, `CREG-RES-101113-2026` se mostraría como «101113» en lugar de «101 113» (RF-04 y RF-06 piden el número «tal como lo escribe la entidad»).
3. **Combinaciones sin resultado.** Los conteos son facetados: al elegir XM desaparece la opción «Vigente». Desde la interfaz es difícil llegar a una combinación vacía; el mensaje de CA-09.1 sí aparece cuando se llega por URL.
4. **Carga inicial frente a la spec.** El apartado «Datos» de la spec lista el acuerdo CNO **2186 de 2026**, pero `/admin` muestra un aporte `CNO-ACU-2234-2026` (enlace `cno.org.co/content/acuerdo-2234-…`) y no hay ninguno 2186. Además, los acuerdos 2231 y 2234 tienen la misma fecha, 2026-09-01. Conviene que el editor lo confirme antes de aprobar.
5. **«Descargar datos completos (CSV)».** Enlaza a `/datos/normativa.csv`. En esta corrida devolvió solo lo aprobado. Al principio de la sesión, con normas aprobadas ya sembradas, devolvió solo la cabecera; parece que se actualiza en diferido. No contradice ningún criterio.

## Repetición (2026-10-25)

Con T20 (fecha sin día en el CSV) y T21 (unidad del desplegable), `npx playwright test e2e/004-normativa.spec.ts --workers=1` contra `next start` y Supabase «pruebas»: **27 pasan, 0 fallan** (escritorio y 375 px). E2E-05b ya pasa. E2E-24 (LCP) queda para medirlo en el sitio publicado.

## Segunda repetición (2026-10-25)

Con T22 (sin descargas CSV en `/normativa`, cambio de spec pedido por el usuario) y E2E-05b, E2E-07, E2E-15 y E2E-17 ajustados: **27 pasan, 0 fallan** (escritorio y 375 px).

## Verificación publicada (2026-10-25)

Sitio de Vercel con las 25 normas aprobadas por el editor (con correcciones de texto): 23 en la línea de tiempo y 2 estudios en «Documentos de referencia», 10 años (2014–2026), 5 derogadas, sin descargas, consola sin errores, sin desborde a 375 px; el salto de la 101 113 a la 098 la deja desplegada.

**E2E-24 · RNF-05 (LCP de `/normativa` publicado, 4G lenta, mediana de 3):** 1.536 ms y 1.704 ms en dos corridas. ✅ Pasa.
