# Bitácora — Observatorio de Almacenamiento (MVP)

Registro de decisiones, hallazgos y avances del sitio único. Las bitácoras de
`BESS/` y `Vehiculos/` quedan como historial de cada módulo.

---

## 2026-10-19 — Arnés del proyecto

### Decisiones
- Sitio único (`sitio/`), migrable después al sitio TEJ.
- Alcance: solo SAEB (baterías).
- Vehículos eléctricos entra en el MVP.
- Entrega del MVP: 2026-10-27 (ocho días).

### Hecho
- `CLAUDE.md` con alcance, fuentes, estructura y reglas.
- `datos/` como fuente única: `esquemas.json`, `proyectos.csv` (copia de `Mapa/`),
  `normativa.csv` y `noticias.csv` (solo encabezado).
- `scripts/validar_datos.py` + 7 pruebas en `pruebas/` (todas pasan).
- Hook que valida `datos/` cada vez que Claude edita un archivo allí.
- Skills: `validar`, `ficha-normativa`, `buscar-noticias`, `cierre-sesion`.
- `sitio/index.html` (esqueleto con las 4 secciones) y servidor `sitio` en `launch.json`.

### Hallazgos
- **Coordenadas de los 7 proyectos fuera de Colombia**: el CSV trae `49,653` / `-739,128`
  en vez de `4,9653` / `-73,9128`. Al exportar se perdió la posición del separador decimal.
  El mapa actual (`Mapa/`) ubica mal los puntos. Corregir en la `Base de datos SAEB`
  (formato de celda) y volver a exportar.

### Entorno local
- Se instalaron con winget **Node.js 24.20.0 LTS** (npm 11.19.0) y **GitHub CLI 2.102.0**.
- Ya estaban instaladas las dependencias de Python de `Vehiculos/` y Chromium de Playwright.
- Sin Docker y con 3,4 GB de RAM: Supabase local descartado; se usará un proyecto
  "pruebas" en el plan gratuito.

### Supabase (T05)
- Proyecto `observatorio-pruebas` en la organización "Observatorio TEJ" (plan Free).
  Llaves nuevas (`sb_publishable_`/`sb_secret_`) en `web/.env.local`, que no se sube.
- La secret key se rotó el mismo día porque quedó expuesta en una salida de comandos.
- `supabase db push` falló al conectar por el pooler (usuario temporal `cli_login_postgres`)
  aunque los puertos 5432 y 6543 están abiertos. La migración `0001_base.sql` se aplicó en el
  SQL Editor. **Pendiente:** `npx supabase migration repair --status applied 0001` cuando la
  CLI conecte, para que Supabase registre la migración.
- La rama por defecto de Supabase se llama "main · PRODUCTION" aunque el proyecto sea de pruebas.

### Pendiente
- Respuestas a las preguntas 5–20 de la sesión anterior.
- Foto de la pizarra 3.

## 2026-10-20 — Coordenadas corregidas

- El usuario corrigió las coordenadas de los 7 proyectos en `datos/proyectos.csv` (por ejemplo
  `49,653` → `4.9653`). Validador: 0 errores. El archivo venía de Excel en cp1252 y entró sin
  revisión en los commits 4b851aa y 2eeb7ee (con `git add -A`); se pasó a UTF-8 sin cambiar datos.
- `validar_datos.leer_csv` ahora acepta UTF-8 y cp1252 (exportaciones de Excel).
- Lección: revisar `git status` antes de cada commit en lugar de `git add -A` a ciegas.
- Importación a Supabase **pruebas** (`scripts/importar.py --entorno pruebas`): 7 proyectos como
  Aprobado. El inicio muestra 17,0 MW y 12,8 MWh en operación (Termozipa, La Martina, Celsia
  Palmira 2) y 3/1/2/1 por estado; `/datos/proyectos.csv` trae los 7.

## 2026-10-20 — Publicación de prueba (T17)

- Repositorio privado https://github.com/obsersaemed/observatorio-almacenamiento (cuenta personal
  obsersaemed). Secretos del respaldo: SUPABASE_URL y SUPABASE_ANON_KEY; primera corrida del respaldo
  correcta (7 proyectos, commit del bot b0904f5).
