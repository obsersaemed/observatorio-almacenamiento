# Informe E2E · 001
Fecha: 2026-10-21 (segunda corrida) · Entorno: local (`npm run dev`, puerto 3000) contra el proyecto Supabase **pruebas**, con las llaves de prueba de Turnstile; E2E-19 contra el sitio de prueba publicado (solo lectura) · Comandos (dentro de `web/`, 1 worker):
- `npx playwright test e2e/001-arquitectura.spec.ts --workers=1` (proyectos `escritorio` y `movil-375`): corrida completa.
- `npx playwright test e2e/001-arquitectura.spec.ts --project=escritorio --grep "E2E-05|E2E-09|E2E-11|E2E-16"`: confirmación de los escenarios que fallaron el 10-20 y del que fue intermitente.
- `npx playwright test e2e/001-arquitectura.spec.ts --project=escritorio --grep "E2E-16" --repeat-each=3 --retries=0`: estabilidad de E2E-16.
- E2E-06: `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA npm run dev` (llave pública de prueba de Cloudflare «siempre falla», solo en la variable de entorno del proceso) y `E2E_TURNSTILE_FALLA=1 npx playwright test e2e/001-arquitectura.spec.ts --project=escritorio --grep "E2E-06 "`.
- E2E-19: `E2E_LCP=1 npx playwright test --config e2e/lcp.config.ts`.

Probador independiente: no leyó código de producción. Los datos de prueba llevan el prefijo `e2e-20261021-` y el dominio `@ejemplo.co`. Se borraron al terminar (proyectos, aportes, aportantes, historial, editores y usuarios de Auth). Al cierre, la base de **pruebas** está como al inicio: 7 proyectos, 7 filas de historial (las de la importación), 1 editor (`obsersae_med@unal.edu.co`), 1 usuario de Auth y el aporte 100, que ya existía. El servidor local quedó detenido.

