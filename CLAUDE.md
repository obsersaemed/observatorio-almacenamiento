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

## Arquitectura (aprobada el 2026-10-19, ver `specs/001-arquitectura/`)

- **Frontend:** Next.js (React, TypeScript) + Tailwind CSS + shadcn/ui + Tremor, con el
  tema de los tokens TEJ. Gráficas con Recharts (ECharts solo si una vista lo exige),
  mapa con MapLibre GL sobre teselas basadas en OSM, tablas con TanStack Table,
  animaciones con Motion y GSAP (respetando `prefers-reduced-motion`).
- **Datos:** Supabase (Postgres + Auth + RLS) es la fuente de verdad después de la
  importación inicial de la `Base de datos SAEB`. Respaldo diario a CSV en el repositorio.
- **Hospedaje:** Vercel Hobby (proyecto no remunerado y no comercial), con el
  repositorio en la cuenta personal de GitHub.
- **Actualización:** usuarios (formulario) y agentes proponen cambios en una cola de
  `aportes` con estado `Pendiente`; solo un editor aprueba. Nadie publica directamente.
- **Agentes:** en el MVP se corren a mano desde Claude Code; programados después.
- Límites de los planes gratuitos y riesgos: ver el brainstorm de la arquitectura.

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

**Implementación en el país** (brainstorm 002 aprobado el 2026-10-21): mapa + tabla con
los mismos filtros (estado, departamento, municipio, servicios = `Tipo uso/conexión` como
lista cerrada, operador, tecnología y año de FPO) y una tarjeta por proyecto sobre el punto.
Después del MVP: filtros por dimensiones (MW, MWh, duración) y clasificación según la
resolución que habilita el proyecto.

**Evolución normativa**: línea de tiempo. Cada norma se *condensa* (`resumen`) y se
*explica* (`explicacion`). Emisores: CREG, MME y CNO (y UPME o XM cuando aplique).

**Noticias**: curadas. Solo se publican las que tienen `publicacion = Aprobado`.

## Método: desarrollo guiado por especificaciones (SDD)

Toda funcionalidad del MVP pasa por cuatro fases, cada una con su skill y su documento
en `specs/NNN-nombre/`. **No se avanza de fase sin la aprobación del usuario.**

```
brainstorm ──▶ specdefinition ──▶ planwriting ──▶ implementation ──▶ aprobación final
(conversación)  (conversación)     (conversación)   /sdd-implementar    del usuario
                 └ /sdd-revisar     └ /sdd-revisar   TDD por tarea + E2E limpio
                   (opcional)         (opcional)
```

| Fase | Skill | Documento | Pregunta que responde | Puerta de salida |
|---|---|---|---|---|
| 1 | `brainstorm` | `brainstorm.md` | ¿Qué problema resolvemos y con qué enfoque? | `Estado: Aprobado` |
| 2 | `specdefinition` | `spec.md` | ¿Qué debe hacer y cómo se comprueba? (RF, `CA-xx.n` Dado/Cuando/Entonces) | `Estado: Aprobada`, sin `[ACLARAR]` |
| 3 | `planwriting` | `plan.md` | ¿Cómo se construye? Tareas XS/S/M con su prueba RED, dependencias y escenarios E2E | `Estado: Aprobado`, sin tareas L |
| 4 | `implementation` | `plan.md` + `e2e-informe.md` | Construir con TDD y probar de punta a punta | E2E en verde y aprobación del usuario |

**Workflows dinámicos** (`.claude/workflows/`). Las fases 1 a 3 necesitan
conversación, y un workflow no admite preguntas a mitad de la corrida; por eso se
quedan como skills. Dos pasos sí se ejecutan como workflow:
- `/sdd-revisar {"documento": "specs/NNN-…/spec.md|plan.md"}`: revisión adversarial
  en paralelo (cinco ángulos), verificación cruzada de cada hallazgo y una lista
  consolidada. Solo lee.
- `/sdd-implementar {"spec": "specs/NNN-…", "commit": false}`: por cada tarea, en
  serie, un agente escribe la prueba y confirma que falla (RED), otro escribe el código
  sin tocar la prueba (GREEN, máximo 2 intentos) y un revisor refactoriza y registra.
  Al final corre el **agente E2E limpio** (`.claude/agents/e2e-limpio.md`), que prueba
  los escenarios sin leer el código, y se verifica con huellas de archivos que no
  modificó código de producción.

Si los workflows no están disponibles, la skill `implementation` describe el mismo
ciclo en modo manual.

- La spec es la fuente de verdad. Si un requisito cambia, se edita primero `spec.md` y
  después el código.