- Vercel Hobby: proyecto observatorio-almacenamiento (equipo "Observatorio SAEB col"), Root
  Directory `web`, 6 variables (4 públicas marcadas como seguras, 2 privadas). Dominio
  https://observatorio-almacenamiento.vercel.app con datos de Supabase **pruebas** y llaves de
  prueba de Turnstile. No se usa la integración de Supabase de Vercel.

## 2026-10-20 — Cierre de sesión

### Hecho hoy
- Plataforma base 001 completa: T01–T17 y las correcciones del E2E T18–T21 (21/21 tareas).
- E2E limpio (agente independiente): 17/19 escenarios en verde en la primera corrida; las 3
  fallas (fuente e historial, mensaje de la base, formato es-CO en /admin) se corrigieron con
  TDD. Spec ajustada con aprobación: el formulario público no captura Estado (CA-16.1) y el
  historial se consulta en /admin con la fuente del aporte (CA-11.1).
- Migraciones aplicadas en Supabase pruebas (SQL Editor): 0001, 0002 y 0003.
- Sitio de prueba publicado: https://observatorio-almacenamiento.vercel.app (despliegue
  automático desde main). Respaldo diario activo en GitHub Actions.
- Pruebas: 123 web, 24 de integración, Python en verde; validador: 0 errores.

### Pendiente para la próxima sesión
1. **Volver a correr el E2E limpio** sobre la spec 001 para confirmar F1–F3 corregidas y cerrar
   la spec (puerta: E2E en verde + aprobación del usuario).
2. Vercel: confirmar que `SUPABASE_SERVICE_ROLE_KEY` y `TURNSTILE_SECRET_KEY` quedaron como Secret.
3. Supabase CLI: `npx supabase migration repair --status applied 0001 0002 0003` cuando el
   pooler conecte (hoy falla "failed to connect as temp role").
4. Antes del 27: llaves reales de Turnstile (P5) y decidir si producción usa el proyecto
   `observatorio` o se mantiene `observatorio-pruebas`.
5. Spec 002 · Implementación en el país (mapa, filtros, KPI): empezar con `brainstorm`.
6. Decisiones abiertas: preguntas 5–20 (clasificación por resolución, servicios, fuentes de
   noticias, bilingüe, mantenimiento).

## 2026-10-21 — 001 cerrada y 002 · Implementación en el país terminada

### Hecho
- **001:** el segundo E2E limpio dio 19/19 y la spec se cerró como Terminada (commit 5925db0).
- **002:**
  - Brainstorm y spec aprobados. Decisiones:
    - Servicios = `Tipo uso/conexión` como lista cerrada, separada por coma.
    - Sin resolución habilitante ni filtros por dimensiones en el MVP.
    - La tarjeta no muestra enlaces de fuente.
  - Plan de 22 tareas implementado con TDD.
  - `/mapa` muestra el mapa (MapLibre + OpenFreeMap/OSM), la tabla, los filtros en la URL, los KPI «Instalado» y «según filtros», la tarjeta accesible (mouse, toque y teclado) y la descarga CSV filtrada.
  - E2E limpio en 3 corridas: 22/26, 21/23 y 23/23. Las fallas se convirtieron en las tareas T15–T21; la observación O-8, en T22.
- **Migración 0004** (servicios como lista y conversión de 2 textos), aplicada por el usuario en **pruebas**. `datos/proyectos.csv` quedó con los mismos 2 textos convertidos; ninguna cifra cambió.
- **Pruebas:** 198 web, 28 de integración y Python en verde; validador sin errores; `npm run build` correcto. El LCP de `/mapa` en local con 4G lenta tuvo una mediana de 1,16 s.

### Hallazgos
- `npm run build` encontró un error que las pruebas unitarias no detectaban: `searchParams` fuera de `<Suspense>` en `/aportar`, que rompe el prerender con `cacheComponents`. Conviene compilar antes de cada E2E.
- El CSS de MapLibre pone `position: relative` al contenedor del mapa.
- En desarrollo, el indicador de Next.js tapa la esquina inferior izquierda y tiene su propio `aria-expanded`.
- Con el panel del navegador oculto, `requestAnimationFrame` no corre y el mapa no carga. Para revisar se usa Playwright sin interfaz.

