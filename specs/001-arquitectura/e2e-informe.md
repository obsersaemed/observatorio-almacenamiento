# Informe E2E · 001
Fecha: 2026-10-20 · Entorno: local (`npm run dev`, puerto 3000) contra el proyecto Supabase **pruebas**; E2E-19 contra el sitio publicado (solo lectura) · Comandos:
- `npx playwright test e2e/001-arquitectura.spec.ts` (dentro de `web/`, 1 worker, proyectos `escritorio` y `movil-375`)
- E2E-06: `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA npm run dev` (llave pública de prueba de Cloudflare «siempre falla», solo en la variable de entorno del proceso) y `E2E_TURNSTILE_FALLA=1 npx playwright test e2e/001-arquitectura.spec.ts --project=escritorio --grep "E2E-06 "`
- E2E-19: `E2E_LCP=1 npx playwright test --config e2e/lcp.config.ts`

Probador independiente: no leyó código de producción. Los datos de prueba llevan el prefijo `e2e-20261020-` y el dominio `@ejemplo.co`. Se borraron al terminar (proyectos, aportes, aportantes, historial, editores y usuarios de Auth). Al cierre, la base tiene 7 proyectos, 1 editor (`obsersae_med@unal.edu.co`) y el aporte 100, que ya existía.

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1 | ✅ Pasa | El proyecto `Pendiente` no aparece en `/`, `/mapa`, `/vehiculos`, `/normativa`, `/noticias`, `/aportar`, `/datos/proyectos.csv` ni `/datos/noticias.csv`, ni lo devuelve la API con la llave anónima. Los 900 MW del pendiente no entran al KPI. El aprobado sembrado directo en la base tardó unos 5 min en verse (caché; dentro de RF-10). |
| E2E-02 | CA-02.1 | ✅ Pasa | Tarjetas separadas «Potencia en operación [MW]» y «Energía en operación [MWh]». Las sumas coinciden con los proyectos `Aprobado` + `En operación` de la base, con coma decimal (p. ej. «19,5 MW»). Los conteos por estado coinciden. Los proyectos en construcción, anunciados, inactivos y pendientes quedan fuera. |
| E2E-03 | CA-03.1 | ✅ Pasa | Sin fuente, el navegador bloquea el envío y lleva el foco al campo «Enlace de la fuente» (`valueMissing`). Si se salta la validación del navegador, el servidor responde con la alerta «Revisa lo siguiente:», que nombra la fuente. No se crea ningún aporte. |
| E2E-04 | CA-03.2 | ✅ Pasa | Igual que E2E-03, con el campo «Correo de contacto». No se crea ningún aporte. |
| E2E-05 | CA-04.1, CA-06.1 | ✅ Pasa | Se ve «¡Gracias! Recibimos tu aporte. Número de seguimiento: N». Los KPI y el conteo por estado de `/` no cambian, y el contenido y el correo no aparecen en `/` ni en el CSV. El aporte figura en `/admin` como `Pendiente`. La primera corrida falló porque el CSV se refrescó con datos que otras pruebas habían sembrado (falla de diseño de la prueba, ya corregida). En la corrida final pasa al primer intento. |
| E2E-06 | CA-05.1 | ✅ Pasa | Corrida aparte, con el servidor usando la llave secreta «siempre falla»: el envío se rechaza con una alerta y no se guarda nada. Prueba complementaria (E2E-06b): un envío sin `cf-turnstile-response` también se rechaza y no se guarda. |
| E2E-07 | CA-05.2 | ✅ Pasa | Cinco aportes válidos reciben su número de seguimiento. El 6.º muestra un mensaje de espera y no se guarda. |
| E2E-08 | CA-07.1 | ✅ Pasa | `/admin` sin sesión redirige a `/admin/entrar`. Con un correo no autorizado, la respuesta es neutra («Si ese correo está autorizado…») y no se crea ningún usuario ni enlace en Supabase Auth. Una sesión válida de Auth que no está en `editores` tampoco ve la lista ni los botones de aprobar. |
| E2E-09 | CA-08.1 | ✅ Pasa | La lista muestra N.º, tipo, origen («Usuario»), fecha `dd/mm/aaaa` y fuente. El detalle muestra en una misma fila el valor actual (3) y el propuesto (4.5), y enlaza la fuente del aporte. |
| E2E-09 | RNF-04 | ❌ Falla | En `/admin/N` el valor propuesto aparece como «4.5» (con punto). El campo aparece con su nombre técnico (`potencia_nominal_mw`), no como «Potencia nominal [MW]». Se repitió (falla en ambos intentos). |
| E2E-10 | CA-09.1 | ✅ Pasa | Al pulsar «Rechazar aporte» sin motivo aparece una alerta que pide el motivo y el aporte sigue `Pendiente`. El campo no tiene validación del navegador (`required`). La exigencia viene del servidor. |
| E2E-11 | CA-09.2 | ✅ Pasa | Se propuso 4,5 MW y se ajustó a 5,25 MW. Quedó publicado 5,25. El aporte guarda `datos` = 4.5 y `datos_aprobados` = 5.25. |
| E2E-11 | CA-10.1 | ✅ Pasa | La versión ajustada se ve en `/datos/proyectos.csv` unos 2 s después de aprobar, sin intervención manual. |
| E2E-11 | CA-11.1 | ❌ Falla | La fila de `historial` tiene fecha, editor, `aporte_id`, `antes` (3) y `despues` (5,25). Pero su `fuente` es la fuente anterior del registro (`…/fuente-e2e`), no la del aporte que justificó el cambio (`…/correccion-aprobada-…`). Además, el historial no se puede consultar en la interfaz: solo con la llave de servicio, y `/admin/historial` da 404. Se repitió (falla en ambos intentos). |
| E2E-12 | CA-12.1 | ✅ Pasa | `proponer_aporte.py --entorno pruebas --tipo Noticia --agente e2e-…-agente-noticias` termina en 0 («Aporte N propuesto como Pendiente…»). En `/admin` la fila muestra el origen «agente» y el nombre del agente. El detalle también. |
| E2E-13 | CA-13.1 | ✅ Pasa | `respaldo.py --entorno pruebas --carpeta <tmp>` genera `proyectos.csv`, `normativa.csv` y `noticias.csv` sin correos. Para no tocar el repositorio se corrió con un `GIT_DIR` inexistente. Contra una API caída termina con salida 1, «ERROR … sin conexión» y «No se reescribió ningún archivo». En el repositorio está el commit `b0904f5`, «Respaldo diario de datos publicados (2026-10-20)», de `github-actions[bot]`. Ver «No comprobables» sobre la programación diaria. |
| E2E-14 | CA-14.1 | ✅ Pasa | `/datos/proyectos.csv` llega con `content-type: text/csv`, `content-disposition: attachment` y la línea de licencia CC BY 4.0 (también en la cabecera `Link rel=license`). Tiene la columna `Fuente`, todos los aprobados de la base y ningún pendiente ni correo. `/datos/noticias.csv` también trae la licencia. |
| E2E-15 | CA-15.1 | ✅ Pasa | Con el CSV original (commit `f98891d`, coordenadas `49,653`), `importar.py --simular` lista un RECHAZO por Latitud y otro por Longitud para cada uno de los 7 proyectos y sale con 1. Con un CSV corregido de prueba (nombres prefijados) responde «7 proyectos válidos» y sale con 0. Ver «No comprobables» sobre la importación real. |
| E2E-16 | CA-16.1 | ❌ Falla | La aprobación y la importación rechazan con el mismo mensaje: «'Estado' = 'Planeado' no está entre los valores permitidos: En operación, En construcción, Anunciado, Inactivo». El formulario público no tiene campo Estado, así que esa vía no se puede probar. La base de datos rechaza con otro texto: «new row for relation "proyectos" violates check constraint "proyectos_estado_check"». Se repitió (falla en ambos intentos). |
| E2E-17 | CA-17.1 | ✅ Pasa | Con `prefers-reduced-motion: reduce`, en escritorio y a 375 px, el texto de los KPI se muestreó cada 20 ms durante 4 s: un solo valor («22,3 MW … 15,1 MWh») y 0 animaciones en curso. Como referencia, sin la preferencia hubo conteo animado (39 y 50 valores intermedios). |
| E2E-18 | RNF-01, RNF-03 | ✅ Pasa | A 375 px (proyecto `movil-375` y escritorio reducido a 375) no hay desplazamiento horizontal en `/`, `/aportar`, `/mapa`, `/vehiculos`, `/normativa`, `/noticias` ni `/admin/entrar`. axe (WCAG 2.0/2.1 A y AA) no reporta violaciones serias ni críticas. La consola queda sin errores y el primer Tab lleva a «Saltar al contenido». |
| E2E-19 | RNF-02 | ✅ Pasa | Medido en https://observatorio-almacenamiento.vercel.app (build de producción, solo lectura). Emulación de móvil con red de 4G lenta (150 ms de RTT, 1,6 Mb/s) y CPU 4× más lenta, por CDP; 3 mediciones por página. Mediana de LCP: `/` 1,77 s, `/aportar` 1,84 s, `/mapa` 1,85 s, `/vehiculos` 1,51 s, `/normativa` 1,57 s, `/noticias` 1,34 s. Es una aproximación con PerformanceObserver, no un informe de Lighthouse. |
| Extra | RNF-07 | ✅ Pasa | Ninguna respuesta HTML, JS ni JSON recibida por el navegador en `/`, `/aportar`, `/admin/entrar` y `/mapa` contiene la llave de servicio ni el secreto de Turnstile. |
| Extra | RNF-09 | ✅ Pasa | `/`, `/aportar`, `/mapa`, `/vehiculos`, `/normativa` y `/noticias` tienen cada una su título y su `meta description`, sin títulos repetidos. |

