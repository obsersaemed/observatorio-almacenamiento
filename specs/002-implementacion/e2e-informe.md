# Informe E2E · 002
Fecha: 2026-10-21 (cuarta corrida, después de T23: filtros como desplegables) · Entorno: local (`npm run dev` en `web/`, puerto 3000) contra Supabase **pruebas** · Comando: `cd web && E2E_URL=http://localhost:3000 E2E_PREFIJO=e2e-20261021d- node node_modules/@playwright/test/cli.js test -c e2e/002.config.ts --retries=0 --workers=1 --project=escritorio` (y luego `--project=movil-375`), en Git Bash con `MSYS_NO_PATHCONV=1`

Pruebas: `web/e2e/002-implementacion.spec.ts`. Configuración: `web/e2e/002.config.ts` (WebGL por software para MapLibre). Evidencia: `web/test-results/002-evidencia-d/` (`d-escritorio.txt` y `d-movil.txt`, con la salida de la lista y el reporte JSON, que incluye las anotaciones de cada escenario).

Cambios en las pruebas para esta corrida (lo que se espera según la spec no cambió):
- Los filtros se usan **a través del desplegable**. Para marcar un valor, la prueba abre el botón del filtro (por ejemplo, «Estado Todas»), espera el buscador «Buscar en Estado», marca la casilla «Valor (n)» y cierra con Escape. Para saber si un valor está marcado, abre el desplegable, lo lee y lo vuelve a cerrar.
- **E2E-12**: además se comprueba que los botones resumen lo elegido («Departamento 2 seleccionados», «Estado En operación»).
- **E2E-13**: las opciones de municipio se leen del grupo «Opciones de Municipio», sin contar «Todas». También se anota el comportamiento del desplegable: buscador, Escape y clic afuera.
- **E2E-15** y **E2E-16**: los filtros se comprueban por el nombre de los botones y abriendo los desplegables. Después de «Limpiar filtros», los 7 botones dicen «Todas» y, en Estado y Departamento, solo está marcada la casilla «Todas».
- **E2E-22**: a 375 px se comprueba que el panel viene plegado, porque el botón «Estado …» está oculto. Luego se abre el panel y el desplegable de Departamento, se marca Antioquia y se comprueba que el desplegable cabe en la pantalla, sin desplazamiento horizontal.
- El indicador de desarrollo de Next.js (`<nextjs-portal>`) se sigue ocultando con un estilo que inyecta la prueba.

