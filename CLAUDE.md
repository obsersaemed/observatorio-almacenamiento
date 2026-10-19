# Observatorio de Almacenamiento de Energía — MVP

Sitio web único e interactivo para seguir la implementación de los sistemas de
almacenamiento de energía con baterías (**SAEB**) en Colombia. Después podrá migrar al
sitio del Observatorio de Transición Energética Justa (TEJ). Este archivo es el arnés
del proyecto: define alcance, fuentes, estructura y reglas de trabajo. Si una decisión
nueva del usuario contradice algo de aquí, prevalece la decisión y se actualiza este
archivo.

## Decisiones tomadas (2026-10-19)

- **Sitio único** en `sitio/`, autónomo (sin dependencias de fuera de esa carpeta),
  para poder migrarlo a TEJ sin rehacerlo.
- **Alcance: solo SAEB** (baterías). No se incluyen bombeo, hidrógeno ni almacenamiento térmico.
- **Vehículos eléctricos** forma parte del MVP.
- **Entrega del MVP: 2026-10-27.**

## Público objetivo

Empresas (desarrolladores, operadores), ingenieros (planeación, conexión, operación) y
academia. El contenido es técnico y verificable; la regulación se condensa y se explica
para lectores que no son abogados.

## Secciones del sitio

| Sección | Carpeta | Datos | Base existente |
|---|---|---|---|
| Implementación en el país | `sitio/mapa/` | `datos/proyectos.csv` | `Mapa/` (Leaflet + OSM) |
| Vehículos eléctricos | `sitio/vehiculos/` | `Vehiculos/` (pipeline) | `Vehiculos/dashboard/` |
| Evolución normativa | `sitio/normativa/` | `datos/normativa.csv` | — |
| Noticias | `sitio/noticias/` | `datos/noticias.csv` | — |

**Implementación en el país**: filtros por tecnología, ubicación (departamento,
municipio, mapa), dimensiones (MW, MWh, duración), servicios, clasificación según la
resolución que habilita el proyecto y tipo de uso o conexión.

**Evolución normativa**: línea de tiempo. Cada norma se *condensa* (`resumen`) y se
*explica* (`explicacion`). Emisores: CREG, MME y CNO (y UPME o XM cuando aplique).

**Noticias**: curadas. Solo se publican las que tienen `revision = Aprobada`.

## Método: desarrollo guiado por especificaciones (SDD)

Toda funcionalidad del MVP pasa por cuatro fases, cada una con su skill y su documento
en `specs/NNN-nombre/`. **No se avanza de fase sin la aprobación del usuario.**

| Fase | Skill | Documento | Pregunta que responde |
|---|---|---|---|
| 1 | `brainstorm` | `brainstorm.md` | ¿Qué problema resolvemos y con qué enfoque? |
| 2 | `specdefinition` | `spec.md` | ¿Qué debe hacer y cómo se comprueba? (RF, criterios Dado/Cuando/Entonces) |
| 3 | `planwriting` | `plan.md` | ¿Cómo se construye? (archivos, tareas T01…, trazabilidad) |
| 4 | `implementation` | `plan.md` (tareas marcadas + registro) | Construir y verificar tarea por tarea |

- La spec es la fuente de verdad. Si un requisito cambia, se edita primero `spec.md` y
  después el código.
- Cada tarea cita los RF que cubre y su forma de verificación. Una tarea con
  verificación fallida no se marca como hecha.
- Los arreglos pequeños (una errata, un color, una fila de datos) no requieren el flujo
  completo; basta con anotarlos en `BITACORA.md`.

## Estructura

```
specs/            Una carpeta por funcionalidad: brainstorm.md, spec.md, plan.md
datos/            Fuente única de verdad del sitio (CSV + esquemas.json)
sitio/            Sitio estático publicable (GitHub Pages); assets/ds = design system TEJ
scripts/          validar_datos.py (validador) y hook_validar.py (hook de Claude Code)
pruebas/          Pruebas unittest del validador
.claude/          settings.json (permisos + hook), skills/, launch.json
BITACORA.md       Decisiones y hallazgos por sesión
Mapa/ BESS/ Vehiculos/ "Obs vehiculos/"   Trabajo previo: se reutiliza y se migra a sitio/
```

`datos/proyectos.csv` reemplaza a `Mapa/proyectos.csv`, que queda como legado. Los
datos de `datos/` provienen de la Google Sheet **`Base de datos SAEB`** (id
`1-XpWEXUFK8AOappezQaiXFFJldqgq50pkfijhBCdvTA`). Las correcciones se hacen primero allá.