Pruebas: `web/e2e/001-arquitectura.spec.ts`, `web/e2e/001-lcp.spec.ts`, `web/e2e/lcp.config.ts`, `web/e2e/utilidades.ts` y `web/e2e/csv_prueba.py`.

## Fallas

### F1 · CA-11.1: el historial no guarda la fuente del cambio y no se puede consultar
1. Sembrar el proyecto aprobado `e2e-…-proyecto-x` (`potencia_nominal_mw` = 3, `fuente` = `https://ejemplo.co/fuente-e2e`).
2. Sembrar un aporte `Corrección` con `registro_afectado` = ese nombre, `datos` = `{"potencia_nominal_mw": 4.5}` y `fuente` = `https://ejemplo.co/correccion-aprobada-…`.
3. Como editor, abrir `/admin/N`, cambiar «Potencia nominal [MW]» a 5,25 y pulsar «Aprobar y publicar».
4. Consultar `historial` con `aporte_id = N`.

- **Esperado (spec):** el historial del registro muestra la fecha, el editor, el aporte de origen, los valores anteriores y nuevos, y la fuente del cambio.
- **Obtenido:** `historial.fuente` = `https://ejemplo.co/fuente-e2e`, la fuente que el registro ya tenía, no la del aporte. Esto pasa porque el formulario «Ajustar y aprobar» llena «Fuente *» con la fuente actual del registro, no con la del aporte. Así, la cifra publicada (5,25 MW) queda citando una fuente que no la respalda. Además, no hay ninguna vista del historial en `/admin` (`/admin/historial` da 404 y el detalle del aporte aprobado no lo muestra): solo se puede consultar con la llave de servicio.
- **Evidencia:** `expect.soft` en E2E-11: «la fuente del cambio es la del aporte», Expected `https://ejemplo.co/correccion-aprobada-…`, Received `https://ejemplo.co/fuente-e2e`; y «historial consultable desde /admin»: element(s) not found. Se repitió (retry #1) y en la corrida final, con el mismo resultado. Las trazas quedan en `web/test-results/`.

### F2 · CA-16.1: la regla de `Estado` no se aplica igual en las cuatro vías
1. Importación: un CSV con `Estado = Planeado`, `importar.py --simular`.
2. Aprobación: un aporte «Proyecto nuevo»; en `/admin/N` escribir «Planeado» en «Estado *» y aprobar.
3. Base de datos: insertar en `proyectos` con `estado = 'Planeado'` (API REST, llave de servicio).
4. Formulario: abrir `/aportar`.

- **Esperado (spec):** se rechaza con el mismo mensaje por cualquiera de las cuatro vías.
- **Obtenido:**
  - La importación y la aprobación coinciden: «'Estado' = 'Planeado' no está entre los valores permitidos: En operación, En construcción, Anunciado, Inactivo».
  - La base responde «new row for relation "proyectos" violates check constraint "proyectos_estado_check"».
  - El formulario público no tiene campo Estado (solo Tipo, Registro que se corrige, Descripción, Fuente y Correo), así que la regla no se puede aplicar ni comprobar ahí.
  - En la aprobación, «Estado *» es un cuadro de texto libre, no una lista de valores permitidos.
- **Evidencia:** anotación `mensajes` de E2E-16 y `expect.soft` «el formulario debe permitir y validar Estado» y «la base responde con el mismo mensaje». Se repitió con el mismo resultado.

### F3 · RNF-04: coma decimal y unidades en la comparación del editor
1. Sembrar una corrección de potencia (actual 3, propuesta 4,5).
2. Como editor, abrir `/admin/N`.

- **Esperado (spec, RNF-04):** coma decimal y unidades entre corchetes en la interfaz.
- **Obtenido:** la tabla «Valor actual frente al propuesto» muestra «4.5» y el encabezado de fila `potencia_nominal_mw`. Los campos de «Ajustar y aprobar» también muestran «4.5», «-73.91», etc.
- **Evidencia:** E2E-09, `expect.soft` «RNF-04: coma decimal en el valor propuesto», Expected `/^4,5$/`, Received «4.5». Se repitió con el mismo resultado.

## No comprobables
Ningún escenario quedó entero sin comprobar. Hay tres alcances parciales:
- **CA-13.1, la parte «dado un día cualquiera».** Desde fuera solo se ve una corrida `workflow_dispatch` de «Respaldo diario» (2026-10-20 21:31 UTC) y su commit `b0904f5`. Todavía no hay una corrida programada que observar. El «aviso de error si falló» en CI tampoco se puede provocar sin tocar la configuración. Lo que sí se comprobó: el script falla con código 1 y un mensaje de error, sin reescribir archivos.
- **CA-15.1, la importación real.** Se comprobó con `--simular`. No se hizo la importación real del CSV corregido para no tocar los 7 proyectos reales; la ayuda del script no dice si reemplaza la tabla o solo agrega filas.
- **RNF-02 con Lighthouse.** El LCP se midió con el build publicado y una emulación de red y CPU equivalente a la de Lighthouse para móvil, no con Lighthouse. Compilar en local (`npm run build`) no es posible con `npm run dev` encendido por el límite de 3,4 GB de RAM.

## Observaciones (no son fallas de la spec)
- **Formato de los datos sembrados.** Para sembrar, como no se puede leer `supabase/`, se consultó la descripción OpenAPI de la API REST de **pruebas**. El formato de `aportes.datos` para una corrección (`{"campo": valor}`) se dedujo a ciegas, y la interfaz lo interpretó bien.
- **Caché.** Los cambios hechos directamente en la base tardan unos 5 min en verse en `/` y en `/datos/proyectos.csv`. Los que pasan por la aprobación se ven en unos 2 s.
- **Animación de los KPI.** Sin movimiento reducido, el número animado arranca en el valor final (HTML del servidor), salta a 0 y cuenta hacia arriba: hay un parpadeo visible. Con movimiento reducido no ocurre.
- **Idioma de la validación.** El mensaje de validación del navegador sale en el idioma del navegador (en Chromium headless, «Please fill out this field.»). El mensaje del servidor sí está en español.
