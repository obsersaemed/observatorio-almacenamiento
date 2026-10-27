# 007 · Rediseño de la interfaz

Estado: Aprobado (enfoque A, 2026-10-26)
Fecha: 2026-10-26

## Idea
Llevar a la app web el rediseño aprobado en la maqueta del 2026-10-26 (artefacto
«Rediseño Observatorio SAEB», versión 21). Cambia la apariencia y el orden de las páginas
existentes: inicio, `/mapa`, `/vehiculos`, `/normativa` y `/noticias`. No cambia los
datos ni el flujo de aportes.

## Problema y público
El sitio del MVP funciona, pero las cifras quedan debajo de títulos e introducciones
largas. Además, los filtros ocupan mucho espacio y el estilo de los botones no es sobrio.
Empresas, ingenieros y academia buscan primero la cifra y la gráfica. El rediseño pone
las estadísticas al principio, recoge los filtros y unifica el estilo: grises con acentos
naranja y contraste de texto de al menos 4,5:1.

## Preguntas que responde al usuario final
Son las mismas que hoy, pero más rápido:
- ¿Cuánto almacenamiento hay y cuánto viene? Lo muestran las cifras y la gráfica de
  crecimiento en el inicio.
- ¿Dónde están los proyectos y en qué estado? Lo muestran las gráficas, el mapa y la tabla
  de `/mapa`.
- ¿Cuánta energía almacenan los vehículos eléctricos y de qué tecnología? Lo muestra
  `/vehiculos`.
- ¿Qué normas rigen y cuándo salieron? Lo muestran la línea de puntos y la línea de tiempo
  de `/normativa`.

## Decisiones de diseño tomadas (maqueta aprobada)