### Pendiente
1. Corregir en la `Base de datos SAEB` los 2 textos de servicios (ya corregidos en `datos/` y en **pruebas**).
2. Observaciones menores de la 002:
   - «Data from OpenStreetMap» aparece en inglés (viene del estilo de OpenFreeMap).
   - La tarjeta se monta sobre el punto (O-9).
3. Los pendientes 2–4 y 6 de la sesión del 10-20 (secretos de Vercel, `migration repair`, Turnstile real, decisiones abiertas).
4. Publicar en Vercel (push a `main`) solo con la confirmación del usuario.
5. Siguiente: 003 · Vehículos eléctricos.

## 2026-10-21 — Filtros de /mapa como desplegables (T23)
- A pedido del usuario, cada filtro pasó a ser un desplegable de selección múltiple: muestra «Todas», el valor elegido o «N seleccionados», y al abrirlo trae la casilla «Todas», un buscador y el conteo por opción. Sin cambio de spec (RF-08 no fija la forma del control).
- TDD: 203 pruebas web en verde y build correcto. El E2E limpio adaptó sus pruebas y la cuarta corrida dio 23/23.

## 2026-10-22 — 006 · Gráficas de implementación terminada

### Hecho
- Se pidió agregar a `/mapa` gráficas como las del «Real-time Energy Storage Dashboard» del JRC.
  Brainstorm, spec y plan aprobados.
- `/mapa` muestra tres gráficas (Recharts) entre los filtros y el mapa, todas con «Ver como
  tabla» y con el mismo resultado filtrado:
  - barras por estado con pestañas Potencia [MW] | Energía [MWh] | Duración [h];
  - evolución acumulada por año de FPO, en orden, con las series «En operación y en
    construcción» y «Anunciado (proyectado)»; los proyectos inactivos no suman;
  - dona de tecnología.
- 8 tareas con TDD. E2E limpio: 11/12 en la primera corrida (la falla se corrigió en T08) y
  12/12 en la segunda.
- Pruebas: 235 en la web; build correcto; LCP de `/mapa` con una mediana de 1,41 s.

### Hallazgos
- En jsdom la animación de Recharts no avanza: el dibujo final se prueba con movimiento reducido.
- Recharts no dibuja la etiqueta de un valor nulo: la barra se dibuja en 0 y la etiqueta va aparte («—»).
- Una curva `monotone` en un acumulado inventa bajadas: se usa `linear`.
- Con 3,4 GB de RAM, Vitest necesita `testTimeout` de 20 s. Una corrida reportó 35 de 36 archivos sin ninguna falla.

### Decisiones
- RNF-04 de la 006: el decimal aplica a los valores; las marcas de los ejes de MW y MWh pueden ser enteras.
- Barras por departamento y por servicio quedan para después del MVP.


## 2026-10-22 — Publicación de la 002 y la 006 en el sitio de prueba
- Antes del push: validador sin errores, Python OK y 235 pruebas web en verde. Se hizo rebase sobre el respaldo diario del bot (`5d34798`, que solo cambió `respaldo/proyectos.csv` con los textos de servicios de la 0004) y push de `ad74205` a `main`. Vercel desplegó correctamente.
- Verificado en https://observatorio-almacenamiento.vercel.app/mapa, en escritorio y a 375 px:
  - KPI de 17,0 MW instalados, 7 puntos, 7 filas y las 3 gráficas.
  - El filtro «Anunciado» (desplegable) deja 2 filas y 2 puntos y pone `?estado=Anunciado` en la URL.
  - La tarjeta se abre con clic o toque y sigue abierta al desplazar la página.
  - «Proponer corrección» lleva a `/aportar` prellenado.
  - Sin errores de consola y sin desplazamiento horizontal.
- LCP del sitio publicado (4G lenta): `/mapa` 1,53 s y `/aportar` 1,75 s (medianas).
- Observación: `/aportar` muestra un instante el formulario sin prellenar (el de espera del `Suspense`) antes del prellenado.

