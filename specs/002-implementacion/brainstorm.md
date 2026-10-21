# 002 · Implementación en el país

Estado: Aprobado (enfoque A, 2026-10-21)
Fecha: 2026-10-21

## Idea
Reemplazar la página «en construcción» de `/mapa` por un mapa de los SAEB de Colombia con
una tabla debajo. Ambos comparten los mismos filtros, y cada proyecto muestra una tarjeta
con su información y sus fuentes.

## Problema y público
Hoy el inventario solo se consulta descargando el CSV. Desarrolladores, operadores,
ingenieros de planeación y conexión, y la academia necesitan ver dónde están los
proyectos, en qué estado van, de qué tamaño son y para qué se usan. También necesitan
poder citar cada cifra con su fuente.

## Preguntas que responde al usuario final
- ¿Cuántos MW y cuántos MWh hay en operación en el país? ¿Cuántos proyectos hay en cada estado?
- ¿Dónde están los proyectos y cuáles hay en mi departamento o municipio?
- ¿Qué proyectos prestan un servicio dado (`Tipo uso/conexión`)?
- ¿Quién opera cada proyecto, con qué tecnología y desde qué año (FPO)?
- ¿De dónde sale cada cifra? (fuente visible en la tarjeta)

## Datos necesarios
| Dato | ¿Existe? | Fuente |
|---|---|---|
| Proyectos aprobados (7) con estado, ubicación, MW, MWh y fuente | Sí, en Supabase (`proyectos`) y `datos/proyectos.csv` | `Base de datos SAEB` |
| Coordenadas | Sí, corregidas el 2026-10-20 | `Base de datos SAEB` |
| `Tipo uso/conexión` como lista cerrada | **No.** Hoy es texto libre con 3 valores y 1 proyecto vacío | El usuario define la lista y corrige la Sheet |
| Resolución que habilita el proyecto | No | Fuera del MVP (decisión del 2026-10-21) |
| Teselas del mapa | Sí | Basadas en OSM (stack aprobado: MapLibre GL) |

## Decisiones de la conversación (2026-10-21)
| Tema | Decisión |
|---|---|
| Servicios | Se filtra por `Tipo uso/conexión`. La resolución habilitante queda fuera del MVP |
| `Tipo uso/conexión` | Lista cerrada en el esquema (validador, formulario, `/admin`, base e importación), con varios valores por proyecto. Un valor vacío se muestra como «Sin dato» |
| Vista principal | Mapa arriba y tabla (TanStack) debajo, con los mismos filtros |
| Detalle | Tarjeta sobre el punto: se abre con hover en escritorio, con toque en móvil y con foco de teclado. Al hacer clic en una fila de la tabla, el mapa se centra y abre la tarjeta. No hay página por proyecto |
| Filtros MVP | Estado, departamento, municipio, `Tipo uso/conexión`, operador, tecnología y año de FPO |
| KPI | Fijos: MW y MWh en operación, como en el inicio. Aparte: conteo, MW y MWh «según filtros». MW y MWh nunca se suman ni comparten eje |

## Alternativas
### A. Filtrado en el navegador con el estado en la URL (recomendada)
La página trae del servidor (con la caché actual, ≤ 5 min) todos los proyectos aprobados.
Filtra en el cliente, y el mapa (MapLibre), la tabla y los KPI usan el mismo resultado.
Los filtros quedan en la URL (`?estado=…&departamento=…`), así que una vista filtrada se
puede compartir y citar.
- Ventajas: respuesta inmediata; sin carga extra en Supabase gratuito; fácil de probar
  (función pura de filtrado con Vitest).
- Costos: todos los datos viajan al navegador; con decenas o cientos de proyectos es
  despreciable.
- Riesgos: MapLibre pesa unos 200 kB; se carga solo en `/mapa` y de forma diferida para
  no dañar el LCP.

### B. Filtrado en el servidor
Cada cambio de filtro consulta Supabase.
- Ventajas: escala a miles de registros.
- Costos: latencia en cada filtro y más consumo del plan gratuito; no hace falta con
  7 proyectos.

### C. Reutilizar el mapa Leaflet de `Mapa/`
- Ventajas: ya existe.
- Costos: Leaflet está fuera del stack aprobado y el mapa viejo lee el CSV por posición.
  Sirve como referencia de diseño (colores por estado, etiqueta), no como código.

## Enfoque elegido
Se propone la **A**. Los datos son pocos, el plan gratuito es limitado y las vistas
filtradas compartibles por URL sirven al público técnico. Los puntos del mapa se colorean
por estado con los tokens TEJ. Los proyectos sin coordenadas no aparecen en el mapa, pero
sí en la tabla, con un aviso. La descarga CSV del resultado filtrado reutiliza la licencia
CC BY 4.0 de la 001.

## Dentro del MVP / después
- MVP: mapa + tabla + tarjeta accesible, los filtros acordados en la URL, KPI fijos y
  filtrados, lista cerrada de `Tipo uso/conexión` en todas las capas, descarga del
  resultado filtrado, enlace «Proponer corrección» desde la tarjeta hacia `/aportar`,
  375 px sin desplazamiento horizontal y movimiento reducido.
- Después: filtros por dimensiones (rangos de MW, MWh y duración), que quedaron fuera por
  decisión del usuario. También: resolución habilitante, agrupación de puntos (clusters)
  cuando haya muchos proyectos, página propia por proyecto y capas de la red (subestaciones).

## Preguntas abiertas
- ¿Cuáles son los valores de la lista cerrada de `Tipo uso/conexión`? Los define el
  usuario. Hoy existen: «Regulación primaria de frecuencia», «Inyección de energía por la
  noche» y «Mercado regulado a través de los contratos de largo plazo». ¿Se llama
  «Servicios» en la interfaz?
- ¿Varios valores por proyecto se separan con `;` en la Sheet?
- Canadian solar (Inactivo, 50 MW / 45 MWh) no tiene tipo de uso: ¿se completa en la
  Sheet o queda como «Sin dato»?