Notas de la corrida:
- Datos sembrados con el prefijo `e2e-20261021d-` y el dominio `@ejemplo.co`. Al terminar, la base quedó como al empezar: **7 proyectos, todos aprobados**; 1 aporte, 1 aportante, 1 editor y 12 filas de historial. No quedaron filas ni usuarios `e2e-`.
- Corrí todo con 1 worker y en dos tandas: escritorio (22 pruebas, 7,4 min) y 375 px (3 pruebas). Ningún escenario falló, así que no hubo que repetir nada. Al terminar detuve `npm`, `next dev` y el proceso hijo de Turbopack. Los puertos 3000 y 3001 quedaron libres.
- No modifiqué código de producción. Comparé huellas MD5 de todos los archivos versionados y no ignorados fuera de `web/e2e/` y de este informe, antes y después de la corrida, y no cambió ninguno. Los cambios en `web/src/components/mapa/` y en `plan.md` que muestra `git status` ya estaban antes de la corrida (T23). Borré los diagnósticos temporales (`e2e/diag-d.spec.ts`, `e2e/estado-d.ts`).

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1 | ✅ Pasa | Hay un punto por cada aprobado con coordenadas y los nombres coinciden con la base. Cada punto tiene el color de su estado en la leyenda (4 colores distintos) y las posiciones respetan latitud y longitud. Se ve la atribución de OSM. Consola sin errores. |
| E2E-02 | CA-01.2 | ✅ Pasa | El `Pendiente` sembrado no aparece en la tabla, ni como punto, ni en el HTML. |
| E2E-03 | CA-02.1 | ✅ Pasa | Con `aria-sort="descending"`, la primera fila es la de mayor potencia (50,0). Cifras con coma decimal, en orden descendente. |
| E2E-04 | CA-03.1 | ✅ Pasa | La fila dice «sin ubicación en el mapa» y no hay punto. |
| E2E-05 | CA-04.1 | ✅ Pasa | Con el mouse sobre el punto se abre la tarjeta, que sigue abierta 1,5 s después. Al salir del punto y de la tarjeta se cierra. La tarjeta cubre el punto (punto en 621,360; tarjeta en x 476–764, y 151–529), así que la salida pasa por ella (O-9). Escape con la tarjeta abierta por el mouse ahora **la cierra** (O-8 resuelta). |
| E2E-06 | CA-04.2 | ✅ Pasa | A 375 px se tocaron los 14 puntos. En todos, la tarjeta se abre completa, sin partes tapadas ni recortadas y sin desplazamiento horizontal. Consola sin errores. |
| E2E-07 | CA-04.3 | ✅ Pasa | Con Tab se llega a «BESS Termozipa · En operación» y su tarjeta se abre. Escape la cierra, y «Cerrar» también. |
| E2E-08 | CA-05.1 | ✅ Pasa | Muestra «50,0 MW», «195,0 MWh», «3,9 h», «115 kV», Neiva y Huila. El único enlace es «Proponer corrección». |
| E2E-09 | CA-05.2 | ✅ Pasa | «Servicios: Sin dato». No aparecen «Punto de conexión» ni «Año de FPO», y no queda ningún renglón vacío. |
| E2E-10 | CA-06.1 | ✅ Pasa | Desde la tarjeta se llega a `/aportar` con «Tipo de aporte» = Corrección y «Registro que se corrige» = el proyecto. |
| E2E-11 | CA-07.1 | ✅ Pasa | La tarjeta queda abierta y el punto queda a 0 px del centro del mapa. |
| E2E-12 | CA-08.1 | ✅ Pasa | Con Antioquia + Boyacá + En operación, elegidos en los desplegables, quedan solo los 2 esperados. Los botones dicen «Departamento 2 seleccionados» y «Estado En operación». |
| E2E-13 | CA-08.2 | ✅ Pasa | Con Antioquia, el desplegable de Municipio ofrece solo «Apartadó (1)» y «Medellín (1)». Si se busca «Mede», queda solo «Medellín (1)». Escape y un clic afuera cierran el desplegable. |
| E2E-14 | CA-09.1 | ✅ Pasa | Puntos, filas, KPI («4») y filas del CSV tienen los mismos 4 proyectos. |
| E2E-15 | CA-10.1 | ✅ Pasa | La URL abierta en otra pestaña muestra «Departamento 2 seleccionados» y «Estado Anunciado». Al abrir los desplegables están marcados Antioquia, Huila y Anunciado, y En operación no. El resultado es el mismo. |
| E2E-16 | CA-10.2 | ✅ Pasa | «Limpiar filtros» deja `/mapa` sin parámetros, con todos los aprobados. Los 7 botones dicen «Todas» y, en los desplegables, solo «Todas» está marcada. |
| E2E-17 | CA-11.1 | ✅ Pasa | «Instalado» no cambia y «Según filtros (todos los estados)» suma solo los anunciados. MW y MWh van en tarjetas distintas. |
| E2E-18 | CA-12.1 | ✅ Pasa | Con `?departamento=Antioquia&estado=Inactivo`: sin puntos, «Ningún proyecto cumple estos filtros» y KPI en 0, «0,0 MW» y «0,0 MWh». El botón de Estado dice «Inactivo» y la casilla se ve marcada en el desplegable. |
| E2E-19 | CA-13.1 | ✅ Pasa | El CSV trae solo los 2 de Boyacá, con la columna `Fuente` (URL) y «CC BY 4.0», y sin ningún correo. |
| E2E-20 | CA-14.1 | ✅ Pasa | La aprobación ofrece solo las 3 casillas, y el envío manipulado con «Servicio X» se rechaza (el aporte sigue `Pendiente`). Las cuatro vías dan el mismo mensaje: «'Tipo uso/conexión' = 'Servicio X' no está entre los valores permitidos: Regulación primaria de frecuencia, Inyección de energía en la noche, Mercado regulado a través de contratos de largo plazo». |
| E2E-21 | CA-14.2 | ✅ Pasa | Aparece al filtrar (en el desplegable Servicios) por cualquiera de los dos servicios, y la tarjeta lista ambos. La importación simulada acepta los dos separados por coma. |
| E2E-23 | CA-04.4 | ✅ Pasa | **Mouse:** en los 14 puntos la tarjeta sigue abierta durante todo el recorrido y el enlace recibe el puntero. Al pulsarlo se llega a `/aportar` prellenado. **Toque (375 px):** el enlace recibe el toque y lleva a `/aportar` prellenado. **Teclado:** punto → Enter → Tab («Cerrar») → Tab («Proponer corrección») → Enter, y llega a `/aportar` prellenado. |
| E2E-22 | RNF-01, RNF-06, RNF-07 | ✅ Pasa | A 375 px no hay desplazamiento horizontal y los filtros vienen plegados. Con el panel abierto, el desplegable de Departamento ocupa x 42–333 y no hay desborde. Con movimiento reducido, los KPI muestran un solo valor desde el principio y el punto pasa a su posición en un solo salto (2 posiciones). Título y descripción propios. Consola sin errores. |
| RNF-02 | RNF-02 | ⚠️ No se volvió a medir | Hace falta `next build` + `next start`. |
| RNF-05 | RNF-05 | ⚠️ No comprobable | Ver «No comprobables». |
| RNF-08 | RNF-08 | ⚠️ No comprobable (parcial) | Ver «No comprobables». |

