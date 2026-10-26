# Informe E2E · 005
Fecha: 2026-10-26 · Entorno: local (`next start` en http://localhost:3000, proyecto Supabase «pruebas», datos ficticios con prefijo `e2e-20261026-005-`) · Comando: `npx playwright test e2e/005-noticias.spec.ts` (desde `web/`, proyectos `escritorio` y `movil-375`, 1 worker, 1 reintento)

Prueba: `web/e2e/005-noticias.spec.ts`. Resultado de la corrida: 13 pruebas pasan, 1 falla (también en el reintento) y 12 se omiten porque solo aplican a un proyecto.

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1, CA-01.2 | ✅ Pasa | Orden 14/09/2026 → 03/02/2026 «alfa» → 03/02/2026 «beta» → 20/01/2025. Consola limpia. La página tardó unos 91 s en mostrar lo sembrado (caché de la página). |
| E2E-02 | CA-02.1 | ✅ Pasa | Cada tarjeta muestra la fecha dd/mm/aaaa, el medio, el título y el resumen, y no muestra la fecha ISO. Captura `noticias-escritorio.png`. |
| E2E-03 | CA-03.1 | ✅ Pasa | El texto «Si quieres saber más sobre esta noticia, haz clic en el enlace» aparece después del resumen. El enlace va a la URL de `enlace` con `target="_blank"` y abre una pestaña nueva con esa URL. |
| E2E-04 | CA-03.2 | ✅ Pasa | Nombres accesibles del tipo «Leer la noticia en <medio>: «<título>» (abre en una pestaña nueva)». No hay dos iguales. |
| E2E-05 | CA-04.1 | ✅ Pasa | Sin noticias aprobadas en la base se lee «Todavía no hay noticias publicadas». Consola limpia. |
| E2E-06 | CA-05.1 | ✅ Pasa | El título, el resumen y el enlace de la noticia `Pendiente` no están en el HTML. |
| E2E-07 | CA-06.1 | ✅ Pasa | Hay 9 aportes *Noticia* `Pendiente` con origen `agente` y agente `buscar-noticias`, todos de 2025 en adelante, con título, medio, enlace y resumen. En `/admin` cada fila muestra Noticia, Agente y el enlace, y el detalle muestra el enlace. Ninguno aparece en `/noticias`. |
| E2E-08 | CA-08.1 | ❌ Falla | «Aprobar y publicar» no publica y aparece la alerta «'publicacion' es obligatorio». Ver Fallas. Trazas: `web/test-results/005-noticias-005-·-Noticia-cff1e-rece-en-noticias-en-≤-5-min-escritorio/` y `…-escritorio-retry1/` (`trace.zip`, `error-context.md`). |
| E2E-09 | CA-09.1 | ✅ Pasa | No hay enlaces ni botones de descarga o CSV, `a[download]` ni texto «descargar». |
| E2E-10 | CA-10.1 | ✅ Pasa | La tarjeta «Noticias» del inicio (navegación «Secciones») y el menú «Principal → Noticias» llevan a `/noticias` con la lista. No aparece «Sección en construcción». |
| E2E-11 | RNF-01, RNF-03, RNF-06 | ✅ Pasa | A 375 px con `prefers-reduced-motion: reduce`: desborde horizontal 0, ningún elemento se sale a la derecha, ninguna animación al cargar ni al desplazarse y consola limpia. Captura `noticias-375.png`. |
| E2E-12 | RNF-04 | ✅ Pasa | axe (wcag2a/aa, wcag21a/aa) sin violaciones en escritorio y a 375 px. Los 12 elementos que se alcanzan con Tab tienen foco visible y los 4 enlaces de las notas se alcanzan con el teclado. |
| E2E-13 | RNF-05 | ⚠️ No comprobable (solo indicativo) | LCP local con 4G lenta y CPU 4×: 1268, 1164 y 1164 ms (mediana 1164 ms ≤ 2500 ms). No se midió la página publicada (ver No comprobables). |

## Fallas

### E2E-08 · CA-08.1: no se puede aprobar una noticia desde `/admin`
Pasos para reproducir:
1. Crear un aporte `tipo = Noticia`, `origen = agente`, `publicacion = Pendiente`, con `datos = {fecha, titulo, medio, enlace, resumen}`. Es la misma forma que tienen los 9 aportes de la carga inicial de `buscar-noticias` (por ejemplo, el N.º 308).
2. Entrar como editor a `/admin/<id>`.
3. Sin cambiar nada en «Ajustar y aprobar», pulsar «Aprobar y publicar».

Resultado esperado (RF-06, RF-08, CA-08.1): la noticia se aprueba y aparece en `/noticias` en 5 minutos o menos.

Resultado obtenido: la página sigue en `/admin/<id>` y el aporte queda en estado `Pendiente`. El formulario muestra la alerta **«'publicacion' es obligatorio»**, pero no tiene ningún campo `publicacion`: solo fecha, título, medio, enlace, resumen, etiquetas, proyecto_relacionado y norma_relacionada. El editor no tiene forma de completar ese dato, así que no puede aprobar ninguna noticia propuesta. Pasó lo mismo en el intento y en el reintento (aportes de prueba N.º 312 y 313, ya borrados). Por eso tampoco se puede publicar la carga inicial como pide RF-06.

## No comprobables
- **RNF-05 (E2E-13)**: la spec pide medir el LCP en la página publicada, pero este probador solo usa el entorno local o de pruebas. La medición local con red y CPU limitadas da una mediana de 1164 ms. Es solo una referencia, no el criterio.
- **CA-07.1 (RF-07)**: el criterio se comprueba leyendo el procedimiento de la skill `buscar-noticias`, no desde la interfaz, y el plan no le asigna escenario E2E. Desde fuera solo se observa algo relacionado: los 9 aportes de la carga inicial entran como aportes del agente `buscar-noticias` y no como filas de `noticias` (E2E-07).
- **RNF-07 (tokens TEJ)**: no se puede saber desde fuera si los colores salen de los tokens del design system. axe no encontró problemas de contraste.
- **RNF-08 (noticias no inventadas, resumen propio)**: hace falta comparar cada nota real con su medio, y eso no es una comprobación automática. Solo se verificó que los 9 aportes tienen fecha, medio, enlace y resumen, y que su fecha es de 2025 en adelante.
- **RNF-02**: el formato dd/mm/aaaa sí se comprobó (E2E-02). Que todo el texto esté en «español de Colombia» no se evaluó de forma automática.

## Repetición (2026-10-26)

Con T11 (aprobar noticias en `/admin` sin exigir `publicacion`): `npx playwright test e2e/005-noticias.spec.ts --workers=1` contra `next start` y Supabase «pruebas»: **14 pasan, 0 fallan** (escritorio y 375 px). E2E-08 ya pasa. E2E-13 (LCP) queda para medirlo en el sitio publicado.