**General**
- Paleta gris como la original, con acentos naranja (#e8935a y #f4b183). El contraste del
  texto es de al menos 4,5:1. Botones formales.
- Íconos Lucide. `lucide-react` ya está en `web/package.json`.
- En todas las secciones: cifras primero, título corto y el texto de introducción al
  final.
- El mapa de Colombia tenue de fondo se mantiene (`fondo-mapa.tsx`).
- Se conserva el diseño actual de las pestañas (Potencia / Energía / Duración).
- Filtros recogidos y pequeños: botón «Filtros», búsqueda, chips de filtros activos y
  conteo; el panel se despliega al pulsar.
- Animación: una sola, sobria. Las barras de crecimiento del almacenamiento suben una vez
  en el inicio. Respeta `prefers-reduced-motion`. Sin bucles ni giros.

**Inicio**
- Encabezado gris (#3f4548) con barra naranja.
- Gráfica de crecimiento: MW acumulados por año de FPO. Lo instalado va en gris y la
  proyección en naranja, con una nota que aclara qué es proyección.
- Tres tarjetas de «Secciones principales» con los textos originales:
  - Implementación: mapa de Colombia con los puntos.
  - Vehículos: ícono de vehículo eléctrico enchufado.
  - Normativa: mini línea de puntos.
- Cifras clave (MW, MWh, proyectos), últimas noticias y llamado a aportar.

**`/mapa`**
- Cuatro KPI.
- Filtros recogidos.
- Las tres gráficas de la 006 en una fila.
- El mapa, centrado en Colombia, con pestañas:
  - «Gran escala»: el mapa actual de MapLibre + OSM, con zoom.
  - «Detrás del medidor»: aviso «en construcción».
- Tabla de inventario con las columnas originales.

**`/vehiculos`**
- Cifras y tarjetas del diseño original primero: vehículos, MWh y participación por tipo
  de batería.
- Barra de filtros con créditos de fuentes y fechas.
- Las cuatro gráficas.

**`/normativa`**
- Dos vistas:
  - Línea horizontal de puntos por fecha. Al pasar el mouse se ve el documento; al hacer
    clic, la página baja de inmediato a su ficha en la línea de tiempo y la resalta.
  - La línea de tiempo vertical existente.

**`/noticias`**
- Tarjetas con una ilustración propia por tema (Lucide sobre una banda gris o
  durazno), sin fotos de los medios.

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|
| Proyectos, MW, MWh, FPO, estado, coordenadas | Sí | `proyectos` (Supabase) |
| MW acumulados por año de FPO (gráfica del inicio) | Se calcula | `proyectos`; ya lo hace la gráfica de evolución de la 006 |
| Vehículos, MWh, tipo de batería, marcas | Sí | pipeline de `Vehiculos/` |
| Normas: fecha, emisor, tipo, estado | Sí | `normativa` |
| Tema de cada noticia (para la ilustración) | Por revisar | columna `etiquetas` de `noticias`; ver preguntas abiertas |
| Proyectos detrás del medidor | No (en preparación) | El usuario los enviará; van en una spec aparte |

## Alternativas

### A. Reestilizar los componentes existentes (recomendada)
Se cambian los tokens del tema, el encabezado y el orden de cada página, y se ajustan los
componentes que ya existen: gráficas, filtros, mapa, línea de tiempo y noticias. Las
piezas nuevas son la gráfica de crecimiento, la línea de puntos, las pestañas del mapa, el
panel de filtros recogido y las ilustraciones.
- Ventajas: reutiliza lógica ya probada (filtros en la URL, cálculos, MapLibre). Las
  pruebas actuales siguen sirviendo de red. Es el menor riesgo.
- Costos: hay que actualizar pruebas de componentes y E2E que dependen de textos,
  rótulos u orden.
- Riesgos: algún estilo viejo puede quedar mezclado; se mitiga revisando página por página
  con la maqueta.

### B. Reescribir las páginas desde la maqueta
Se construyen las páginas de nuevo siguiendo el HTML de la maqueta.
- Ventajas: queda idéntico a la maqueta.
- Costos: se rehace lógica que ya funciona y se pierden pruebas.
- Riesgos: regresiones en filtros, CSV, accesibilidad y LCP. Es más lento.

### C. Solo cambiar el tema (colores y tipografía)
- Ventajas: rápido.
- Costos: no cumple lo aprobado (orden, filtros recogidos, línea de puntos, pestañas del
  mapa, crecimiento).

## Enfoque elegido
**A**, en una sola spec ordenada por fases:
1. Tema y encabezado.
2. Inicio.
3. Implementación.
4. Vehículos.
5. Normativa.
6. Noticias.

Cada fase se revisa en el navegador contra la maqueta, en escritorio y a 375 px.

## Dentro del MVP / después
- **Calendario:** el MVP se publica el 2026-10-27 con el diseño actual. El rediseño se
  construye en el worktree `rediseno-ui` y se publica después, con la confirmación del
  usuario.
- **Dentro de esta spec:** todo lo listado en «Decisiones de diseño tomadas». La pestaña
  «Detrás del medidor» lleva el aviso «en construcción».
- **Después, en otra spec:**
  - Datos de proyectos detrás del medidor: esquema, carga, puntos en el mapa y si cuentan
    o no en los KPI.
  - Filtros por MW, MWh y duración, y clasificación por resolución (ya anotados en la
    002).

## Preguntas abiertas
- **Tema de cada noticia:** hoy existe la columna `etiquetas`. ¿El tema se toma de la
  primera etiqueta, con una lista cerrada (Regulación, Subasta, Mercado, Empresas,
  Ambiente, Política pública), o se agrega una columna `tema`? Una columna nueva exige
  cambiar el esquema, el CSV, la base y `/admin`.
- **Proyección en la gráfica del inicio:** ¿incluye los proyectos «Anunciado» y «En
  construcción» por año de FPO, como la maqueta (35 MW en 2027 y 135 MW en 2030)?
- **Detrás del medidor:** cuando lleguen los datos, ¿los proyectos son pocos y con
  coordenadas, o vienen agregados por municipio o departamento? Eso define si el mapa usa
  puntos o colores por zona.