**Resumen: 19 escenarios; 19 pasan, 0 fallan, 0 enteramente no comprobables** (con tres alcances parciales, ver «No comprobables»). Los tres que fallaron el 10-20 (E2E-09/RNF-04, E2E-11/CA-11.1 y E2E-16/CA-16.1) pasan ahora.

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1 | ✅ Pasa | El proyecto `Pendiente` (900 MW) no aparece en `/`, `/mapa`, `/vehiculos`, `/normativa`, `/noticias`, `/aportar`, `/datos/proyectos.csv` ni `/datos/noticias.csv`, ni lo devuelve la API con la llave anónima, y no entra al KPI. El aprobado sembrado directo en la base se vio a los ~5 min (caché; dentro de RF-10). Consola sin errores. |
| E2E-02 | CA-02.1 | ✅ Pasa | Tarjetas separadas «Potencia en operación [MW]» y «Energía en operación [MWh]». Suman solo los `Aprobado` + `En operación`, con coma decimal. Los conteos por estado coinciden con la base y excluyen el pendiente. Consola sin errores. |
| E2E-03 | CA-03.1 | ✅ Pasa | Sin fuente, el navegador bloquea el envío y enfoca «Enlace de la fuente» (`valueMissing`). Saltando la validación del navegador, el servidor responde «Revisa lo siguiente:» y nombra la fuente. No se crea aporte. |
| E2E-04 | CA-03.2 | ✅ Pasa | Igual con «Correo de contacto». No se crea aporte. |
| E2E-05 | CA-04.1, CA-06.1 | ✅ Pasa | Número de seguimiento visible; los KPI, el conteo por estado y el CSV de `/` no cambian; el aporte figura en `/admin` como `Pendiente`; el correo no aparece en `/`. En la corrida completa el primer intento falló y el reintento pasó; ver «Observaciones» (lectura demasiado temprana del bloque «Proyectos por estado»). Con la espera corregida en la prueba pasó al primer intento en la confirmación. |
| E2E-06 | CA-05.1 | ✅ Pasa | Corrida aparte con la llave secreta «siempre falla»: alerta de verificación, sin número de seguimiento y sin aporte guardado. E2E-06b (complementaria): un envío sin `cf-turnstile-response` también se rechaza y no se guarda. |
| E2E-07 | CA-05.2 | ✅ Pasa | Cinco aportes válidos reciben número de seguimiento; el 6.º muestra un mensaje de espera y no se guarda. |
| E2E-08 | CA-07.1 | ✅ Pasa | `/admin` sin sesión redirige a `/admin/entrar`. Un correo no autorizado recibe la respuesta neutra «Si ese correo está autorizado…» y no se crea usuario ni enlace en Supabase Auth. Una sesión válida que no está en `editores` no ve la lista ni «Aprobar y publicar». |
| E2E-09 | CA-08.1 | ✅ Pasa | La lista muestra N.º, tipo, origen «Usuario», fecha `dd/mm/aaaa` y la fuente enlazada. El detalle muestra en la fila «Potencia nominal [MW]» el valor actual (3) y el propuesto (4,5), con el enlace a la fuente del aporte. |
| E2E-09 | RNF-04 | ✅ Pasa (antes ❌) | Propuesto «4,5» con coma; encabezado de fila «Potencia nominal [MW]» (nombre legible con unidad entre corchetes); ningún nombre técnico con guion bajo en la página; fecha «21/10/2026»; en «Ajustar y aprobar» los campos muestran «4,5» y «-73,91». Ver la observación sobre «Tecnologia». |
| E2E-10 | CA-09.1 | ✅ Pasa | «Rechazar aporte» sin motivo muestra una alerta que pide el motivo (también saltando la validación del navegador) y el aporte sigue `Pendiente`. |
| E2E-11 | CA-09.2 | ✅ Pasa | Propuesto 4,5 MW, ajustado a 5,25 MW: se publica 5,25. El aporte guarda `datos` = 4.5 y `datos_aprobados` = 5.25. |
| E2E-11 | CA-10.1 | ✅ Pasa | La versión ajustada se ve en `/datos/proyectos.csv` unos 3 s después de aprobar, sin intervención manual. |
| E2E-11 | CA-11.1 | ✅ Pasa (antes ❌) | Desde el detalle del aporte, el enlace «Ver el cambio en el historial» lleva a `/admin/historial?aporte=N` («Historial de cambios»), también accesible desde «Historial» en la navegación de editores. La fila tiene fecha «21/10/2026», el correo del editor, el enlace «N.º N» al aporte, «Potencia nominal [MW]: 3 → 5,25» y una sola fuente, la **del aporte** (`…/correccion-aprobada-…`). En la base, `historial.fuente` = fuente del aporte. El registro publicado conserva la fuente anterior y suma la del aporte (en la base y en la línea del CSV público). Sin sesión, `/admin/historial` redirige al acceso. Pasó en la corrida completa y en la confirmación. |
| E2E-12 | CA-12.1 | ✅ Pasa | `proponer_aporte.py --entorno pruebas --tipo Noticia --agente e2e-20261021-agente-noticias` termina en 0; el aporte queda `Pendiente` con origen `agente`. En `/admin` la fila y el detalle muestran el origen «agente» y el nombre del agente. |
| E2E-13 | CA-13.1 | ✅ Pasa | `respaldo.py --entorno pruebas --carpeta <tmp>` (con un `GIT_DIR` inexistente para no tocar el repositorio) genera `proyectos.csv`, `normativa.csv` y `noticias.csv` sin correos. Contra una API caída sale con código ≠ 0, mensaje de error y sin escribir archivos. En GitHub, la corrida **programada** de «Respaldo diario» del 2026-10-21 11:24 UTC terminó en éxito con «proyectos.csv: 7 registros» y «Sin cambios en los datos publicados.» (por eso no hay commit nuevo; el último es `b0904f5`, del 10-20). |
| E2E-14 | CA-14.1 | ✅ Pasa | `/datos/proyectos.csv`: `content-type: text/csv`, `content-disposition: attachment`, licencia CC BY 4.0, columna `Fuente`, todos los aprobados de la base, ningún pendiente y ningún correo. `/datos/noticias.csv` también trae la licencia. |
| E2E-15 | CA-15.1 | ✅ Pasa | Con el CSV original (commit `f98891d`, coordenadas `49,653`), `importar.py --simular` lista un RECHAZO por coordenadas fuera de rango para cada uno de los 7 proyectos y sale con 1. Con un CSV corregido de prueba (nombres prefijados) responde «7 proyectos válidos» y sale con 0. |
| E2E-16 | CA-16.1 | ✅ Pasa (antes ❌) | En la aprobación, «Estado *» es una lista (combobox) con solo «En operación», «En construcción», «Anunciado» e «Inactivo». Las tres vías rechazan `Planeado` con el mismo texto: «'Estado' = 'Planeado' no está entre los valores permitidos: En operación, En construcción, Anunciado, Inactivo» (importación `--simular`; aprobación con una opción inyectada en el navegador; inserción directa en `proyectos` con la llave de servicio). No queda ningún proyecto `Planeado` y el aporte sigue `Pendiente`. 3 de 3 repeticiones sin reintentos en verde. |
| E2E-17 | CA-17.1 | ✅ Pasa | Con `prefers-reduced-motion: reduce`, en escritorio y a 375 px, los KPI muestreados cada 20 ms durante 4 s muestran un solo valor y no hay animaciones en curso. Sin la preferencia sí hay conteo animado (referencia de RF-17). |
| E2E-18 | RNF-01, RNF-03 | ✅ Pasa | A 375 px (proyecto `movil-375` y escritorio reducido) no hay desplazamiento horizontal en `/`, `/aportar`, `/mapa`, `/vehiculos`, `/normativa`, `/noticias` ni `/admin/entrar`; axe (WCAG 2.0/2.1 A y AA) sin violaciones serias ni críticas; consola sin errores; el primer Tab lleva a «Saltar al contenido». |
| E2E-19 | RNF-02 | ✅ Pasa | Sitio de prueba https://observatorio-almacenamiento.vercel.app (build de producción, datos de **pruebas**, solo lectura), móvil emulado con red 4G lenta (150 ms RTT, 1,6 Mb/s) y CPU 4× más lenta, 3 mediciones por página. Mediana de LCP: `/` 1,76 s, `/aportar` 1,51 s, `/mapa` 1,44 s, `/vehiculos` 1,46 s, `/normativa` 1,54 s, `/noticias` 1,72 s. Una medición aislada de `/aportar` llegó a 2,50 s. |
| Extra | RNF-07 | ✅ Pasa | Ninguna respuesta HTML, JS, JSON o texto recibida por el navegador en `/`, `/aportar`, `/admin/entrar` y `/mapa` contiene la llave de servicio ni el secreto de Turnstile. |
| Extra | RNF-09 | ✅ Pasa | `/`, `/aportar`, `/mapa`, `/vehiculos`, `/normativa` y `/noticias` tienen título y `meta description` propios, sin títulos repetidos. |