- TDD obligatorio: ninguna línea de producción sin una prueba que haya fallado antes.
  Una tarea con verificación fallida no se marca como hecha.
- Cada falla del informe E2E se convierte en una tarea nueva con su prueba RED.
- Los arreglos pequeños (una errata, un color, una fila de datos) no requieren el flujo
  completo; basta con anotarlos en `BITACORA.md`.

## Estructura

```
specs/            Una carpeta por funcionalidad: brainstorm.md, spec.md, plan.md, e2e-informe.md
.claude/agents/   e2e-limpio.md (probador independiente)
.claude/workflows/ sdd-implementar.js, sdd-revisar.js
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

App web (cuando exista `web/`, se define en la spec 001): `npm test` (Vitest, unitarias
y de componentes), `npx playwright test` (E2E) y `npm run dev` (servidor local).
Entorno local (2026-10-19): Node.js 24.20.0 LTS, npm 11.19.0, GitHub CLI 2.102.0,
Git, Python 3.12.10 con las dependencias de `Vehiculos/requirements.txt` y Chromium de
Playwright. Supabase y Vercel se usan con `npx supabase …` y `npx vercel …`, sin
instalación global. **No hay Docker** y el equipo tiene 3,4 GB de RAM, así que Supabase
local no es viable: las pruebas usan el segundo proyecto gratuito de Supabase ("pruebas").
**Memoria:** no correr `npm run build` con `npm run dev` encendido (se agota la RAM).
Los navegadores de Playwright para la app web se instalan con
`npx playwright install chromium` cuando exista `web/`.

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
- Toda cifra publicada tiene fuente (columna `Fuente` o `enlace`) en los datos y en la
  descarga CSV. La tarjeta del mapa no muestra los enlaces de fuente (decisión del 2026-10-21).
- Columnas: agregar o renombrar una columna exige actualizar a la vez
  `datos/esquemas.json`, el CSV y la página que lo lee (las páginas leen por posición).
- Visual: usar los tokens semánticos de `sitio/assets/ds/` (`--brand`, `--surface-header`,
  etc.; design system TEJ, Raleway), no colores escritos a mano.
  El mapa usa OpenStreetMap. No usar los datos de ejemplo del design system como reales.
- Reutilizar lo existente antes de crear algo nuevo. No agregar librerías fuera del
  stack aprobado en "Arquitectura" sin aprobación del usuario. Python solo con la
  biblioteca estándar en `scripts/`.
- Las llaves de servicio (Supabase service role, API de agentes) nunca llegan al
  navegador ni al repositorio: van en variables de entorno o secretos.
- Las mismas reglas de datos (enums, rangos, obligatorios) se aplican en el formulario,
  en `/admin`, en la base de datos y en la importación.
- Antes de publicar, el validador y las pruebas deben pasar y el usuario debe confirmar.
- No subir credenciales ni datos personales del formulario.
- Al cerrar cada sesión: skill `cierre-sesion`.

## Pruebas y despliegue

- **Pruebas**: `validar_datos.py` revisa columnas y su orden, obligatorios, enums,
  rangos (coordenadas dentro de Colombia, % entre 0 y 100), fechas, enlaces, claves
  duplicadas y referencias cruzadas. Además: revisar cada página en el navegador
  (consola sin errores, ancho de móvil).
- **Despliegue**: Vercel Hobby conectado al repositorio personal de GitHub (por crear).
  `sitio/` (HTML plano) queda como prototipo; la app Next.js lo reemplaza.

## Cronograma (MVP al 2026-10-27)

| Fecha | Entregable | Estado |
|---|---|---|
| 10-19 | Arnés: CLAUDE.md, datos, validador, hook, skills, esqueleto del sitio | Hecho |
| 10-20 | Plataforma base 001: T01–T09 (app, tema, formato, esquemas, base de datos, importación, inicio, aportes) | Hecho |
| 10-21 | Plataforma base 001: T10–T17 + E2E limpio | Hecho (E2E limpio 19/19 el 10-21; 001 terminada) |
| 10-22 | 002 · Implementación en el país (mapa, filtros, KPI) | Brainstorm y spec aprobados el 10-21; plan en borrador |
| 10-23 | 003 · Vehículos eléctricos | |
| 10-24 | 004 · Evolución normativa | |
| 10-25 | 005 · Noticias | |
| 10-26 | Revisión completa, móvil, E2E de todo el sitio | |
| 10-27 | Publicación (con confirmación del usuario) | |

## Decisiones abiertas

Preguntas 5–20 de la sesión del 2026-10-19 (clasificación por resolución, servicios,
fuentes de noticias, formulario, bilingüe, mantenimiento) y la pizarra 3. Al
responderlas, pasar cada decisión a la sección correspondiente.
