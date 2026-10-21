# Informe E2E · 002
Fecha: 2026-10-21 (tercera corrida) · Entorno: local (`npm run dev` en `web/`, puerto 3000) contra Supabase **pruebas** · Comando: `cd web && E2E_URL=http://localhost:3000 E2E_PREFIJO=e2e-20261021c- node node_modules/@playwright/test/cli.js test -c e2e/002.config.ts --retries=0 --workers=1 --project=escritorio` (y luego `--project=movil-375`), en Git Bash con `MSYS_NO_PATHCONV=1`

Pruebas: `web/e2e/002-implementacion.spec.ts`. Configuración: `web/e2e/002.config.ts` (WebGL por software para MapLibre). Evidencia: `web/test-results/002-evidencia-c/` (reportes JSON `c-escritorio.json` y `c-movil.json` con las anotaciones de cada escenario, y capturas).

Cambios en las pruebas para esta corrida (sin cambiar lo que se espera según la spec):
- El indicador de desarrollo de Next.js (`<nextjs-portal>`, esquina inferior izquierda) se oculta con un estilo inyectado por la prueba. No es parte de la app. Los errores de consola se siguen vigilando.
- **E2E-06** ya no revisa un solo punto: toca **cada punto libre** y comprueba, en cada uno, que la tarjeta se abre, que está dentro de los 375 px, que no hay desplazamiento horizontal y que ninguna parte (título, renglones y enlace) queda tapada o recortada.
- **E2E-23 (mouse)** recorre **cada punto libre**: centra el punto en la ventana, pasa el mouse sobre él y lo mueve en línea recta hasta «Proponer corrección» en 20 pasos. En cada paso comprueba que la tarjeta sigue abierta y, al final, que el enlace recibe el puntero. Luego pulsa el enlace en un punto y comprueba `/aportar`.
- **E2E-05**: la tarjeta ahora **cubre el punto**, así que no es posible "salir del punto sin pasar a la tarjeta". La prueba sale por el borde más cercano hasta un lugar fuera del punto y de la tarjeta, y espera que se cierre (RF-04: se cierra al salir de ambos).