Pruebas: `web/e2e/001-arquitectura.spec.ts`, `web/e2e/001-lcp.spec.ts`, `web/e2e/lcp.config.ts`, `web/e2e/utilidades.ts` y `web/e2e/csv_prueba.py`.

Cambios en las pruebas respecto del 10-20 (para seguir la spec ajustada, no para hacerlas pasar):
- E2E-09: RNF-04 pasa a verificar también el nombre legible «Potencia nominal [MW]», la ausencia de nombres técnicos, la fecha del detalle y la coma en los campos de «Ajustar y aprobar».
- E2E-11: la fuente del historial debe ser la del aporte (comprobación firme), el registro debe acumular ambas fuentes (base y CSV) y el historial se consulta en `/admin` (columnas, enlace al aporte y fuente), no solo con la llave de servicio.
- E2E-16: tres vías (aprobación, base e importación) según el RF-16 actual; se comprueba que Estado sea una lista y que las tres den el mismo mensaje. Se quitó la vía del formulario público.
- E2E-05 y E2E-16: esperas para no leer la página antes de tiempo (ver «Observaciones»).

## Fallas
Ninguna en esta corrida.

## No comprobables
Ningún escenario quedó entero sin comprobar. Hay tres alcances parciales:
- **CA-13.1, «aviso de error si falló» en la ejecución diaria.** Ya se observó una corrida programada (10-21, éxito, sin cambios que publicar). No se puede provocar una falla de la ejecución programada sin tocar la configuración de CI; solo se comprobó que el script termina con error y sin reescribir archivos cuando la API falla. Tampoco se ha observado aún un commit producido por una corrida programada (el 10-21 no hubo cambios en los datos).
- **CA-15.1, importación real.** Se comprobó con `--simular`. No se hizo la importación real del CSV corregido para no tocar los 7 proyectos de **pruebas**; la ayuda del script no dice si reemplaza la tabla o agrega filas.
- **RNF-02 con Lighthouse.** El LCP se midió con una emulación de red y CPU equivalente a la de Lighthouse para móvil, no con Lighthouse, y sobre el build publicado (no se puede compilar en local con `npm run dev` encendido por el límite de 3,4 GB de RAM). No se pudo verificar desde fuera si el build publicado incluye los últimos cambios del repositorio.