## 2026-10-22 — 003 · Vehículos eléctricos terminada

### Hecho
- Brainstorm, spec y plan aprobados. Decisiones:
  - publicar por línea;
  - híbridos enchufables sin distinguir;
  - datos en Supabase;
  - contenido del tablero de Looker;
  - fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio, con «Última actualización» y «Ventas hasta»;
  - solo dos KPI;
  - sin aportes.
- Datos (modelo B):
  - `scripts/convertir_vehiculos.py` convierte la hoja con control de cuadre en `datos/vehiculos_lineas.csv` (49) y `datos/vehiculos_ventas.csv` (147);
  - reglas `entero` y `min_de` y referencia venta → línea, iguales en Python, zod y SQL;
  - migración 0005 (tablas, RLS e importación atómica `reemplazar_vehiculos`), aplicada por el usuario en **pruebas**;
  - `scripts/importar_vehiculos.py` importó 49 líneas y 45.346 unidades (corte 2026-09-17);
  - los vehículos entran al respaldo diario.
- `/vehiculos`:
  - filtros desplegables (Marca, Tipo de batería, Línea) en la URL;
  - KPI: 45.346 vehículos y 2.426,5 MWh;
  - tabla de tecnología (LFP 67,5 %);
  - barras por marca y año (2026 parcial);
  - donas de marcas y de tecnología;
  - energía por tipo;
  - créditos con las dos fechas;
  - descarga CSV filtrada.
- 17 tareas con TDD. E2E limpio en 3 corridas: 13/18, 17/18 y 18/18.
- Pruebas: 274 web, 34 de integración y Python en verde; build correcto; LCP de `/vehiculos` con una mediana de 1,60 s.

### Hallazgos
- La paleta TEJ es casi toda gris. Las categorías necesitan una paleta probada con los valores reales de `colors.css`: 10 colores distintos, y los años como en Looker.
- Los porcentajes redondeados a un decimal pueden sumar 99,9 %: la spec acepta ±0,1.
- Con 3,4 GB y unos 300 MB libres, Vitest en paralelo completo fallaba al leer `node_modules` (errno -4094): `maxWorkers: 2`.
- `/vehiculos` se prerenderiza leyendo la base: **la migración y la importación van antes del push**.

### Pendiente
- Publicar la 003 (push a `main`) cuando el usuario lo pida; la 0005 y los datos ya están en **pruebas**.
- Licencia de ANDEMOS para el detalle por línea (el usuario decidió publicar con créditos).
- Observaciones menores del E2E: un elemento `g` sin nombre en el recorrido con Tab dentro de las gráficas, y el orden de foco de la región de la tabla frente al botón «Ver como gráfica».
- Siguiente según el cronograma: 004 · Evolución normativa.


## 2026-10-22 — Publicación de la 003 en el sitio de prueba
- Antes del push: validador y Python en verde, y `origin` sin commits nuevos. Push de `1d2ad74` a `main`; Vercel desplegó correctamente.
- Verificado en https://observatorio-almacenamiento.vercel.app/vehiculos (escritorio y 375 px):
  - KPI: 45.346 vehículos y 2.426,5 MWh;
  - tecnología: LFP 67,5 %;
  - créditos con «Última actualización: 22/10/2026 · Ventas hasta el 17/09/2026»;
  - el filtro Tesla da 7.760 y pone `?marca=Tesla` en la URL;
  - sin errores de consola ni desplazamiento horizontal.
  `/mapa` sigue igual después del cambio de componentes compartidos.
- **LCP de `/vehiculos` publicado (4G lenta), cuatro medianas:** 2.048, 2.520, 1.700 y 2.100 ms. Una de las cuatro supera por 20 ms el umbral de 2.500 ms; la primera carga de cada corrida (caché en frío) llega a 2,5–3,7 s. En el build local fue 1,60 s. Pendiente: averiguar qué elemento es el LCP y aligerar la página, o confirmar que es variación de la red.
- **Decisión del usuario (2026-10-22):** revisó el LCP de `/vehiculos` y lo da por bueno; no se optimiza por ahora.