Notas de la corrida:
- Datos sembrados con el prefijo `e2e-20261021c-` y el dominio `@ejemplo.co`. Al terminar, la base quedó como al empezar: **7 proyectos, todos aprobados**; 1 aporte, 1 aportante, 1 editor y 12 filas de historial; 0 filas `e2e-`.
- Esta vez el servidor no se quedó sin memoria. Corrí todo con 1 worker y en dos tandas (escritorio y 375 px). Al terminar detuve `npm run dev`, `next dev` y sus procesos hijos de Turbopack. Los puertos 3000 y 3001 quedaron libres.
- No modifiqué código de producción. Comparé huellas MD5 de todos los archivos fuera de `web/e2e/`, `web/node_modules/`, `web/.next/` y `web/test-results/`, antes y después de la sesión. Solo cambió `web/tsconfig.tsbuildinfo`, la caché incremental de TypeScript, que está en `.gitignore`: la reescribió `tsc --noEmit` al revisar los tipos de la prueba. Borré los diagnósticos temporales (`e2e/diag-c.*`).

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1 | ✅ Pasa | Hay un punto por cada aprobado con coordenadas y los nombres coinciden con la base. Cada punto tiene el color de la leyenda para su estado (4 colores distintos), y las posiciones respetan lat/long. Se ve la atribución de OSM. Consola sin errores. |
| E2E-02 | CA-01.2 | ✅ Pasa | El `Pendiente` sembrado no aparece en la tabla, ni como punto, ni en el HTML. |
| E2E-03 | CA-02.1 | ✅ Pasa | Con `aria-sort="descending"`, la primera fila es la de mayor potencia (50,0). Cifras con coma decimal y en orden descendente. |
| E2E-04 | CA-03.1 | ✅ Pasa | La fila dice «sin ubicación en el mapa» y no hay punto. |
| E2E-05 | CA-04.1 | ✅ Pasa | El mouse sobre el punto abre la tarjeta, que sigue abierta 1,5 s después con el puntero quieto. Al salir del punto y de la tarjeta se cierra. La tarjeta cubre el punto (punto en 621,360; tarjeta en x 476–764, y 151–529), así que la salida pasa por ella (ver O-9). |
| E2E-06 | CA-04.2 | ✅ Pasa | A 375 px se tocaron los 14 puntos. En los 14, la tarjeta se abre completa: «Proponer corrección» se ve y se puede tocar, no hay partes tapadas ni recortadas y no hay desplazamiento horizontal. La tarjeta se muestra debajo del mapa, fuera de la atribución (captura `tarjeta-tocada.png`). Pasó en 2 de 2 corridas. |
| E2E-07 | CA-04.3 | ✅ Pasa | Con Tab se llega a «BESS Termozipa · En operación» y su tarjeta se abre; Escape la cierra. «Cerrar» también la cierra. |
| E2E-08 | CA-05.1 | ✅ Pasa | Muestra «50,0 MW», «195,0 MWh», «3,9 h», «115 kV», Neiva y Huila. El único enlace es «Proponer corrección». |
| E2E-09 | CA-05.2 | ✅ Pasa | «Servicios: Sin dato». No aparecen «Punto de conexión» ni «Año de FPO», y ningún renglón queda vacío. |
| E2E-10 | CA-06.1 | ✅ Pasa | Desde la tarjeta se llega a `/aportar` con «Tipo de aporte» = Corrección y «Registro que se corrige» = el proyecto. |
| E2E-11 | CA-07.1 | ✅ Pasa | La tarjeta queda abierta y el punto a 0 px del centro del mapa. |
| E2E-12 | CA-08.1 | ✅ Pasa | Con Antioquia + Boyacá + En operación quedan solo los 2 esperados. |
| E2E-13 | CA-08.2 | ✅ Pasa | Con Antioquia, Municipio ofrece solo «Apartadó (1)» y «Medellín (1)». |
| E2E-14 | CA-09.1 | ✅ Pasa | Puntos, filas, KPI («4») y filas del CSV tienen los mismos 4 proyectos. |
| E2E-15 | CA-10.1 | ✅ Pasa | La URL abierta en otra pestaña marca los mismos filtros y da el mismo resultado. |
| E2E-16 | CA-10.2 | ✅ Pasa | «Limpiar filtros» deja `/mapa` sin parámetros, sin casillas marcadas y con todos los aprobados. |
| E2E-17 | CA-11.1 | ✅ Pasa | «Instalado» no cambia y «Según filtros (todos los estados)» suma solo los anunciados. MW y MWh van en tarjetas distintas. |
| E2E-18 | CA-12.1 | ✅ Pasa | Con `?departamento=Antioquia&estado=Inactivo`: sin puntos, «Ningún proyecto cumple estos filtros» y KPI en 0, «0,0 MW» y «0,0 MWh». La casilla «Inactivo» se ve marcada. |
| E2E-19 | CA-13.1 | ✅ Pasa | El CSV trae solo los 2 de Boyacá, la columna `Fuente` con URL y «CC BY 4.0», sin ningún correo. |
| E2E-20 | CA-14.1 | ✅ Pasa | La aprobación ofrece solo las 3 casillas, y el envío manipulado con «Servicio X» se rechaza (el aporte sigue `Pendiente`). Las cuatro vías dan el mismo mensaje: «'Tipo uso/conexión' = 'Servicio X' no está entre los valores permitidos: Regulación primaria de frecuencia, Inyección de energía en la noche, Mercado regulado a través de contratos de largo plazo». |
| E2E-21 | CA-14.2 | ✅ Pasa | Aparece al filtrar por cualquiera de los dos servicios y la tarjeta lista ambos. La importación simulada acepta los dos separados por coma. |
| E2E-23 | CA-04.4 | ✅ Pasa | **Mouse:** en los 14 puntos la tarjeta sigue abierta durante todo el recorrido y el enlace recibe el puntero. Al pulsarlo se llega a `/aportar` prellenado. Pasó en 2 de 2 corridas. **Toque (375 px):** el enlace es lo que recibe el toque y lleva a `/aportar` prellenado (2 de 2). **Teclado:** punto → Enter → Tab («Cerrar») → Tab («Proponer corrección») → Enter, y llega a `/aportar` prellenado. |
| E2E-22 | RNF-01, RNF-06, RNF-07 | ✅ Pasa | A 375 px no hay desplazamiento horizontal y los filtros vienen plegados. Con movimiento reducido, los KPI muestran un solo valor desde el principio y el punto pasa a su posición en un solo salto (2 posiciones). Título y descripción propios. Consola sin errores. |
| RNF-02 | RNF-02 | ⚠️ No se volvió a medir | Hace falta `next build` + `next start`. La mediana medida en la primera corrida fue 1224 ms. |
| RNF-05 | RNF-05 | ⚠️ No comprobable | Ver «No comprobables». |
| RNF-08 | RNF-08 | ⚠️ No comprobable (parcial) | Ver «No comprobables». |