## Observaciones (no son fallas de la spec)
- **Lectura temprana de «Proyectos por estado» (E2E-05).** En el primer intento de la corrida completa, la lectura del árbol de accesibilidad del grupo «Proyectos por estado», hecha justo después de cargar `/`, salió vacía; la siguiente lectura ya tenía los conteos (traza en `web/test-results/`). La prueba ahora espera a que el grupo tenga contenido. Puede deberse a que el bloque queda un instante fuera del árbol de accesibilidad mientras se hidrata o anima; no se observó con lectores de pantalla.
- **Opción inyectada antes de hidratar (E2E-16).** Si la opción «Planeado» se inyecta en la lista antes de que la página termine de hidratarse, React la descarta y el servidor responde «'Estado' es obligatorio». Es un efecto de la manipulación de la prueba, no del uso normal; la prueba ahora espera a que la red quede inactiva.
- **«Tecnologia» sin tilde.** En `/admin` (tabla de datos propuestos, campos de «Ajustar y aprobar» e historial) la etiqueta aparece como «Tecnologia», sin tilde. Es un nombre legible, pero con una errata (probablemente viene del nombre de la columna de la fuente). Igual en el historial de las filas importadas: «Inyección de energia por la noche».
- **Valor actual tras aprobar.** En el detalle de un aporte ya aprobado, la columna «Valor actual» muestra el valor vigente (5,25, el ajustado) frente al «Propuesto» original (4,5). Es coherente, pero puede confundir al leerlo como el «antes»; el «antes» real (3) está en el historial.
- **Caché.** Los cambios hechos directamente en la base tardan ~5 min en verse en `/` y en `/datos/proyectos.csv`; los que pasan por la aprobación se ven en ~3 s.
- **Idioma de la validación del navegador.** El mensaje de los campos obligatorios sale en el idioma del navegador (en Chromium headless, en inglés); el del servidor sí está en español.
- **Repositorio.** Al terminar, `git status` muestra cambios en `CLAUDE.md`, `specs/README.md` y `specs/002-implementacion/` que no hizo este probador; los únicos cambios del probador son `web/e2e/001-arquitectura.spec.ts` y este informe.

## Corrida anterior (2026-10-20)
19 escenarios: 17 en verde y 3 hallazgos (2 criterios y 1 RNF):
- **F1 · CA-11.1 (E2E-11):** `historial.fuente` guardaba la fuente anterior del registro, no la del aporte, y el historial no se podía consultar en `/admin` (`/admin/historial` daba 404).
- **F2 · CA-16.1 (E2E-16):** la aprobación y la importación coincidían, pero la base respondía con el texto del `check constraint`; el formulario público no tenía campo Estado y en la aprobación Estado era texto libre.
- **F3 · RNF-04 (E2E-09):** en `/admin` el valor propuesto salía «4.5» (con punto) y el campo con su nombre técnico `potencia_nominal_mw`.

Después se ajustaron la spec (RF-16/CA-16.1 a tres vías con Estado como lista; CA-11.1 con historial en `/admin`, fuente del aporte y fuente acumulada). En esta corrida los tres hallazgos quedan resueltos.