## Cómo se alimenta

| Vía | Uso |
|---|---|
| Base de datos inicial | `Base de datos SAEB` → exportar a `datos/proyectos.csv` |
| Formulario | Proyectos o novedades enviados por terceros; se revisan antes de publicar (por definir) |
| Búsqueda de noticias | Skill `buscar-noticias` → filas `Pendiente` → curaduría del usuario |
| Bases oficiales | UPME (registro, subastas), XM (operación), CREG (resoluciones), CNO (acuerdos) |

## Comandos

```bash
python scripts/validar_datos.py           # valida datos/ (sale 1 si hay errores)
python -m unittest discover pruebas       # pruebas del validador
```

Servidor local: `sitio` (puerto 8768) en `.claude/launch.json`.

Skills del proyecto:
- Flujo SDD: `brainstorm`, `specdefinition`, `planwriting`, `implementation`.
- Apoyo: `validar`, `ficha-normativa`, `buscar-noticias`, `cierre-sesion`.

Hook: después de cada Edit/Write en `datos/`, se ejecuta el validador. Si hay errores,
Claude los recibe y debe resolverlos o reportarlos.

## Reglas de trabajo

- Idioma: español (Colombia). Números con coma decimal en la interfaz ("67,0 MW").
- **Nunca inventar** cifras, coordenadas, números de resolución, fechas ni noticias.
  Si falta un dato, se deja vacío y se anota como pendiente en `BITACORA.md`.
- No cambiar cifras de `datos/` sin confirmación del usuario. Primero se corrigen en la
  fuente (`Base de datos SAEB`).
- MW (potencia) y MWh (energía) nunca se suman ni comparten eje. Los KPI de "instalado"
  cuentan solo proyectos `En operación`.
- Toda cifra publicada tiene fuente (columna `Fuente` o `enlace`).
- Columnas: agregar o renombrar una columna exige actualizar a la vez
  `datos/esquemas.json`, el CSV y la página que lo lee (las páginas leen por posición).
- Visual: usar los tokens semánticos de `sitio/assets/ds/` (`--brand`, `--surface-header`,
  etc.; design system TEJ, Raleway), no colores escritos a mano.
  El mapa usa OpenStreetMap. No usar los datos de ejemplo del design system como reales.
- Reutilizar lo existente antes de crear algo nuevo. No proponer otro stack sin que el
  usuario lo pida: HTML, CSS y JS sin framework ni paso de compilación, y Python solo
  con la biblioteca estándar en `scripts/`.
- `sitio/` debe funcionar servido como carpeta estática, con rutas relativas.
- Antes de publicar, el validador y las pruebas deben pasar y el usuario debe confirmar.
- No subir credenciales ni datos personales del formulario.
- Al cerrar cada sesión: skill `cierre-sesion`.

## Pruebas y despliegue

- **Pruebas**: `validar_datos.py` revisa columnas y su orden, obligatorios, enums,
  rangos (coordenadas dentro de Colombia, % entre 0 y 100), fechas, enlaces, claves
  duplicadas y referencias cruzadas. Además: revisar cada página en el navegador
  (consola sin errores, ancho de móvil).
- **Despliegue**: GitHub Pages sirviendo `sitio/` (repositorio por crear). Pendiente de
  confirmar con la pizarra 3.

## Cronograma (MVP al 2026-10-27)

| Fecha | Entregable | Estado |
|---|---|---|
| 10-19 | Arnés: CLAUDE.md, datos, validador, hook, skills, esqueleto del sitio | Hecho |
| 10-20 | Corregir coordenadas en la fuente; migrar el mapa a `sitio/mapa/` | |
| 10-21 | Filtros y KPI de implementación | |
| 10-22 | Migrar vehículos a `sitio/vehiculos/` | |
| 10-23 | Normativa: primeras fichas + línea de tiempo | |
| 10-24 | Noticias: búsqueda inicial + página | |
| 10-26 | Revisión completa, móvil, validación | |
| 10-27 | Publicación | |

## Decisiones abiertas

Preguntas 5–20 de la sesión del 2026-10-19 (clasificación por resolución, servicios,
fuentes de noticias, formulario, bilingüe, mantenimiento) y la pizarra 3. Al
responderlas, pasar cada decisión a la sección correspondiente.