**Totales:** 23 escenarios del plan: **23 ✅ pasan, 0 ❌ fallan**. Además, 3 filas de RNF quedan **⚠️ no comprobables** en esta corrida: RNF-02 (no se volvió a medir), RNF-05 y RNF-08.

## Fallas
Ninguna en esta corrida.

### Observaciones (no bloquean un escenario)
- **O-8 (RF-04, sin CA propio): Escape no cierra la tarjeta abierta con el mouse.** Pasos: en escritorio, pasar el mouse sobre «BESS Termozipa» (se abre la tarjeta) y pulsar Escape sin mover el mouse. Pasa lo mismo con el puntero sobre el enlace de la tarjeta de «Canadian solar». La tarjeta sigue abierta 1,8 s después (el foco está en `BODY`). Se cierra al sacar el puntero o con «Cerrar». RF-04 dice «Siempre se cierra con Escape o con «Cerrar»». Ningún CA ni escenario lo cubre: CA-04.3 solo prueba Escape con el teclado, y ahí funciona. Anotación `escape-con-mouse = "no cierra"` en E2E-05.
- **O-9:** en escritorio la tarjeta se abre encima del punto y lo tapa (por ejemplo, La Martina: punto en 657–673 × 352–368, tarjeta en 520–808 × 210–560). Así se cumple RF-04, porque no hay hueco que cruzar. Pero mientras la tarjeta está abierta no se ve el punto, y CA-04.1 («se cierra al salir del punto sin pasar a la tarjeta») ya no se puede hacer al pie de la letra.
- **O-5 (sigue):** después de borrar lo sembrado, `/mapa` siguió mostrando los puntos `e2e-` durante la tanda de 375 px (14 puntos en E2E-06 y KPI con 287,0 MW).
- **O-6 (sigue):** en la atribución del mapa se lee «Data from OpenStreetMap», en inglés (captura `tarjeta-tocada.png`).
- **O-1:** con Tab todavía se pasa por 5 elementos de MapLibre (canvas, «Mostrar u ocultar la atribución» y 3 enlaces) antes del primer punto. Todos tienen nombre en español o son enlaces visibles.

## Corridas anteriores
- **Primera (2026-10-21):** 22 ✅, 2 ❌ (el toque no dejaba abierta la tarjeta; «Proponer corrección» no se alcanzaba desde el punto) y 2 ⚠️. Por ese informe cambiaron RF-04 y CA-04.1, y se agregaron CA-04.4 y E2E-23.
- **Segunda (2026-10-21, prefijo `e2e-20261021b-`):** 21 ✅ y 2 ❌.
  - E2E-06 fallaba porque la atribución tapaba «Proponer corrección» a 375 px. **Corregido:** la tarjeta se muestra debajo del mapa y está completa en los 14 puntos.
  - E2E-23 fallaba con el mouse y con el toque. Con el mouse, la tarjeta se cerraba al cruzar el hueco de unos 6 px entre el punto y la tarjeta, o quedaba recortada por el marco del mapa. Con el toque, la atribución tapaba el enlace. **Corregido en las dos vías:** con el mouse se llega al enlace en los 14 puntos, y con el toque el enlace recibe el toque.
  - La lentitud de `next dev` que se vio en la segunda corrida no se repitió: E2E-10 y E2E-20 pasaron a la primera.

## No comprobables
- **RNF-02 (LCP):** no se volvió a medir en esta corrida. Hace falta un build de producción, y esta corrida usó `next dev`. El resultado anterior fue una mediana de 1224 ms con `next start`.
- **RNF-05 (colores desde los tokens TEJ):** desde fuera solo se ve que los puntos y la leyenda usan variables CSS. Para afirmar que *ningún* color está escrito a mano habría que leer el código o las hojas de estilo.
- **RNF-08 (sin costo y sin llaves de pago):** la atribución muestra OpenFreeMap / OpenMapTiles / OpenStreetMap y la consola no muestra peticiones con llave. No se auditaron todas las URL de las teselas ni el paquete del navegador, así que la comprobación es parcial.
