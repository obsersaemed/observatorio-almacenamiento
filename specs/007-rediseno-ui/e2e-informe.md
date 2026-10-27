# Informe E2E · 007
Fecha: 2026-10-27 · Entorno: local (`npm run dev` conectado al proyecto Supabase «pruebas», sin sembrar datos; solo lectura de la base) · Comando: `npx playwright test -c e2e/007.config.ts --project=escritorio --workers=1 --retries=1`

Resultado: 42 de 42 escenarios pasan al primer intento (5,6 min). Además, una prueba nueva de RNF-03 pasa.
Prueba: `web/e2e/007-rediseno.spec.ts`. Escritorio a 1280 × 900; E2E-40 a 375 × 812.

| Escenario | Criterio | Resultado | Evidencia |
|---|---|---|---|
| E2E-01 | CA-01.1, RNF-04 | ✅ Pasa | axe (wcag2a/aa, 21a/aa) en las seis páginas: sin violaciones serias, críticas ni de contraste |
| E2E-02 | CA-01.2 | ✅ Pasa | Recorrido de todos los nodos de texto visibles: ninguno naranja sobre fondo claro |
| E2E-03 | CA-02.1 | ✅ Pasa | Encabezado rgb(63, 69, 72); barra rgb(232, 147, 90); menú en el orden de RF-02 |
| E2E-04 | CA-02.2 | ✅ Pasa | «Normativa» con `aria-current="page"` y borde inferior naranja ≥ 2 px; las demás sin él |
| E2E-05 | CA-03.1 | ✅ Pasa | En las cuatro secciones: h1, luego cifras/contenido; la intro (= meta description) es el último bloque de `main` |
| E2E-06 | CA-04.1 | ✅ Pasa | «Filtros» gris oscuro con texto blanco; «Descargar CSV» blanco con borde gris; radio ≤ 8 px; sin degradados ni sombras naranja |
| E2E-07 | CA-05.1 | ✅ Pasa | Orden de la tabla con un SVG Lucide; sin ▲/▼ ni emojis en `/mapa` e inicio; ícono del vehículo con `fill="none"` |
| E2E-08 | CA-06.1 | ✅ Pasa | Fondo `fondo-colombia` fijo, opacidad < 0,3 y detrás del contenido en las seis páginas |
| E2E-09 | CA-07.1 | ✅ Pasa | Grupo de pestañas claro (luminancia > 0,8), activa oscura (< 0,25), inactivas transparentes |
| E2E-10 | CA-08.1, CA-08.2 | ✅ Pasa | Panel recogido, «Filtros» y «N proyectos» = filas de la tabla; «Ocultar filtros» al desplegar. Sin búsqueda, según CA-08.1 vigente (la columna del plan aún dice «con búsqueda») |
| E2E-11 | CA-08.3 | ✅ Pasa | Chip «En operación», «Filtros (1)», conteo reducido; al quitar vuelve al total |
| E2E-12 | CA-08.4 | ✅ Pasa | `/normativa` recogida con «Filtros» y «N normas»; con `?entidad=CREG` chip y «Filtros (1)» |
| E2E-13 | CA-09.1 | ✅ Pasa | `/mapa?estado=En%20operación`: panel recogido, chip y tabla solo con «En operación» |
| E2E-14 | CA-10.1, CA-10.3 | ✅ Pasa | Acumulado por año = suma de `/mapa` filtrado por los tres estados; formato «d,d» |
| E2E-15 | CA-10.2 | ✅ Pasa | Proyección naranja, resto gris; la proyección es un bloque final continuo; nota visible |
| E2E-16 | CA-11.1 | ✅ Pasa | Con movimiento reducido: alturas iguales a 0 y 1,5 s, sin transiciones ni animaciones |
| E2E-17 | CA-11.2 | ✅ Pasa | Dos capturas a 10 s idénticas en las seis páginas (lienzo del mapa enmascarado); sin animaciones infinitas |
| E2E-18 | CA-12.1 | ✅ Pasa | Tres tarjetas con los textos de RF-12 y enlaces a `/mapa`, `/vehiculos`, `/normativa` |
| E2E-19 | CA-12.2 | ✅ Pasa | Los puntos de la tarjeta coinciden en número y color con los puntos del mapa de `/mapa` |
| E2E-20 | CA-13.1 | ✅ Pasa | MW y MWh del inicio = suma de `/mapa` en operación, en tarjetas separadas |
| E2E-21 | CA-14.1 | ✅ Pasa | Hasta 3 noticias con `<time>` en orden descendente; «Aportar» abre `/aportar` |
| E2E-22 | CA-15.1 | ✅ Pasa | Orden vertical KPI → filtros → gráficas → mapa → tabla; las tres gráficas a la misma altura |
| E2E-23 | CA-16.1, CA-16.2 | ✅ Pasa | `tablist` con «Gran escala» seleccionada; flechas cambian selección y foco |
| E2E-24 | CA-17.1 | ✅ Pasa | Todos los puntos dentro del encuadre inicial; créditos de OpenStreetMap visibles |
| E2E-25 | CA-17.2 | ✅ Pasa | «Acercar», «Alejar» y la rueda cambian la dispersión de los puntos |
| E2E-26 | CA-17.3 | ✅ Pasa | Clic en un punto abre el diálogo con el nombre del proyecto |
| E2E-27 | CA-18.1 | ✅ Pasa | «Sección en construcción» y explicación, sin `.maplibregl-map` ni puntos; al volver reaparecen |
| E2E-28 | CA-19.1 | ✅ Pasa | Nueve encabezados exactos y en orden |
| E2E-29 | CA-20.1 | ✅ Pasa | Tras el h1: tarjeta de vehículos (= conteo de la barra), MWh en es-CO y tabla de % que suma 100 |
| E2E-30 | CA-21.1 | ✅ Pasa | Barra con «Fuentes: …», «Última actualización: dd/mm/aaaa» y «Ventas hasta el dd/mm/aaaa» |
| E2E-31 | CA-22.1 | ✅ Pasa | Las cuatro gráficas visibles y debajo de las cifras |
| E2E-32 | CA-23.1 | ✅ Pasa | Un punto por ficha, antes de la línea de tiempo; años marcados; leyenda = emisores, colores coinciden |
| E2E-33 | CA-23.2 | ✅ Pasa | Con CREG: mismos puntos que fichas, todos CREG |
| E2E-34 | CA-24.1 | ✅ Pasa | `tooltip` con emisor, tipo y número, fecha y título (contrastados con la ficha), con mouse y con Tab |
| E2E-35 | CA-25.1 | ✅ Pasa | Primer y último punto: ficha resaltada (contorno) y a la vista sin otro clic |
| E2E-36 | CA-25.2 | ✅ Pasa | Enter: ficha resaltada, a la vista y con el foco |
| E2E-37 | CA-26.1 | ✅ Pasa | N fichas = conteo; «Ver explicación» en todas y se despliega; navegación por año = secciones |
| E2E-38 | CA-27.1, CA-27.2 | ✅ Pasa | Banda de tema con SVG y nombre como primer hijo de cada tarjeta; sin `<img>` ni imágenes externas |
| E2E-39 | CA-28.1–28.3 | ✅ Pasa | Tema de cada noticia aprobada = regla de RF-28 aplicada a sus etiquetas en la base de pruebas |
| E2E-40 | RNF-01 | ✅ Pasa | 375 px: sin desplazamiento horizontal en las seis páginas; tarjetas, noticias y gráficas en una columna |
| E2E-41 | RNF-02 | ✅ Pasa | KPI con coma decimal, punto de miles y unidad entre corchetes en `/`, `/mapa`, `/vehiculos` |
| E2E-42 | RNF-06 | ✅ Pasa | Consola sin errores ni excepciones en las seis páginas |
| (extra) | RNF-03 | ✅ Pasa | Con movimiento reducido: sin `scroll-behavior: smooth` ni animaciones en curso en las seis páginas; la ficha queda a la vista en el cuadro siguiente al clic |
| (extra) | RNF-07 | ✅ Pasa | `web/package.json` sin cambios respecto a `HEAD` (`git diff`): no hay librerías nuevas |

