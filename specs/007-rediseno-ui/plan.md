# 007 · Rediseño de la interfaz — Plan

Estado: Terminado (E2E limpio 42/42; aprobado por el usuario el 2026-10-27; sin publicar)
Fecha: 2026-10-26
Spec: [spec.md](spec.md)

## Enfoque técnico
Se usa el enfoque A del brainstorm: se reestilizan y reordenan los componentes que ya
existen. No hay librerías nuevas: `lucide-react`, `motion`, MapLibre, Recharts y TanStack ya
están en el proyecto. Los datos, los cálculos y los filtros en la URL no cambian.

Se reutiliza lo que ya existe:
- **Tokens TEJ** (`styles/tokens/colors.css`): el gris oscuro `--teal-600` (#3f4548) pasa a
  ser el del encabezado y los botones principales, y `--peach-400`/`--peach-300` son los
  acentos.
- **Pestañas** (`graficas/pestanas.tsx`): se usan también para las pestañas del mapa.
- **Filtros en la URL** (`lib/filtros-url.ts`, `use-filtros-url.ts`): los chips leen y quitan
  valores con las mismas funciones.
- **Cálculos de `lib/graficas-mapa.ts`:** la gráfica de crecimiento usa una función pura
  nueva y no toca `evolucion()`, que separa los estados de otra forma.
- **Imagen de fondo** `public/fondo-colombia.png`: es también el mapa de la tarjeta de
  Implementación del inicio. Usa la misma proyección lineal que la maqueta:
  - x = (lon + 79,02) / 12,17
  - y = (12,46 − lat) / 16,69

Las piezas nuevas son pocas y se separan del resto:
- la barra de filtros recogida, compartida por `/mapa` y `/normativa`;
- la gráfica de crecimiento;
- la línea de puntos;
- las pestañas del mapa;
- las ilustraciones de noticias.

La única animación que queda es el crecimiento de las barras del inicio (RF-11). Por eso se
retiran el aparecer de las tarjetas y el conteo animado de los KPI.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `web/src/styles/tokens/colors.css`, `web/src/styles/tema.css` | Modificar | Tokens de encabezado, acentos y botones (RF-01) |
| `web/src/components/ui/button.tsx` | Modificar | Botones formales (RF-04) |
| `web/src/components/encabezado-sitio.tsx`, `menu-principal.tsx` | Modificar / Crear | Barra naranja y página actual (RF-02) |
| `web/src/app/{mapa,vehiculos,normativa,noticias}/page.tsx` | Modificar | Introducción al final (RF-03) |
| `web/src/lib/crecimiento.ts`, `web/src/components/grafica-crecimiento.tsx` | Crear | Gráfica del inicio (RF-10, RF-11) |
| `web/src/components/mini-mapa-colombia.tsx`, `icono-vehiculo.tsx`, `mini-linea-normas.tsx` | Crear | Imágenes de las tarjetas del inicio (RF-12) |
| `web/src/components/inicio.tsx`, `web/src/app/page.tsx`, `web/src/lib/textos.ts` | Modificar | Inicio nuevo (RF-12 a RF-14) |
| `web/src/components/aparecer.tsx`, `kpi-valor.tsx` | Modificar | Sin animaciones salvo la del inicio (RF-11) |
| `web/src/components/filtros/barra-filtros.tsx` | Crear | Filtros recogidos con chips (RF-08, RF-09) |
| `web/src/components/mapa/{filtros,vista-mapa,mapa-proyectos,panel-mapa,tabla-proyectos}.tsx` | Modificar / Crear | `/mapa` (RF-15 a RF-19) |
| `web/src/components/graficas/graficas.tsx` | Modificar | Tres columnas desde 860 px |
| `web/src/components/vehiculos/{vista-vehiculos,resumen-vehiculos}.tsx` | Modificar | Cifras primero y créditos en la barra (RF-20 a RF-22) |
| `web/src/lib/linea-puntos.ts`, `web/src/components/normativa/linea-puntos.tsx` | Crear | Línea de puntos (RF-23 a RF-25) |
| `web/src/components/normativa/{vista-normativa,linea-tiempo,tarjeta-norma,filtros-normativa}.tsx` | Modificar | Resaltado de la ficha y filtros recogidos |
| `web/src/lib/noticias.ts`, `web/src/lib/datos-publicos.ts` | Modificar | Leer `etiquetas` y calcular el tema (RF-28) |
| `web/src/components/noticias/{ilustracion-tema,lista-noticias}.tsx` | Crear / Modificar | Ilustraciones (RF-27) |
| `web/e2e/007-rediseno.spec.ts` y E2E previos | Crear / Modificar | Escenarios nuevos y selectores que cambian |

## Cambios de datos
- Esquema: ninguno. La columna `noticias.etiquetas` ya existe en la base y en el CSV; solo se
  agrega a la consulta pública.
- Validación: sin cambios. El tema se calcula al mostrar la noticia y no se guarda.
- Importación y pruebas: sin cambios.

## Tareas

### Fase 1 · Tema y encabezado
- [x] **T01 · S** · Tokens del rediseño
  - Cubre: RF-01 · CA-01.1, CA-01.2
  - Prueba primero (RED): `src/styles/tema.test.tsx`.
    - Comprueba que `--surface-header` = `--teal-600` y que existen `--accent` = #e8935a y
      `--accent-soft` = #f4b183.
    - Comprueba que cada par texto/fondo declarado (cuerpo, títulos, enlaces, botón
      principal, texto oscuro sobre naranja) tiene contraste ≥ 4,5.
    - Falla hoy porque el encabezado es `--teal-300` y no hay tokens de acento.
  - Hecho cuando (GREEN): los tokens existen y todos los pares pasan.
  - Depende de: —
  - Archivos: `styles/tokens/colors.css`, `styles/tema.css`
- [x] **T02 · S** · Botones formales
  - Cubre: RF-04 · CA-04.1
  - Prueba primero (RED): `src/components/ui/button.test.tsx`.
    - La variante por defecto usa fondo `--teal-600` y texto blanco; la `outline`, fondo
      blanco y borde gris.
    - El radio es el pequeño y no hay clases de degradado.
    - Falla hoy porque el principal es `--brand` (#6b7276).
  - Hecho cuando (GREEN): pasa, sin romper las pruebas de los componentes que usan `Button`.
  - Depende de: T01
  - Archivos: `components/ui/button.tsx`
- [x] **T03 · S** · Encabezado con página actual
  - Cubre: RF-02 · CA-02.1, CA-02.2
  - Prueba primero (RED): `src/components/encabezado-sitio.test.tsx`.
    - Con la ruta `/normativa`, el enlace «Normativa» tiene `aria-current="page"` y el
      subrayado de acento.
    - Hay una barra de acento junto al nombre y seis entradas en orden.
    - Falla hoy porque no se marca la página actual.
  - Hecho cuando (GREEN): pasa en todas las rutas (`/mapa` marca «Implementación»).
  - Depende de: T01
  - Archivos: `components/encabezado-sitio.tsx`, `components/menu-principal.tsx` (cliente,
    con la ruta actual)
- [x] **T04 · XS** · Íconos de un solo juego
  - Cubre: RF-05 · CA-05.1
  - Prueba primero (RED): `tabla-proyectos.test.tsx`.
    - Al ordenar, la cabecera muestra un ícono SVG (Lucide), no los caracteres ▲/▼.
    - Falla hoy porque usa texto.
  - Hecho cuando (GREEN): pasa.
  - Depende de: —
  - Archivos: `components/mapa/tabla-proyectos.tsx`
- [x] **T05 · S** · Introducción al final
  - Cubre: RF-03 · CA-03.1
  - Prueba primero (RED): `src/app/secciones.test.tsx`.
    - En `/mapa`, `/vehiculos`, `/normativa` y `/noticias`, el párrafo de introducción es el
      último bloque del `<main>` y el h1 va primero.
    - Falla hoy porque la intro va justo después del h1.
  - Hecho cuando (GREEN): pasa en las cuatro páginas.
  - Depende de: —
  - Archivos: `app/mapa/page.tsx`, `app/vehiculos/page.tsx`, `app/normativa/page.tsx`,
    `app/noticias/page.tsx`
- [x] **T06 · XS** · Una sola animación
  - Cubre: RF-11 · CA-11.2
  - Prueba primero (RED): `aparecer.test.tsx` y `kpi-valor.test.tsx`.
    - `Aparecer` muestra su contenido sin estilos de transición.
    - El KPI muestra el valor final desde el primer render, sin conteo.
    - Falla hoy porque ambos animan.
  - Hecho cuando (GREEN): pasa; las demás pruebas siguen en verde.
  - Depende de: —
  - Archivos: `components/aparecer.tsx`, `components/kpi-valor.tsx`

### Fase 2 · Inicio
- [x] **T07 · S** · Cálculo del crecimiento
  - Cubre: RF-10 · CA-10.1, CA-10.3
  - Prueba primero (RED): `src/lib/crecimiento.test.ts`.
    - Con proyectos ficticios de prueba, cada año de FPO tiene el MW acumulado de En
      operación, En construcción y Anunciado.
    - Inactivo no suma, y los proyectos sin año quedan fuera y se cuentan aparte.
    - Cada año se marca `proyeccion: true` si hasta él hay algún proyecto En construcción o
      Anunciado.
    - Falla hoy porque el módulo no existe.
  - Hecho cuando (GREEN): pasa.
  - Depende de: —
  - Archivos: `lib/crecimiento.ts`
- [x] **T08 · M** · Gráfica de crecimiento
  - Cubre: RF-10, RF-11, RNF-02, RNF-03 · CA-10.1, CA-10.2, CA-11.1
  - Prueba primero (RED): `grafica-crecimiento.test.tsx`.
    - Muestra una barra por año con su valor «17,0» (es-CO) y su año.
    - Las barras de proyección tienen el color de acento y las demás el gris.
    - Se lee la nota de proyección.
    - Con movimiento reducido, las barras no tienen animación; sin él, la animación corre
      una sola vez (no hay `infinite`).
    - Hay una tabla equivalente para lectores de pantalla.
    - Falla hoy porque el componente no existe.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T07, T01
  - Archivos: `components/grafica-crecimiento.tsx`
- [x] **T09 · S** · Imágenes de las tarjetas del inicio
  - Cubre: RF-12, RF-05 · CA-12.2
  - Prueba primero (RED): `mini-mapa-colombia.test.tsx`.
    - Con proyectos ficticios, hay un punto por proyecto con coordenadas.
    - Cada punto tiene el color de `colorDe(estado)` y su posición según la proyección
      (p. ej. lon −73,2136 y lat 4,375 → 47,7 % y 48,4 %).
    - La imagen es decorativa (`alt=""`).
    - Falla hoy porque el componente no existe.
  - Hecho cuando (GREEN): pasa. `icono-vehiculo.tsx` y `mini-linea-normas.tsx` son SVG
    decorativos con `aria-hidden`.
  - Depende de: —
  - Archivos: `components/mini-mapa-colombia.tsx`, `components/icono-vehiculo.tsx`,
    `components/mini-linea-normas.tsx`
- [x] **T10 · S** · Tema de noticias desde las etiquetas
  - Cubre: RF-28 · CA-28.1, CA-28.2, CA-28.3
  - Prueba primero (RED): `src/lib/noticias.test.ts`.
    - `temaDe("regulación;CREG")` = «Regulación».
    - `temaDe("ambiental;El Niño")` = «Ambiente».
    - `temaDe("Política Publica")` = «Política pública» (sin distinguir mayúsculas ni
      tildes).
    - `temaDe("")` y `temaDe("solar")` = «General».
    - La consulta pública incluye `etiquetas`.
    - Falla hoy porque no existe `temaDe` y `Noticia` no tiene `etiquetas`.
  - Hecho cuando (GREEN): pasa.
  - Depende de: —
  - Archivos: `lib/noticias.ts`, `lib/datos-publicos.ts`
- [x] **T11 · M** · Inicio nuevo
  - Cubre: RF-12, RF-13, RF-14, RNF-01 · CA-12.1, CA-13.1, CA-14.1
  - Prueba primero (RED): `inicio.test.tsx`.
    - El orden es: título e intro, gráfica de crecimiento, «Secciones principales» con
      tres tarjetas (títulos, textos originales de RF-12 y botones a `/mapa`, `/vehiculos`
      y `/normativa`), cifras (MW y MWh en operación en tarjetas separadas y número de
      proyectos), últimas noticias (máx. 3, con fecha) y botón «Aportar» a `/aportar`.
    - Falla hoy porque hay 4 tarjetas, otros textos y no hay noticias ni gráfica.
  - Hecho cuando (GREEN): pasa. Las tarjetas pasan a una columna por debajo de 860 px.
  - Depende de: T06, T08, T09, T10
  - Archivos: `components/inicio.tsx`, `app/page.tsx`, `lib/textos.ts`

### Fase 3 · Implementación (`/mapa`)
- [x] **T12 · M** · Barra de filtros recogida
  - Cubre: RF-08, RF-09 · CA-08.1, CA-08.2, CA-08.3, CA-09.1
  - Prueba primero (RED): `components/filtros/barra-filtros.test.tsx`.
    - Al montar, el panel está oculto y el botón dice «Filtros» con
      `aria-expanded="false"`.
    - Al pulsarlo se muestra el panel y el botón dice «Ocultar filtros».
    - Con 1 filtro activo, el botón dice «Filtros (1)» y hay un chip «Quitar filtro En
      operación» que llama a `onQuitar`.
    - Se ve el conteo.
    - Falla hoy porque el componente no existe.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T02
  - Archivos: `components/filtros/barra-filtros.tsx`
- [x] **T13 · S** · `/mapa` con la barra recogida
  - Cubre: RF-08, RF-09, RF-15 · CA-08.1, CA-08.3, CA-09.1, CA-15.1
  - Prueba primero (RED): `vista-mapa.test.tsx` y `filtros.test.tsx`.
    - Con `?estado=En operación`, el panel está recogido, aparece el chip y el conteo
      coincide.
    - El orden es KPI, barra, gráficas, mapa y tabla.
    - Falla hoy porque los filtros son un `<details>` abierto, sin chips.
  - Hecho cuando (GREEN): pasa. Las gráficas van en 3 columnas desde 860 px.
  - Depende de: T12
  - Archivos: `components/mapa/filtros.tsx`, `components/mapa/vista-mapa.tsx`,
    `components/graficas/graficas.tsx`
- [x] **T14 · S** · Botones de zoom del mapa
  - Cubre: RF-17 · CA-17.1, CA-17.2
  - Prueba primero (RED): `mapa-proyectos.test.tsx` (con MapLibre simulado, como hoy).
    - Se agrega un control de navegación arriba a la derecha, sin brújula, con los textos
      «Acercar» y «Alejar».
    - El encuadre inicial cubre Colombia y se mantiene la atribución de OpenStreetMap.
    - Falla hoy porque no hay control de navegación.
  - Hecho cuando (GREEN): pasa.
  - Depende de: —
  - Archivos: `components/mapa/mapa-proyectos.tsx`
- [x] **T15 · M** · Pestañas del mapa
  - Cubre: RF-16, RF-18 · CA-16.1, CA-16.2, CA-18.1
  - Prueba primero (RED): `panel-mapa.test.tsx`.
    - Hay un tablist «Tipo de almacenamiento» con «Gran escala» seleccionada y el mapa
      visible.
    - Al elegir «Detrás del medidor» se lee «Sección en construcción» y la explicación, y no
      se ve el mapa.
    - Las flechas cambian de pestaña.
    - Falla hoy porque no hay pestañas.
  - Hecho cuando (GREEN): pasa. Reutiliza `Pestanas`.
  - Depende de: T13, T14
  - Archivos: `components/mapa/panel-mapa.tsx`, `components/mapa/vista-mapa.tsx`

### Fase 4 · Vehículos
- [x] **T16 · S** · Cifras primero y créditos en la barra
  - Cubre: RF-20, RF-21, RF-22 · CA-20.1, CA-21.1, CA-22.1
  - Prueba primero (RED): `vista-vehiculos.test.tsx`.
    - El primer bloque son los KPI y la tabla «Participación por tipo de batería».
    - Después va la barra de filtros con las fuentes, «Última actualización» y «Ventas
      hasta», y luego las gráficas.
    - Falla hoy porque los filtros y los créditos van primero.
  - Hecho cuando (GREEN): pasa, con los mismos valores.
  - Depende de: T02
  - Archivos: `components/vehiculos/vista-vehiculos.tsx`,
    `components/vehiculos/resumen-vehiculos.tsx`

### Fase 5 · Normativa
- [x] **T17 · S** · Posiciones de la línea de puntos
  - Cubre: RF-23 · CA-23.1
  - Prueba primero (RED): `src/lib/linea-puntos.test.ts`.
    - Con normas ficticias, la posición (%) es proporcional a la fecha entre el primer y el
      último año (con medio año de margen).
    - Las marcas de año van cada 2 años.
    - Las fechas con precisión de mes o año se ubican a mitad del mes o del año.
    - Los puntos de fechas cercanas alternan arriba y abajo.
    - Falla hoy porque no existe.
  - Hecho cuando (GREEN): pasa.
  - Depende de: —
  - Archivos: `lib/linea-puntos.ts`
- [x] **T18 · M** · Línea de puntos con salto a la ficha
  - Cubre: RF-23, RF-24, RF-25, RNF-03 · CA-23.1, CA-23.2, CA-24.1, CA-25.1, CA-25.2
  - Prueba primero (RED): `linea-puntos.test.tsx`.
    - Hay un punto por norma recibida, con el color de `COLOR_ENTIDAD` y una leyenda.
    - Al enfocar o pasar el mouse se ve un tooltip con emisor, tipo y número, fecha y
      título.
    - Al hacer clic o pulsar Enter se llama `scrollIntoView` sobre `#norma-{id}` (con
      `behavior: "auto"` si hay movimiento reducido), la ficha queda con
      `data-resaltada="true"` y recibe el foco.
    - Falla hoy porque el componente no existe.
  - Hecho cuando (GREEN): pasa. `vista-normativa` le pasa las mismas normas filtradas que a
    `LineaTiempo`.
  - Depende de: T17
  - Archivos: `components/normativa/linea-puntos.tsx`,
    `components/normativa/vista-normativa.tsx`, `components/normativa/linea-tiempo.tsx`,
    `components/normativa/tarjeta-norma.tsx`
- [x] **T19 · S** · Filtros de normativa recogidos
  - Cubre: RF-08, RF-26 · CA-08.4, CA-26.1
  - Prueba primero (RED): `vista-normativa.test.tsx`.
    - Al cargar, los filtros están recogidos, con chips y conteo.
    - La línea de tiempo conserva años, fichas y «Ver explicación».
    - Falla hoy porque usa `<details>` sin chips.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T12, T18
  - Archivos: `components/normativa/filtros-normativa.tsx`,
    `components/normativa/vista-normativa.tsx`

### Fase 6 · Noticias
- [x] **T20 · S** · Ilustraciones por tema
  - Cubre: RF-27, RF-28 · CA-27.1, CA-27.2
  - Prueba primero (RED): `lista-noticias.test.tsx`.
    - Cada tarjeta tiene, arriba, una ilustración SVG decorativa del tema y una etiqueta
      con su nombre («Regulación», «General»…).
    - No hay `<img>` con dominio externo.
    - Falla hoy porque no hay ilustración.
  - Hecho cuando (GREEN): pasa.
  - Depende de: T10
  - Archivos: `components/noticias/ilustracion-tema.tsx`,
    `components/noticias/lista-noticias.tsx`

### Cierre
- [x] **T21 · M** · E2E del rediseño y ajuste de los E2E previos
  - Cubre: RNF-01, RNF-04, RNF-06 y todos los CA en navegador
  - Prueba primero (RED): `e2e/007-rediseno.spec.ts`.
    - Escribe los escenarios de abajo antes de correr; los de las tareas pendientes fallan.
    - Además, se corren 002 a 006 uno por uno y se corrigen los selectores que dependen del
      orden o de los rótulos viejos, sin cambiar lo que comprueban.
  - Hecho cuando (GREEN): 007 en verde y 001 a 006 en verde, en serie.
  - Depende de: T01–T20
  - Archivos: `e2e/007-rediseno.spec.ts`, `e2e/00*-*.spec.ts`

- [x] **T22 · XS** · Tabla oculta de la gráfica de crecimiento sin desborde a 375 px
  - Cubre: RNF-01 · E2E-40 (y E2E-18 de la 001)
  - Prueba primero (RED): `grafica-crecimiento.test.tsx`: la tabla equivalente no lleva
    `sr-only` y su contenedor sí. Fallaba porque `sr-only` estaba en la propia `<table>`, cuyo
    ancho mínimo (388 px) ensanchaba `/` a 424 px.
  - Hecho cuando (GREEN): pasa y `/` mide 375 px a 375 px.
  - Depende de: T08 · Archivos: `components/grafica-crecimiento.tsx`
- [x] **T23 · XS** · Sectores de las donas sin `role="img"` expuesto
  - Cubre: RNF-04 · E2E-01 (axe `svg-img-alt` en `/mapa` y `/vehiculos`)
  - Prueba primero (RED): `dona.test.tsx`: cada `[role="img"]` (sector de Recharts) queda dentro
    de un `aria-hidden="true"`; el total y la leyenda no. Fallaba porque Recharts pone
    `role="img"` sin nombre a cada sector.
  - Hecho cuando (GREEN): pasa; la leyenda y la tabla de la tarjeta siguen dando la información.
  - Depende de: — · Archivos: `components/graficas/dona.tsx`

- [x] **T24 · XS** · Enlaces de los créditos del mapa subrayados
  - Cubre: RNF-04 · E2E-18 de la 001 (axe `link-in-text-block` en `/mapa` a 375 px)
  - Prueba primero (RED): `tema.test.tsx`: `globals.css` subraya `.maplibregl-map
    .maplibregl-ctrl-attrib a`. Fallaba porque `maplibre-gl.css` quita el subrayado y los enlaces
    solo se distinguían por el color.
  - Hecho cuando (GREEN): pasa y axe ya no lo marca.
  - Depende de: — · Archivos: `app/globals.css`

- [x] **T25 · XS** · Pestaña activa y cabecera de la tabla con contraste AA
  - Cubre: RF-07, RNF-04 · CA-07.1 (actualizado el 2026-10-27), E2E-01 de la 007 y E2E-18 de la 001
  - Prueba primero (RED): `tema.test.tsx`: el par «pestaña activa y cabecera de la tabla»
    (`--text-on-selected` sobre `--surface-selected`) tiene contraste ≥ 4,5:1. Fallaba porque
    `--text-on-selected` no existía y el texto era oscuro sobre `--teal-300` (2,76:1).
  - Hecho cuando (GREEN): `--surface-selected` = `--teal-600` y `--text-on-selected` = blanco;
    `pestanas.tsx` y `tabla-proyectos.tsx` usan el texto nuevo; axe sin `color-contrast`.
  - Depende de: — · Archivos: `styles/tokens/colors.css`, `graficas/pestanas.tsx`, `mapa/tabla-proyectos.tsx`

Estimación total: 25 tareas (6 XS, 12 S, 7 M), unas 16 h (T22–T25 salieron del E2E).

## Escenarios E2E
Escritorio a 1280 × 900, salvo que se diga otra cosa. Base: proyectos, normas y noticias
publicados en la base de pruebas.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1, RNF-04 | Abrir `/`, `/mapa`, `/vehiculos`, `/normativa`, `/noticias`, `/aportar` y correr axe | Sin violaciones serias ni críticas; sin fallas de contraste |
| E2E-02 | CA-01.2 | En cada página, revisar el color de todos los textos visibles | Ningún texto naranja sobre blanco o gris claro |
| E2E-03 | CA-02.1 | Abrir `/` | Encabezado gris oscuro, barra naranja junto al nombre, menú Inicio, Implementación, Vehículos, Normativa, Noticias, Aportar |
| E2E-04 | CA-02.2 | Abrir `/normativa`, revisar el menú | «Normativa» con `aria-current="page"` y subrayado naranja; las demás sin él |
| E2E-05 | CA-03.1 | Abrir cada una de las cuatro secciones | Tras el h1 vienen las cifras o el contenido; la intro es el último bloque antes del pie |
| E2E-06 | CA-04.1 | Abrir `/mapa`, mirar «Filtros» y «Descargar CSV» | Principal gris oscuro con texto blanco; secundario blanco con borde gris |
| E2E-07 | CA-05.1 | Revisar íconos de `/mapa` (ordenar tabla) e inicio | Íconos SVG de trazo; sin ▲/▼ ni emojis |
| E2E-08 | CA-06.1 | Abrir cada página | Mapa de Colombia tenue al fondo |
| E2E-09 | CA-07.1 | Abrir `/mapa`, ver «Capacidad por estado» | Pestañas en grupo gris claro, activa gris oscuro |
| E2E-10 | CA-08.1, CA-08.2 | Abrir `/mapa`; pulsar «Filtros»; pulsar «Ocultar filtros» | Al cargar está recogido, sin búsqueda (CA-08.1 del 2026-10-27), y con «7 proyectos» (o el total); se despliega y se recoge |
| E2E-11 | CA-08.3 | Desplegar y elegir estado «En operación»; pulsar el chip | Chip «En operación», botón «Filtros (1)», conteo reducido; al quitar vuelve al total |
| E2E-12 | CA-08.4 | Abrir `/normativa` | Filtros recogidos con botón, chips y conteo |
| E2E-13 | CA-09.1 | Abrir `/mapa?estado=En%20operación` | Panel recogido, chip «En operación», tabla solo con proyectos en operación |
| E2E-14 | CA-10.1, CA-10.3 | Abrir `/`, leer la gráfica de crecimiento (o su tabla) | Cada año muestra el acumulado de MW sin los Inactivo (comparar con `/mapa` filtrado por esos estados) |
| E2E-15 | CA-10.2 | Mirar colores y nota | Barras con proyección en naranja, las demás gris; nota de proyección visible |
| E2E-16 | CA-11.1 | Emular movimiento reducido y abrir `/` | Barras en altura final sin transición |
| E2E-17 | CA-11.2 | Abrir cada página y esperar 10 s; tomar dos capturas | Nada cambia entre capturas (sin bucles) |
| E2E-18 | CA-12.1 | Abrir `/`, ver «Secciones principales» | Tres tarjetas con los textos de RF-12; botones a `/mapa`, `/vehiculos`, `/normativa` |
| E2E-19 | CA-12.2 | Mirar la tarjeta de Implementación | Contorno de Colombia con un punto por proyecto, color por estado |
| E2E-20 | CA-13.1 | Comparar las cifras del inicio con `/mapa` filtrado por «En operación» | MW y MWh coinciden con la suma de los proyectos en operación, en tarjetas separadas |
| E2E-21 | CA-14.1 | Bajar en `/` | Últimas noticias con fecha y botón «Aportar» que abre `/aportar` |
| E2E-22 | CA-15.1 | Abrir `/mapa` a 1280 px | Orden: KPI, filtros, tres gráficas en una fila, mapa, inventario |
| E2E-23 | CA-16.1, CA-16.2 | Ver las pestañas del mapa; enfocarlas y usar las flechas | «Gran escala» seleccionada; las flechas cambian de pestaña; se anuncian como pestañas |
| E2E-24 | CA-17.1 | Esperar a que cargue el mapa | Colombia continental completa a la vista; créditos de OpenStreetMap |
| E2E-25 | CA-17.2 | Pulsar «Acercar», luego «Alejar»; usar la rueda | El zoom cambia en cada caso |
| E2E-26 | CA-17.3 | Clic en un punto | Se abre la tarjeta del proyecto |
| E2E-27 | CA-18.1 | Elegir «Detrás del medidor»; volver a «Gran escala» | Se lee «Sección en construcción» y la explicación, sin mapa; al volver reaparece |
| E2E-28 | CA-19.1 | Leer los encabezados de la tabla | Nombre, Operador, Estado, Servicios, Departamento, Municipio, Potencia [MW], Energía [MWh], Año de FPO |
| E2E-29 | CA-20.1 | Abrir `/vehiculos` | Primero tarjetas de vehículos y MWh y tabla de participación por batería, con los valores de hoy |
| E2E-30 | CA-21.1 | Mirar la barra de filtros de `/vehiculos` | Fuentes, «Última actualización» y «Ventas hasta» |
| E2E-31 | CA-22.1 | Bajar en `/vehiculos` | Cuatro gráficas debajo de las cifras |
| E2E-32 | CA-23.1 | Abrir `/normativa` | Línea horizontal con años, un punto por norma de la línea de tiempo y leyenda por emisor |
| E2E-33 | CA-23.2 | Filtrar por emisor CREG | La línea de puntos muestra solo los puntos de la CREG, igual que la línea de tiempo |
| E2E-34 | CA-24.1 | Pasar el mouse por un punto; luego enfocar otro con Tab | Recuadro con emisor, tipo y número, fecha y título |
| E2E-35 | CA-25.1 | Clic en un punto | Su ficha queda a la vista y resaltada sin otro clic |
| E2E-36 | CA-25.2 | Enfocar un punto y pulsar Enter | La ficha queda a la vista, resaltada y con el foco |
| E2E-37 | CA-26.1 | Bajar a la línea de tiempo | Mismas normas, años y «Ver explicación» que antes |
| E2E-38 | CA-27.1, CA-27.2 | Abrir `/noticias` | Cada tarjeta con ilustración y etiqueta de tema; ninguna imagen desde dominios de medios |
| E2E-39 | CA-28.1–28.3 | Revisar el tema de cada noticia contra sus etiquetas (en `/admin` o en la base) | Tema según la primera etiqueta; «General» si no aplica |
| E2E-40 | RNF-01 | Abrir las seis páginas a 375 px | Sin desplazamiento horizontal; filas en una columna |
| E2E-41 | RNF-02 | Revisar cifras en `/`, `/mapa`, `/vehiculos` | Coma decimal, punto de miles, unidades entre corchetes |
| E2E-42 | RNF-06 | Abrir las seis páginas | Consola sin errores |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1, CA-01.2 | T01 | E2E-01, E2E-02 |
| RF-02 | CA-02.1, CA-02.2 | T03 | E2E-03, E2E-04 |
| RF-03 | CA-03.1 | T05 | E2E-05 |
| RF-04 | CA-04.1 | T02 | E2E-06 |
| RF-05 | CA-05.1 | T04, T09 | E2E-07 |
| RF-06 | CA-06.1 | Ya cumple (`fondo-mapa.test.tsx`) | E2E-08 |
| RF-07 | CA-07.1 | Ya cumple (`pestanas.test.tsx`) | E2E-09 |
| RF-08 | CA-08.1–08.4 | T12, T13, T19 | E2E-10, E2E-11, E2E-12 |
| RF-09 | CA-09.1 | T12, T13 | E2E-13 |
| RF-10 | CA-10.1–10.3 | T07, T08 | E2E-14, E2E-15 |
| RF-11 | CA-11.1, CA-11.2 | T06, T08 | E2E-16, E2E-17 |
| RF-12 | CA-12.1, CA-12.2 | T09, T11 | E2E-18, E2E-19 |
| RF-13 | CA-13.1 | T11 | E2E-20 |
| RF-14 | CA-14.1 | T10, T11 | E2E-21 |
| RF-15 | CA-15.1 | T13 | E2E-22 |
| RF-16 | CA-16.1, CA-16.2 | T15 | E2E-23 |
| RF-17 | CA-17.1–17.3 | T14 | E2E-24, E2E-25, E2E-26 |
| RF-18 | CA-18.1 | T15 | E2E-27 |
| RF-19 | CA-19.1 | Ya cumple (`tabla-proyectos.test.tsx`) | E2E-28 |
| RF-20 | CA-20.1 | T16 | E2E-29 |
| RF-21 | CA-21.1 | T16 | E2E-30 |
| RF-22 | CA-22.1 | T16 | E2E-31 |
| RF-23 | CA-23.1, CA-23.2 | T17, T18 | E2E-32, E2E-33 |
| RF-24 | CA-24.1 | T18 | E2E-34 |
| RF-25 | CA-25.1, CA-25.2 | T18 | E2E-35, E2E-36 |
| RF-26 | CA-26.1 | T19 | E2E-37 |
| RF-27 | CA-27.1, CA-27.2 | T20 | E2E-38 |
| RF-28 | CA-28.1–28.3 | T10, T20 | E2E-39 |
| RNF-01 | — | T11, T13, T21 | E2E-40 |
| RNF-02 | — | T08 | E2E-41 |
| RNF-03 | — | T08, T18 | E2E-16, E2E-36 |
| RNF-04 | — | T01, T21 | E2E-01 |
| RNF-05 | — | Medición antes de publicar (no es tarea de código) | LCP local y en el sitio publicado |
| RNF-06 | — | T21 | E2E-42 |
| RNF-07 | — | Todas (sin dependencias nuevas) | Revisión de `package.json` |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Cambiar los tokens globales rompe el contraste o el aspecto de páginas no previstas (`/admin`, `/aportar`) | T01 prueba los pares de contraste; E2E-01 corre axe en las seis páginas; se revisa `/admin` a ojo |
| Los E2E previos dependen del orden y de los rótulos (intro, filtros abiertos) | T21 los corre en serie y ajusta solo los selectores, sin cambiar lo que comprueban |
| Las etiquetas aprobadas por el editor no coinciden con la lista | Tema «General» por defecto; se reporta qué noticias quedaron en «General» para que el editor ajuste la etiqueta en `/admin` |
| La imagen del fondo no calza con la proyección lineal en la mini tarjeta | Se verifica con los 7 proyectos contra la maqueta (Barranquilla, Cali, Villavicencio) |
| Memoria del equipo (3,4 GB) | No correr `npm run build` con `npm run dev` encendido; E2E uno por uno |
| Agregar el inicio con noticias empeora el LCP | Noticias y gráfica dentro de `Suspense`, como el panel KPI; se mide LCP local antes y después |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-26 | T01 | 2 fallas: `--surface-header` = `var(--teal-300)` y `--accent` resolvía a #f1f3f3 (no había acentos) | `--surface-header` = `--teal-600`; `--highlight`/`--highlight-soft`/`--text-on-highlight` en `colors.css`; `--accent`, `--accent-soft` y `--accent-foreground` en `tema.css`; 9 pares de contraste ≥ 4,5 | Utilidades de contraste del test subidas al módulo. Desviación: `pestanas.tsx` y la cabecera de `tabla-proyectos.tsx` usaban `--surface-header` como fondo con texto oscuro; pasan a `--surface-selected` (= `--teal-300`, el gris de antes) para conservar su aspecto (RF-07). Ojo: ese par (#2b2f31 sobre #6b7276) da 2,8:1, ya existía y E2E-01 lo marcará |
| 2026-10-26 | T02 | 4 fallas: `--primary` resolvía a #6b7276; la `outline` no tenía `bg-card` ni borde de 1,5 px; no existía la variante `acento`; el radio era `rounded-lg` | `--primary` = `--brand-ink` (#3f4548); `button.tsx`: radio `rounded-sm` (6 px) en todas las variantes y tamaños, `outline` blanca con borde `--teal-600` de 1,5 px y texto `--text-heading`, variante `acento` (`bg-accent text-accent-foreground`) | Desviación: en `tema.test.tsx` la espera de `--primary` pasa de `var(--brand)` a `var(--brand-ink)` (diseño que cambia la spec). `grafica-energia-tipo.tsx` usaba `fill="var(--primary)"` y pasa a `var(--brand)` para no cambiar el color de la gráfica |
| 2026-10-26 | T03 | 8 de 9 fallas: ninguna entrada tenía `aria-current` y no había barra de acento (solo pasaba el caso de `/admin`) | `menu-principal.tsx` (cliente, `usePathname`): `aria-current="page"` y `border-b-[3px] border-accent` en la actual (subrutas incluidas; `/` solo en el inicio), hover/foco `--accent-soft`, enlaces blancos en negrita. `encabezado-sitio.tsx`: barra `bg-accent` de 6×36 px (`w-1.5 h-9`, `aria-hidden`) junto al nombre | `MENU` se mueve a `menu-principal.tsx` (exportada). El texto del encabezado usa `--text-on-brand` (mismo blanco que `--brand-contrast`) |
| 2026-10-26 | T04 | El botón ordenado no tenía `svg.lucide` (mostraba « ▲») | `ChevronUp`/`ChevronDown` de lucide-react con `aria-hidden` en la cabecera ordenada | — |
| 2026-10-26 | T05 | 4 fallas: el primer hijo del `<main>` era un `<header>` con h1 + intro | En las cuatro páginas: h1 como primer hijo, luego el `Suspense` con el contenido y la intro como último bloque. En `/mapa` el enlace «Descargar datos completos (CSV)» pasa a ir después del contenido y antes de la intro | Los E2E previos que dependan del orden se ajustan en T21 |
| 2026-10-26 | T06 | 2 fallas: sin movimiento reducido, `Aparecer` y `KpiValor` tenían `data-animado="true"` | `aparecer.tsx` y `kpi-valor.tsx` sin `motion` ni estado: muestran el contenido y el valor final desde el primer render (`retraso` se acepta y no se usa) | Desviación: en `kpi-valor.test.tsx` se reemplaza la prueba «sin la preferencia anima el conteo» (comprobaba la animación que la spec retira) y las pruebas de `Aparecer` pasan a `aparecer.test.tsx`. `motion` sigue en `package.json` (lo puede usar T08) |
| 2026-10-26 | T07 | El módulo `lib/crecimiento.ts` no existía (no se resolvía la importación) | `crecimiento(proyectos)` → `{ barras: { anio, mw, proyeccion }[], sinAnio }`: MW acumulados por año de FPO de En operación, En construcción y Anunciado; Inactivo no suma; sin año (o no de 4 dígitos) se cuenta en `sinAnio`; `proyeccion` queda en `true` desde el primer año con En construcción o Anunciado. 5 pruebas | `evolucion()` no se toca |
| 2026-10-26 | T08 | El componente no existía (no se resolvía la importación) | `grafica-crecimiento.tsx` (cliente): tarjeta con borde superior de acento y título «Crecimiento del almacenamiento [MW acumulados]»; barras HTML con valor es-CO y año, `--brand-ink` (operación) o `--accent` (proyección), altura proporcional al máximo; crecen una vez con `transition: height 900ms` (sin `infinite` ni `animate-*`) tras un `setTimeout` de 30 ms; con `useMovimientoReducido` aparecen en su altura final con `transition: none`. Tabla `sr-only` equivalente, nota de proyección y aviso de proyectos sin año. 8 pruebas | No usa `motion`. En el servidor (`useMovimientoReducido` = true) el HTML trae la altura final |
| 2026-10-26 | T09 | Los tres componentes no existían | `mini-mapa-colombia.tsx`: `next/image` de `/fondo-colombia.png` (781×1040) con `alt=""` y un punto por proyecto con coordenadas (`colorDe(estado)`, `left`/`top` en % según la proyección lineal); `icono-vehiculo.tsx` (SVG de trazo, `fill="none"`, rayo y cable en acento) y `mini-linea-normas.tsx` (línea con 5 círculos, el último en `--accent`), ambos `aria-hidden`. 5 pruebas | La prueba de T09 incluye también los dos SVG decorativos |
| 2026-10-26 | T10 | 5 fallas: `temaDe` no existía y la consulta de `leerNoticias` no pedía `etiquetas` | `Noticia` gana `etiquetas: string \| null`; `temaDe()` toma la primera etiqueta (separador «;»), quita tildes y mayúsculas y la busca en la lista cerrada (incluye «ambiental» → Ambiente); «General» por defecto. `leerNoticias` selecciona `etiquetas`. Se exportan `TEMAS` y `Tema` para T20 | Desviación: los datos ficticios de `noticias.test.ts`, `lista-noticias.test.tsx` y `a11y.test.tsx` agregan `etiquetas: null` (solo tipos, por el campo nuevo) |
| 2026-10-26 | T11 | 8 de 8 fallas en `inicio.test.tsx` (no había gráfica, región «Secciones principales», «Proyectos identificados», noticias ni botón «Aportar») y 1 en `secciones.test.tsx` (la página no tenía los marcadores de carga) | `inicio.tsx`: h1 e intro → ranura de la gráfica → «Secciones principales» (3 `article` con imagen de 150 px sobre `bg-muted`, borde superior de acento de 4 px, título, texto y botón gris oscuro; `grid min-[860px]:grid-cols-3`) → cifras (`PanelKpi`: MW, MWh y proyectos identificados en tarjetas separadas) → «Últimas noticias» (`UltimasNoticias`, máx. 3 con fecha, enlazan a /noticias) → llamado con botón `acento` «Aportar» a /aportar. Textos de las tarjetas en `SECCIONES_INICIO` (`lib/textos.ts`). `app/page.tsx`: gráfica, mini mapa, cifras y noticias en `Suspense` con sus marcadores; los proyectos salen de `proyectosParaMapa()` (cacheada) con `aProyectoMapa` | Desviación: `inicio.test.tsx` se reescribe (comprobaba las 4 tarjetas, los textos sin punto final y la tarjeta «Proyectos por estado» del diseño anterior); en `a11y.test.tsx` el caso del inicio usa la nueva firma de `Inicio`. Se quita `Aparecer` del inicio. `proyectosParaKpi` queda sin uso en el inicio. Prueba nueva de la página en `secciones.test.tsx` |
| 2026-10-26 | T12 | El módulo `components/filtros/barra-filtros.tsx` no existía (no se resolvía la importación) | `BarraFiltros` (cliente): props `activos {campo, valor, etiqueta}[]`, `onQuitar(campo, valor)`, `conteo`, `busqueda?`, `acciones?` y `children` (el panel). Recogida al montar; botón gris oscuro (`bg-primary`, ícono `SlidersHorizontal`) «Filtros» / «Filtros (n)» / «Ocultar filtros» con `aria-expanded` y `aria-controls` (el panel usa `hidden`); chips en `<ul aria-label="Filtros activos">` con nombre «Quitar filtro <valor>», ícono `X`, borde `--accent`, fondo `--accent-soft` al 35 % sobre `--card` y texto `--text-heading`; conteo con `role="status"`. Barra blanca con borde `--border` y radio 10 px. 4 pruebas | Desviación: la prueba buscaba el botón con `/Filtros/` y no encontraba «Ocultar filtros» (minúscula); se corrigió a `/filtros/i` sin cambiar lo que comprueba |
| 2026-10-26 | T13 | 4 fallas: no había botón «Filtros (n)» (era un `<summary>` dentro de un `<details open>`), ni chips, ni conteo con `role="status"` | `mapa/filtros.tsx` usa `BarraFiltros` con los 7 desplegables dentro del panel; chips desde los filtros de la URL (uno por valor, etiqueta = valor); quitar un chip llama a `onCambiar` sin ese valor. Recibe `conteo` y `acciones`. `vista-mapa.tsx`: conteo «N proyectos» (es-CO, singular «1 proyecto») y «Limpiar filtros» y «Descargar CSV» como acciones de la barra; orden KPI, barra, gráficas, mapa, tabla. `graficas.tsx`: `min-[860px]:grid-cols-3`. /mapa no tenía búsqueda general, así que no se agrega | Se retira el plegado por `matchMedia` en móvil (ahora siempre recogido). Desviación: en `filtros.test.tsx` y `vista-mapa.test.tsx` los ayudantes despliegan el panel antes de abrir un desplegable, los `render` pasan `conteo`, y se reemplazan la prueba «Filtros (2 activos)» del `<summary>` y el selector `summary` de la prueba de orden de la 006 (comprobaban el diseño viejo) |
| 2026-10-26 | T14 | `addControl` del mapa simulado no se llamaba (0 veces) | `mapa-proyectos.tsx`: `m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right")`; los textos «Acercar»/«Alejar» ya venían del `locale`. Se mantienen el encuadre por `bounds` de Colombia y la atribución de OpenStreetMap | Desviación: el MapLibre simulado de `a11y.test.tsx` gana `addControl` y `NavigationControl` (sin ellos el mapa fallaba al montar) |
| 2026-10-26 | T15 | El módulo `components/mapa/panel-mapa.tsx` no existía; luego, 1 falla en `vista-mapa.test.tsx` (no había tablist «Tipo de almacenamiento») | `panel-mapa.tsx` (cliente): `Pestanas` «Tipo de almacenamiento» con «Gran escala» (elegida, `MapaDiferido`) y «Detrás del medidor» (aviso con ícono `House`, h3 «Sección en construcción» y la explicación; sin mapa ni puntos) dentro de un `tabpanel` con el nombre de la pestaña. `vista-mapa.tsx` usa `PanelMapa` en lugar de `MapaDiferido`. 3 pruebas + 1 de integración | Observación: si se elige «Ver X en el mapa» desde la tabla con «Detrás del medidor» activa, no se vuelve sola a «Gran escala» (no lo pide la spec) |
| 2026-10-26 | T16 | 2 fallas: el primer bloque no tenía los KPI (eran los filtros) y no había botón «Filtros» (era un `<summary>` de un `<details open>`) | `vista-vehiculos.tsx`: orden KPI + «Participación por tipo de batería» → barra de filtros → gráficas. `filtros-vehiculos.tsx` usa `BarraFiltros` (recogida, chips por valor, conteo «N vehículos» es-CO, «Limpiar filtros» y «Descargar CSV» como acciones). `BarraFiltros` gana la prop opcional `pie`, que se ve aunque el panel esté recogido: ahí van los `Creditos` (fuentes, «Última actualización», «Ventas hasta el …»). Mismos valores. 2 pruebas | Se retira el plegado por `matchMedia` en móvil (ahora siempre recogido). `resumen-vehiculos.tsx` no cambia. Desviación: en `vista-vehiculos.test.tsx` el ayudante `abrirFiltro` despliega el panel antes (las pruebas suponían el panel abierto del diseño viejo). /mapa no usa `pie` |
| 2026-10-26 | T17 | El módulo `lib/linea-puntos.ts` no existía (no se resolvía la importación) | `lineaPuntos(normas)` → `{ puntos: { id, posicion, arriba }[], marcas: { anio, posicion }[] }`. Escala lineal en años decimales (UTC) de «primer año − 0,5» a «último año + 1,5»; precisión «Año» → mitad del año, «Mes» → mitad del mes, día → su día. Marcas cada 2 años desde el primer año hasta el último + 1. Ordenados por fecha, los puntos alternan arriba/abajo. Se exporta `anioDecimal`. 5 pruebas | — |
| 2026-10-26 | T18 | El componente `normativa/linea-puntos.tsx` no existía (no se resolvía la importación) | `LineaPuntos` (cliente): línea con marcas de año, `<ul aria-label="Normas en el tiempo">` con un botón por norma (color `COLOR_ENTIDAD`, nombre «<emisor> <tipo> <número>, <fecha>: ir a su ficha»), recuadro `role="tooltip"` (emisor, tipo y número, fecha, título) al pasar el mouse o enfocar, enlazado con `aria-describedby`, y leyenda `<ul aria-label="Emisores">`. Clic/Enter: `scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" })` sobre `#norma-{id}`, foco a la ficha y `onElegir(id)`. `vista-normativa.tsx` guarda `resaltada` y la pasa por `LineaTiempo` a `TarjetaNorma` (`data-resaltada="true"` y contorno `--accent` de 3 px). La línea va antes de la línea de tiempo con las mismas normas filtradas. 6 pruebas (3 del componente, 3 en la vista) | La ficha ya tenía `tabIndex={-1}`. Sin resultados, la línea de puntos no se muestra |
| 2026-10-26 | T19 | 1 falla: no había botón «Filtros (1)» (era un `<summary>` de un `<details open>`), ni chips. La prueba de CA-26.1 pasaba ya (es de no regresión) | `filtros-normativa.tsx` usa `BarraFiltros` (recogida, chip por valor, conteo `textoConteo`, «Limpiar filtros» como acción). Recibe `conteo` y `acciones`. 2 pruebas | Se retira el plegado por `matchMedia` en móvil. Desviación: en `vista-normativa.test.tsx` y `filtros-normativa.test.tsx` los ayudantes despliegan el panel antes de abrir un desplegable y los `render` pasan `conteo`; la prueba «en móvil el panel empieza plegado» (buscaba `<details>`) se reemplaza por «el panel empieza recogido» |
| 2026-10-26 | T20 | 2 fallas: la tarjeta no tenía banda con `data-tema` ni fondo | `ilustracion-tema.tsx`: banda de 120 px con borde inferior de 3 px `--accent`, fondo gris claro (`bg-muted`) o durazno claro (`--accent-soft` al 35 % sobre `--card`) según el lugar del tema en `TEMAS` (par/impar), ícono lucide de 64 px `aria-hidden` (Regulación FileText, Subasta Gavel, Mercado ChartLine, Empresas Building2, Ambiente Leaf, Política pública Landmark, General Newspaper) y etiqueta con el tema (texto oscuro sobre blanco). `lista-noticias.tsx` la pone arriba de cada tarjeta con `temaDe(n.etiquetas)`. Sin `<img>`. 3 pruebas | La tarjeta pasa a `overflow-hidden` con el contenido en un bloque interior con `p-4` |
| 2026-10-27 | T21 | `e2e/007-rediseno.spec.ts` escrito con E2E-01 a E2E-42 (más `e2e/007.config.ts`, igual que 002.config con WebGL por software) | **007** (`npx playwright test -c e2e/007.config.ts --project=escritorio --workers=1`, corrida final): 41 de 42 pasan; E2E-01 queda en rojo solo por contraste, decisión pendiente del usuario: 2,76:1 (#2b2f31 sobre #6b7276, `--surface-selected`) en 3 pestañas activas de /mapa (las dos de las gráficas y la del mapa) y en los 9 botones de la cabecera de la tabla. E2E-39: ninguna noticia queda en «General». E2E-10: /mapa no tiene búsqueda general (RF-08 «si la página la tiene»). **001-lcp** (sitio publicado, aún sin el rediseño): `/`, /normativa, /noticias pasan; /mapa y /vehiculos en el límite (medianas 2.500–2.576 ms frente a < 2.500). Suite unitaria 432/432, `tsc` sin errores, `eslint src` sin errores (1 aviso previo de TanStack). **001** (`npx playwright test e2e/001-arquitectura.spec.ts --workers=1`): 12 pasan; tras los ajustes pasan E2E-02, E2E-05 y E2E-17; siguen en rojo E2E-11 (fecha del historial en UTC: después de las 19:00 de Colombia muestra el día siguiente; ajeno a la 007), E2E-13 (`normativa.csv` contiene un correo en los datos; ajeno a la 007) y E2E-18 (tras T22, T23 y T24 solo queda el contraste de pestañas y cabecera de la tabla, decisión pendiente). **002** (`-c e2e/002.config.ts`): 21 pasan + 3 inestables (error de E/S al guardar la traza, pasan al reintentar); E2E-22 (375 px) pasa tras el ajuste. **003** (`E2E_MATCH=003-vehiculos.spec.ts -c e2e/006.config.ts`): 16 pasan; E2E-03 pasa tras el ajuste; E2E-13 en rojo porque espera que la última importación sea de hoy (fue el 24/10; ajeno a la 007). **004** (`e2e/004-normativa.spec.ts`): 4 pasan y los 23 de datos quedan bloqueados por su precondición «el entorno de pruebas no tiene otras normas aprobadas» (hoy hay 25 normas reales aprobadas en la base de pruebas; ajeno a la 007, no se borraron). **005**: 11 pasan; E2E-10 pasa tras el ajuste; E2E-07 en rojo porque espera aportes Noticia pendientes de la carga inicial y ya no hay (ajeno a la 007). **006** (`-c e2e/006.config.ts`): 15 pasan; E2E-01 pasa tras el ajuste. **007** primera corrida (RED): 32 pasan y 10 fallan; de ellas, 2 son defectos reales (T22 y T23, ver abajo) y el resto escenarios mal escritos que se corrigen: carrera con la hidratación de los filtros de la URL en /mapa (E2E-14, E2E-20: se espera «Filtros (n)» y que filas = conteo), «©» de los créditos del mapa contaba como emoji (E2E-07: se usa `Emoji_Presentation`), formato de fecha dd/mm/aaaa (E2E-30), una dispersión mínima de puntos que no aplica con 7 proyectos (E2E-24), tiempos de espera (E2E-08, E2E-17, E2E-18) y errores de E/S al guardar trazas (E2E-42; `007.config.ts` sin trazas) | Ajustes (solo selectores del diseño viejo): **001** E2E-02 y E2E-05 leen «Proyectos identificados» en lugar de la tarjeta retirada «Proyectos por estado» (E2E-02 compara el total de aprobados); E2E-17: la referencia sin movimiento reducido ahora espera que no haya conteo (RF-11 de la 007 retira la animación); se quita el ayudante `conteosPorEstado`. **002** `desplegarPanel()` abre la barra «Filtros» antes de un desplegable (en `abrirFiltro`, en la segunda pestaña de E2E-15 y antes de leer el botón Estado en E2E-18); en E2E-22 se marca el primer departamento ofrecido (tras la limpieza no hay Antioquia en los datos reales). **003** `abrirFiltro` despliega la barra antes. **004** el plegador es el botón «Filtros» (antes un `<summary>`) y E2E-11 despliega la barra antes de leer los desplegables. **003** E2E-03 despliega la barra antes de leer los botones de los filtros. **005** E2E-10 llega a /noticias desde «Últimas noticias» del inicio (la tarjeta «Noticias» de «Secciones» se retiró en RF-12). **006** el orden de E2E-01 usa el botón «Filtros» como referencia de la barra y toma la primera región «Mapa» (la sección con pestañas; el lienzo de MapLibre también se llama «Mapa de los proyectos…») y E2E-02 la despliega antes del desplegable. Entorno: `node_modules` del worktree era un enlace (junction) fuera de la raíz y Turbopack no arrancaba; se reemplazó por una copia |
| 2026-10-27 | T22 | 1 falla: la `<table>` tenía `sr-only` (en el navegador, `/` medía 424 px a 375 px) | La tabla va dentro de `<div className="sr-only">`; `/`, `/vehiculos`, `/noticias` y `/aportar` miden 375 px | — |
| 2026-10-27 | T23 | 1 falla: los sectores `[role="img"]` no estaban dentro de un `aria-hidden` | El `ResponsiveContainer` de `Dona` va dentro de `<div aria-hidden="true" className="h-full">`; el total y la leyenda siguen expuestos. Segunda falla (E2E-01 dio `aria-hidden-focus`: la capa del `Pie` trae `tabIndex=0`): la prueba suma «nada enfocable dentro de lo oculto» (RED) y el `Pie` pasa a `rootTabIndex={-1}` | Resuelve también la observación de la 006 de un `g` sin nombre en el recorrido con Tab |
| 2026-10-27 | T24 | 1 falla: no había regla que subrayara los enlaces de la atribución; luego, con `.maplibregl-ctrl-attrib a`, seguía sin subrayado porque `maplibre-gl.css` se carga después con la misma especificidad (la prueba pasó a exigir el prefijo `.maplibregl-map`) | Regla `.maplibregl-map .maplibregl-ctrl-attrib a { text-decoration: underline; }` en `globals.css`; axe deja de marcar `link-in-text-block` en E2E-18 de la 001 | — |
| 2026-10-27 | T25 | El par «pestaña activa y cabecera de la tabla» daba NaN (no existía `--text-on-selected`; antes 2,76:1, #2b2f31 sobre #6b7276) | `--surface-selected` → `--teal-600` y nuevo `--text-on-selected` (blanco, 10:1); `pestanas.tsx` y `tabla-proyectos.tsx` lo usan. Suite 432/432 | Decisión del usuario (2026-10-27): texto blanco sobre gris oscuro, como la maqueta. CA-07.1 y CA-08.1 (sin búsqueda en `/mapa`) actualizados en la spec |

## Informe E2E
[e2e-informe.md](e2e-informe.md): E2E limpio 42/42 (2026-10-27). RNF-05 (LCP publicado) queda por medir al publicar.
