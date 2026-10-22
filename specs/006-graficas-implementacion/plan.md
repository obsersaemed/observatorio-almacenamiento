# 006 · Gráficas de implementación en el país — Plan

Estado: Terminado (2026-10-22)
Fecha: 2026-10-21
Spec: [spec.md](spec.md)

## Enfoque técnico
Las gráficas viven en la vista de `/mapa` (spec 002) y reciben el mismo arreglo `resultado`
que alimenta el mapa, la tabla y los KPI (RF-02). Las cifras salen de funciones puras de
agregación (por estado, por año de FPO, por tecnología) en `lib/graficas-mapa.ts`, probadas
con Vitest. Así la regla de la duración, el acumulado y la exclusión de `Inactivo` se prueban
sin navegador, y el «Ver como tabla» usa exactamente los mismos números que el dibujo (RF-08).

El dibujo usa **Recharts** (stack aprobado; se instala `recharts`). Se carga de forma diferida
y solo en el cliente, como el mapa, para no afectar el LCP (RNF-02). Una tarjeta común
(`TarjetaGrafica`) pone el título, las pestañas accesibles (`role="tablist"` y flechas del
teclado, RNF-03), el botón «Ver como tabla» y el aviso «Sin datos para estos filtros» (RF-09).
Los colores de estado son los mismos de la leyenda del mapa (`COLOR_ESTADO`, tokens TEJ,
RNF-05). Las tecnologías usan tokens de la paleta TEJ, en orden. Con movimiento reducido,
`isAnimationActive={false}` (RNF-06). Las cifras usan `formatoNumero` (es-CO, RNF-04).

Se reutilizan: `aProyectoMapa` (duración y MW/MWh ya convertidos), `ESTADOS`, `COLOR_ESTADO`,
`formatoNumero`, `useMovimientoReducido` y el patrón `mapa-diferido.tsx`.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `web/src/lib/graficas-mapa.ts` (+ test) | Crear | Agregaciones por estado, año y tecnología |
| `web/src/components/graficas/pestanas.tsx` (+ test) | Crear | Pestañas accesibles |
| `web/src/components/graficas/tarjeta-grafica.tsx` (+ test) | Crear | Título, pestañas, «Ver como tabla», aviso de vacío |
| `web/src/components/graficas/grafica-estados.tsx` (+ test) | Crear | Barras por estado |
| `web/src/components/graficas/grafica-evolucion.tsx` (+ test) | Crear | Áreas acumuladas por año |
| `web/src/components/graficas/grafica-tecnologia.tsx` (+ test) | Crear | Dona |
| `web/src/components/graficas/graficas-diferidas.tsx` | Crear | Carga diferida de las tres |
| `web/src/components/mapa/vista-mapa.tsx` (+ test) | Modificar | Fila de gráficas entre los filtros y el mapa |
| `web/src/components/a11y.test.tsx` | Modificar | axe sobre las gráficas |
| `web/package.json` | Modificar | `recharts` |
| `web/e2e/006-graficas.spec.ts` | Crear (agente E2E) | Escenarios |

## Cambios de datos
Ninguno: no hay columnas, migraciones ni cambios de validación. Las pruebas usan datos
ficticios y el E2E siembra proyectos con el prefijo `e2e-`.