**Totales:** 23 escenarios del plan: **23 ✅ pasan, 0 ❌ fallan**. Además, 3 filas de RNF quedan **⚠️ no comprobables**: RNF-02 (no se volvió a medir), RNF-05 y RNF-08.

## Fallas
Ninguna en esta corrida.

### Observaciones (no bloquean ningún escenario)
- **O-8 (resuelta):** Escape ya cierra la tarjeta abierta con el mouse (anotación `escape-con-mouse = "cierra"` en E2E-05).
- **O-9 (sigue):** en escritorio la tarjeta se abre encima del punto y lo tapa. Así se cumple RF-04, pero CA-04.1 («se cierra al salir del punto sin pasar a la tarjeta») ya no se puede hacer al pie de la letra.
- **O-5 (sigue):** después de borrar lo sembrado, `/mapa` siguió mostrando los puntos `e2e-` durante la tanda de 375 px: 14 puntos en E2E-06 y KPI con 287,0 MW. Se debe a la revalidación de la página.
- **O-6 (sigue):** la atribución del mapa dice «Data from OpenStreetMap», en inglés.
- **O-1 (sigue):** con Tab todavía se pasa por 5 elementos de MapLibre (lienzo, «Mostrar u ocultar la atribución» y 3 enlaces) antes del primer punto. Todos tienen nombre o son enlaces visibles.

## Corridas anteriores
- **Primera (2026-10-21):** 22 ✅, 2 ❌ (el toque no dejaba abierta la tarjeta; «Proponer corrección» no se alcanzaba desde el punto) y 2 ⚠️. Por ese informe cambiaron RF-04 y CA-04.1, y se agregaron CA-04.4 y E2E-23.
- **Segunda (prefijo `e2e-20261021b-`):** 21 ✅ y 2 ❌. En E2E-06 la atribución tapaba el enlace a 375 px, y en E2E-23 la tarjeta se cerraba o quedaba recortada. Ambas se corrigieron.
- **Tercera (prefijo `e2e-20261021c-`):** 23 ✅ y 0 ❌, con 3 RNF no comprobables. Se registró la O-8 (Escape no cerraba la tarjeta abierta con el mouse), que se corrigió con T22. Filtros como listas de casillas siempre visibles.

## No comprobables
- **RNF-02 (LCP):** no se volvió a medir en esta corrida. Hace falta un build de producción, y esta corrida usó `next dev`. La primera corrida midió una mediana de 1224 ms con `next start`. El registro de T14 dice 1,16 s.
- **RNF-05 (colores desde los tokens TEJ):** desde fuera solo se ve que los puntos y la leyenda usan colores consistentes con la leyenda. Para afirmar que *ningún* color está escrito a mano habría que leer el código o las hojas de estilo.
- **RNF-08 (sin costo y sin llaves de pago):** la atribución muestra OpenFreeMap / OpenMapTiles / OpenStreetMap y no se vieron peticiones con llave. No se auditaron todas las URL de las teselas ni el paquete del navegador, así que la comprobación es parcial.