## Fallas
Ninguna.

## No comprobables
- **RNF-05 (LCP en el sitio publicado):** el rediseño no está publicado (se publica después
  del MVP con confirmación del usuario). En `npm run dev` el LCP no es comparable con las
  referencias de producción.
- **CA-01.1, parcial:** axe no evalúa el contraste de textos sobre imágenes, degradados o el
  lienzo del mapa; esos casos quedan sin medir.
- **CA-05.1, parcial:** se comprobaron los íconos dentro de botones y enlaces de `main` y la
  ausencia de emojis y ▲/▼. No hay forma automática de afirmar que todo SVG decorativo es del
  mismo juego de trazo.
- **RNF-04, parcial:** axe en las seis páginas y teclado en las pestañas, los filtros y los
  puntos de `/normativa`. No se recorrió con Tab cada control del sitio para comprobar el foco
  visible, ni `/admin`.
- **CA-17.1, parcial:** se comprobó que todos los puntos de los proyectos caben en el encuadre
  inicial, no el contorno completo de Colombia continental (no es observable desde el DOM).

## Notas
- La columna «Resultado esperado» de E2E-10 en `plan.md` dice «con búsqueda», pero CA-08.1 se
  cambió el 2026-10-27 («sin búsqueda»). La prueba sigue la spec.
- Solo se corrió el proyecto `escritorio`: los escenarios fijan su propio ancho (1280 o 375 px).