## Tareas
- [x] **T01 · S** · Agregaciones de las gráficas
  - Cubre: RF-03, RF-04, RF-05, RF-06, RF-07, RNF-07 · CA-03.1, CA-04.1, CA-05.1, CA-05.2, CA-06.1, CA-07.1
  - Prueba primero (RED): `graficas-mapa.test.ts`, con datos ficticios:
    - `porEstado` devuelve los 4 estados en orden fijo; las sumas de MW y de MWh van aparte; con 10/20 y 5/10 la duración es 2,0 (no 4,0); un estado sin datos da `null`.
    - `evolucion` va en orden ascendente por año, acumulada, con las series «En operación y en construcción» y «Anunciado»; excluye `Inactivo` y cuenta los proyectos sin año.
    - `porTecnologia` da porcentajes que suman 100 y el total de la medida.

    Hoy el módulo no existe.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/lib/graficas-mapa.ts`, test
- [x] **T02 · S** · Pestañas accesibles
  - Cubre: RNF-03 · CA-03.2
  - Prueba primero (RED): `pestanas.test.tsx`. Comprueba:
    - `role="tablist"` con `aria-selected` en la pestaña activa.
    - Las flechas izquierda y derecha mueven la selección y el foco.
    - Solo la pestaña activa tiene `tabIndex` 0.
    - `onCambiar` recibe la pestaña nueva.

    Hoy el componente no existe.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: —
  - Archivos: `web/src/components/graficas/pestanas.tsx`, test
- [x] **T03 · S** · Tarjeta de gráfica
  - Cubre: RF-01, RF-08, RF-09 · CA-01.1, CA-08.1, CA-09.1
  - Prueba primero (RED): `tarjeta-grafica.test.tsx`. Comprueba:
    - Muestra el título.
    - «Ver como tabla» alterna entre el dibujo y una tabla con encabezados con unidad y cifras en es-CO.
    - Con filas vacías muestra «Sin datos para estos filtros» y no muestra el dibujo.

    Hoy no existe.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T02
  - Archivos: `web/src/components/graficas/tarjeta-grafica.tsx`, test
- [x] **T04 · M** · Barras por estado
  - Cubre: RF-03, RF-04, RNF-04, RNF-05, RNF-06 · CA-03.1, CA-03.2, CA-04.1
  - Prueba primero (RED): `grafica-estados.test.tsx`, con `ResponsiveContainer` de tamaño fijo en jsdom. Comprueba:
    - Las pestañas son MW, MWh y h; el eje dice la unidad.
    - Hay etiquetas con el valor en es-CO y un color de token por estado.
    - Al cambiar de pestaña cambian las cifras.
    - Con movimiento reducido no hay animación.
    - La tabla equivalente muestra «—» en un estado sin datos.

    Hoy no existe.
  - Hecho cuando (GREEN): prueba en verde; `recharts` instalado.
  - Depende de: T01, T03
  - Archivos: `web/src/components/graficas/grafica-estados.tsx`, test, `web/package.json`
- [x] **T05 · M** · Evolución por año de FPO
  - Cubre: RF-05, RF-06 · CA-05.1, CA-05.2, CA-06.1
  - Prueba primero (RED): `grafica-evolucion.test.tsx`. Comprueba:
    - El eje x tiene años enteros en orden.
    - Hay dos áreas con leyenda en texto y pestañas MW y MWh.
    - Aparece el aviso «N proyecto(s) sin año de FPO no aparece(n) en esta gráfica».
    - La tabla equivalente trae los acumulados.

    Hoy no existe.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T01, T03
  - Archivos: `web/src/components/graficas/grafica-evolucion.tsx`, test
- [x] **T06 · S** · Dona de tecnología
  - Cubre: RF-07 · CA-07.1
  - Prueba primero (RED): `grafica-tecnologia.test.tsx`. Comprueba:
    - Hay pestañas MW, MWh y Proyectos.
    - El centro muestra el total de la pestaña activa (p. ej. «7 proyectos»).
    - La leyenda trae el porcentaje («Li-ion 100 %»).

    Hoy no existe.
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T01, T03
  - Archivos: `web/src/components/graficas/grafica-tecnologia.tsx`, test
- [x] **T07 · S** · Gráficas en la vista de `/mapa`, diferidas
  - Cubre: RF-01, RF-02, RNF-01, RNF-02, RNF-03 · CA-01.1, CA-02.1
  - Prueba primero (RED): en `vista-mapa.test.tsx`, la región «Gráficas» va después de los filtros y antes del mapa, y al filtrar sus tablas cambian y suman lo mismo que los KPI «según filtros» (barras y dona). En `a11y.test.tsx`, axe sin violaciones en las tres gráficas. Hoy la vista no tiene gráficas.
  - Hecho cuando (GREEN): pruebas en verde; `npm run build` correcto; LCP de `/mapa` < 2,5 s con build local y 4G lenta.
  - Depende de: T04, T05, T06
  - Archivos: `web/src/components/graficas/graficas-diferidas.tsx`, `web/src/components/mapa/vista-mapa.tsx`, tests

### Correcciones del informe E2E (2026-10-21)
- [x] **T08 · XS** · Duración: «—» en la gráfica, unidad en la etiqueta y eje con decimales (F: E2E-05, observación de RNF-04)
  - Cubre: RF-04, RNF-04 · CA-04.1
  - Prueba primero (RED): en `grafica-estados.test.tsx`, la pestaña Duración dibuja «2,0 h» en «En operación» y «—» en los estados sin datos, y las marcas del eje no se repiten y tienen un decimal. Hoy la etiqueta de un valor nulo no se dibuja y el eje redondea a enteros («0 1 1 2 2»).
  - Hecho cuando (GREEN): prueba en verde.
  - Depende de: T07
  - Archivos: `web/src/components/graficas/grafica-estados.tsx`, test

Estimación total: 8 tareas (2 M, 5 S, 1 XS) · unas 5 h. Cabe antes de la 003, que está programada para el 2026-10-23.

## Escenarios E2E
Se ejecutan con Playwright contra `npm run dev` conectado al proyecto **pruebas**, en
escritorio y a 375 px, con datos sembrados por el propio escenario (prefijo `e2e-`) y
borrados al final.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1 | 1. Abrir `/mapa` 2. Recorrer la página | Después de los filtros y antes del mapa: tarjetas «Capacidad por estado», «Evolución por año de FPO» y «Tecnología» |
| E2E-02 | CA-02.1 | 1. Filtrar por un departamento 2. Abrir «Ver como tabla» en barras y dona | Las sumas en MW y MWh coinciden con los KPI «según filtros»; las tres gráficas cambiaron respecto a la vista sin filtros |
| E2E-03 | CA-03.1 | 1. Mirar «Capacidad por estado» en Potencia [MW] | 4 estados en orden fijo, cifras es-CO, eje en [MW] |
| E2E-04 | CA-03.2 | 1. Pulsar Energía [MWh] (también con flechas del teclado) | La misma gráfica cambia a MWh; nunca MW y MWh juntos |
| E2E-05 | CA-04.1 | 1. Sembrar dos proyectos en operación (10/20 y 5/10) en un departamento propio 2. Filtrar por él 3. Pestaña Duración [h] | «En operación» = «2,0 h»; los estados vacíos muestran «—» |
| E2E-06 | CA-05.1 | 1. Sembrar proyectos con FPO 2021 y 2024 en operación y 2030 anunciado, en un departamento propio 2. Filtrar por él | Eje 2021 → 2030 en orden; la serie de operación y construcción crece en 2021 y 2024; «Anunciado (proyectado)» en 2030 |
| E2E-07 | CA-05.2 | 1. Sembrar un `Inactivo` con FPO en ese departamento | No suma en ninguna serie (tabla de la evolución) |
| E2E-08 | CA-06.1 | 1. Sembrar un proyecto sin FPO en ese departamento | «1 proyecto sin año de FPO no aparece en esta gráfica» |
| E2E-09 | CA-07.1 | 1. Mirar la dona en cada pestaña | Li-ion 100 %; en Proyectos, el centro coincide con el KPI «Proyectos según filtros» |
| E2E-10 | CA-08.1 | 1. Pulsar «Ver como tabla» en cada gráfica | Tabla con las mismas categorías y cifras, unidad en el encabezado |
| E2E-11 | CA-09.1 | 1. Aplicar filtros sin resultados | Las tres gráficas dicen «Sin datos para estos filtros» |
| E2E-12 | RNF-01, RNF-03, RNF-06 | 1. A 375 px y con movimiento reducido, recorrer las gráficas con Tab y flechas | Tarjetas apiladas, sin desplazamiento horizontal, pestañas con teclado, sin animación, consola sin errores |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1 | T03, T07 | E2E-01 |
| RF-02 | CA-02.1 | T07 | E2E-02 |
| RF-03 | CA-03.1, CA-03.2 | T01, T02, T04 | E2E-03, E2E-04 |
| RF-04 | CA-04.1 | T01, T04 | E2E-05 |
| RF-05 | CA-05.1, CA-05.2 | T01, T05 | E2E-06, E2E-07 |
| RF-06 | CA-06.1 | T01, T05 | E2E-08 |
| RF-07 | CA-07.1 | T01, T06 | E2E-09 |
| RF-08 | CA-08.1 | T03 | E2E-10 |
| RF-09 | CA-09.1 | T03 | E2E-11 |
| RNF-01 | — | T07 | E2E-12 |
| RNF-02 | — | T07 | LCP (`001-lcp.spec.ts` con build local) |
| RNF-03 | — | T02, T07 | E2E-04, E2E-12 |
| RNF-04 | — | T03, T04 | E2E-03, E2E-05 |
| RNF-05 | — | T04, T06 | E2E-03 |
| RNF-06 | — | T04 | E2E-12 |
| RNF-07 | — | T01, T04 | E2E-04 |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Recharts no dibuja en jsdom (tamaño 0) | Pruebas con contenedor de tamaño fijo; las cifras se prueban en las agregaciones y en la tabla equivalente |
| Recharts pesa ~100 kB y puede subir el LCP | Carga diferida en el cliente; T07 mide el LCP con build local |
| El año de FPO viene como texto («2021») | La agregación lee solo años de 4 dígitos; lo demás cuenta como «sin año» y se informa (RF-06) |
| Recharts y el React Compiler | Si el lint lo marca, se aísla como TanStack (aviso conocido); las pruebas deciden |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-21 | T01 | No compilaba: el módulo no existía | 6/6 | El porcentaje se calcula como `valor·100/total` (la prueba esperaba `100/3` exacto) |
| 2026-10-21 | T02 | No compilaba | 3/3 | La pestaña activa usa `--surface-header` + `--text-heading`, como el encabezado de la tabla (ya validado en contraste) |
| 2026-10-21 | T03 | No compilaba | 4/4 | — |
| 2026-10-21 | T04 | No compilaba; luego 2 pruebas fallaron porque en jsdom la animación de Recharts no avanza y no pinta barras ni etiquetas | 5/5 | **Ajuste de prueba:** el dibujo final se prueba con movimiento reducido, y RNF-06 comprueba los dos estados de `data-animado`. Se instaló `recharts` 2.15 |
| 2026-10-21 | T05, T06 | No compilaban | 20/20 en gráficas | La leyenda va en texto (lista) para RNF-03 |
| 2026-10-21 | T07 | `vista-mapa.test.tsx` no encontraba `graficas`; con el componente, las 2 pruebas nuevas pasan | 232/232 dos veces; build correcto; LCP de `/mapa` con 4G lenta: 2412, 1324 y 1412 ms (mediana 1,41 s) | `vitest.config.mts`: `testTimeout` de 20 s (con 3,4 GB, algunas pruebas pasaban de 5 s en paralelo; ninguna falla de aserción). **Revisión en Chromium** con capturas: (1) la curva `monotone` hacía bajar el acumulado entre 2025 y 2027 y se pasó a `linear`; (2) las etiquetas tomaban el color de la barra y se pasaron a `--text-body` (contraste). Las dos correcciones tuvieron primero su prueba RED |
| 2026-10-21 | T08 | La pestaña Duración dibujaba solo «2,0»: la etiqueta de un valor nulo no se pintaba y el eje redondeaba a enteros | 23/23 en gráficas; 235/235 en la suite; build correcto | La barra se dibuja en 0 y la etiqueta es un texto aparte («—» o «2,0 h»); el eje de Duración lleva un decimal. Una corrida de la suite reportó 35 de 36 archivos sin ninguna falla visible (proceso de prueba caído, probablemente por memoria); la siguiente corrió los 36 |

## Informe E2E
[e2e-informe.md](e2e-informe.md): segunda corrida, 12/12 escenarios en verde. RNF-02 se midió aparte con build local (mediana de 1,41 s). RNF-03 (lo que anuncia un lector de pantalla real) y RNF-05 (que no haya colores escritos a mano) no se pueden comprobar desde fuera; en el código las tres gráficas usan tokens TEJ. Cerrada con la aprobación del usuario.
