# 001 · Arquitectura y plataforma base — Plan

Estado: En curso
Fecha: 2026-10-19
Spec: [spec.md](spec.md)

## Enfoque técnico

App **Next.js (App Router, TypeScript)** en `web/`, con Tailwind CSS y shadcn/ui
tematizados con los tokens TEJ (`sitio/assets/ds/tokens`), Tremor para tarjetas KPI y
Motion para animaciones. Se usa la versión estable vigente de cada paquete al crear el
proyecto, y las versiones quedan fijadas en `package-lock.json`.

**Datos:** Supabase (Postgres + Auth + RLS). Las tablas publicables (`proyectos`,
`normas`, `noticias`, `vehiculos`) tienen una columna `publicacion`
(`Pendiente | Aprobado | Rechazado`). Las políticas RLS dan al rol anónimo solo
`SELECT … WHERE publicacion = 'Aprobado'` y solo `INSERT` en `aportes`; `aportantes`,
`historial` y `editores` no tienen acceso público. Los editores se identifican con una
función `es_editor()` que consulta la tabla `editores`. La aprobación corre en una
*server action* con la llave de servicio (solo en el servidor): aplica el cambio,
escribe `historial` y llama a `revalidatePath`. Además, las páginas públicas usan
`revalidate = 300` como red de seguridad para cumplir el máximo de 5 minutos.

**Una sola fuente de reglas (RF-16):** `datos/esquemas.json` sigue siendo la
definición. La web construye los esquemas zod a partir de ese JSON (formulario y
aprobación), la importación usa `scripts/validar_datos.py` y una prueba de consistencia
comprueba que las restricciones CHECK de la migración SQL coincidan con el JSON.

**Aportes:** formulario con react-hook-form + zod + Cloudflare Turnstile. La server
action verifica Turnstile, aplica el límite de 5 por hora por hash de IP (sin guardar
la IP) y guarda el aporte y el correo en tablas separadas.

**Agentes, importación y respaldo:** scripts en Python con biblioteca estándar
(`urllib` contra la API REST de Supabase), reutilizando el validador. El respaldo
diario corre en GitHub Actions y lee solo datos aprobados con la llave anónima, lo que
además mantiene activa la base (RNF-08).

**Pruebas:** Vitest + Testing Library (unitarias y de componentes), Vitest de
integración contra el proyecto Supabase **pruebas** (base de datos y RLS), `unittest`
para Python y Playwright + axe para E2E. Turnstile usa sus llaves de prueba oficiales en
los entornos de prueba.

## Prerrequisitos del usuario (antes de T05)
Crear cuentas e ingresar credenciales le corresponde al usuario; Claude no lo hace.

| ID | Acción | Necesario para |
|---|---|---|
| P1 | Crear la cuenta de Supabase y dos proyectos: `observatorio` (producción) y `observatorio-pruebas` | T05 en adelante |
| P2 | Copiar URL, llave anónima y llave de servicio de **pruebas** a `web/.env.local` (plantilla en `web/.env.example`, que crea T01) | T05 |
| P3 | Corregir las coordenadas en la `Base de datos SAEB` y exportar de nuevo `datos/proyectos.csv` | Importación real (T06 se prueba con datos de prueba) |
| P4 | Crear el repositorio en la **cuenta personal** de GitHub (`gh repo create`, guiado) y cuenta de Vercel Hobby | T15, T17 |
| P5 | Crear un sitio de Cloudflare Turnstile (gratis) para producción | T17 (en pruebas se usan las llaves de prueba) |

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `web/` (Next.js, `package.json`, configuraciones de Vitest y Playwright, `.env.example`) | Crear | App |
| `web/src/app/` (`layout.tsx`, `page.tsx`, `aportar/`, `admin/`, `datos/[seccion]/route.ts`, secciones vacías) | Crear | Páginas y rutas |
| `web/src/lib/` (`formato.ts`, `esquemas.ts`, `supabase/`, `kpi.ts`, `limite.ts`, `csv.ts`) | Crear | Lógica reutilizable |
| `web/src/components/` (`ui/` de shadcn, `kpi-tarjeta.tsx`, `formulario-aporte.tsx`, `aportes/`) | Crear | Componentes |
| `web/src/styles/tema.css` | Crear | Tokens TEJ → variables de Tailwind y shadcn |
| `supabase/migrations/0001_base.sql` | Crear | Tablas, CHECK, RLS, `es_editor()`, disparador de historial |
| `scripts/importar.py`, `scripts/proponer_aporte.py`, `scripts/respaldo.py`, `scripts/supabase_rest.py` | Crear | Importación, canal de agentes, respaldo |
| `pruebas/test_importar.py`, `test_proponer_aporte.py`, `test_respaldo.py`, `test_sql_esquemas.py` | Crear | Pruebas Python |
| `.github/workflows/respaldo.yml` | Crear | Respaldo diario |
| `.claude/skills/buscar-noticias/SKILL.md`, `ficha-normativa/SKILL.md` | Modificar | Que escriban en `aportes` con origen `agente` |
| `datos/esquemas.json` | Modificar | Agregar el esquema de `aportes` |
| `.gitignore` | Modificar | `web/.env.local`, `web/node_modules`, `web/.next`, reportes de Playwright |

## Cambios de datos
- `datos/esquemas.json`: nuevo esquema `aportes` (tipo, registro_afectado, datos propuestos en JSON, fuente, origen, agente, publicacion, motivo).
- `supabase/migrations/0001_base.sql`: tablas de la sección "Datos" de la spec, CHECK generados a partir de los enums y rangos del JSON, RLS y disparador de `historial`.
- `pruebas/test_sql_esquemas.py`: cada enum y rango del JSON aparece en la migración.

## Tareas

- [x] **T01 · M** · Crear la app Next.js en `web/` con TypeScript, Tailwind, Vitest, Testing Library y Playwright
  - Cubre: base de todos los RF · RNF-09
  - Prueba primero (RED): `web/src/app/page.test.tsx` renderiza el inicio y espera el título "Observatorio de Almacenamiento de Energía" (falla: no existe la app)
  - Hecho cuando (GREEN): `npm test` pasa; `npm run build` compila; `.env.example` documenta las variables sin valores
  - Depende de: —
  - Archivos: `web/` (generado), `web/src/app/page.tsx`, `.gitignore`
- [x] **T02 · S** · Tema TEJ: tokens → variables de Tailwind y shadcn; inicializar shadcn/ui
  - Cubre: RNF-05
  - Prueba primero (RED): `web/src/styles/tema.test.ts` lee `tema.css` y espera que `--primary` y `--background` se definan con `var(--brand)` y `var(--surface-page)`, y que no haya colores hexadecimales fuera de los tokens (falla: no existe)
  - Hecho cuando (GREEN): la prueba pasa y un `Button` de shadcn se ve con el color de marca
  - Depende de: T01
  - Archivos: `web/src/styles/tema.css`, `web/src/app/layout.tsx`, `web/components.json`
- [x] **T03 · XS** · Formato es-CO: número, MW, MWh y fecha `dd/mm/aaaa`
  - Cubre: RNF-04
  - Prueba primero (RED): `web/src/lib/formato.test.ts` espera `formatoMW(67) === "67,0 MW"`, `formatoMWh(57.8) === "57,8 MWh"` y `formatoFecha("2026-10-19") === "19/10/2026"`
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T01
  - Archivos: `web/src/lib/formato.ts`
- [ ] **T04 · S** · Esquemas zod construidos desde `datos/esquemas.json`, más el esquema de `aportes`
  - Cubre: RF-03, RF-16 · CA-03.1, CA-03.2, CA-16.1
  - Prueba primero (RED): `web/src/lib/esquemas.test.ts` rechaza `Estado = "Planeado"`, latitud `49.653`, aporte sin fuente y aporte sin correo, con el mismo mensaje que usa el validador Python
  - Hecho cuando (GREEN): pruebas en verde; `python -m unittest discover pruebas` sigue en verde con el esquema de `aportes` agregado
  - Depende de: T01
  - Archivos: `web/src/lib/esquemas.ts`, `datos/esquemas.json`
- [ ] **T05 · M** · Migración Supabase: tablas, CHECK, RLS, `es_editor()` y disparador de historial
  - Cubre: RF-01, RF-04, RF-11, RF-16 · RNF-07, RNF-10 · CA-01.1, CA-04.1, CA-11.1, CA-16.1
  - Prueba primero (RED): `pruebas/test_sql_esquemas.py` (consistencia JSON ↔ SQL) y `web/tests/integracion/rls.test.ts` contra **pruebas**: el anónimo no ve un proyecto `Pendiente`, sí inserta en `aportes`, no lee `aportes`, `aportantes` ni `historial`, y un `Estado` inválido se rechaza en la base
  - Hecho cuando (GREEN): migración aplicada en **pruebas** (`npx supabase db push`) y pruebas en verde
  - Depende de: T04, P1, P2
  - Archivos: `supabase/migrations/0001_base.sql`, `pruebas/test_sql_esquemas.py`, `web/tests/integracion/rls.test.ts`
- [ ] **T06 · S** · Importación inicial con rechazo de registros inválidos
  - Cubre: RF-15, RF-16 · CA-15.1, CA-16.1
  - Prueba primero (RED): `pruebas/test_importar.py` con un servidor REST simulado: el CSV actual rechaza los 7 proyectos por coordenadas y no envía nada; un CSV válido envía los registros con `publicacion = Aprobado` y fuente
  - Hecho cuando (GREEN): pruebas en verde; `python scripts/importar.py --entorno pruebas` reporta los rechazos
  - Depende de: T05
  - Archivos: `scripts/importar.py`, `scripts/supabase_rest.py`, `pruebas/test_importar.py`
- [ ] **T07 · S** · Inicio con KPI y acceso a las cuatro secciones
  - Cubre: RF-01, RF-02 · RNF-01, RNF-09 · CA-01.1, CA-02.1
  - Prueba primero (RED): `web/src/lib/kpi.test.ts`: con proyectos en varios estados, MW y MWh "en operación" suman solo `En operación` y se calculan por separado; `page.test.tsx`: dos tarjetas distintas con coma decimal y cuatro enlaces de sección
  - Hecho cuando (GREEN): pruebas en verde; las páginas de sección existen con título y "En construcción"
  - Depende de: T02, T03, T05
  - Archivos: `web/src/lib/kpi.ts`, `web/src/app/page.tsx`, `web/src/components/kpi-tarjeta.tsx`, `web/src/app/{mapa,vehiculos,normativa,noticias}/page.tsx`
- [ ] **T08 · S** · Animación de los KPI con Motion respetando el movimiento reducido
  - Cubre: RF-17 · CA-17.1
  - Prueba primero (RED): `kpi-tarjeta.test.tsx` simula `prefers-reduced-motion: reduce` y espera ver el valor final de inmediato, sin el atributo de animación; sin la preferencia, espera que la animación esté presente
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T07
  - Archivos: `web/src/components/kpi-tarjeta.tsx`, `web/src/components/transicion.tsx`
- [ ] **T09 · M** · Formulario `/aportar` con Turnstile, límite de envíos y número de seguimiento
  - Cubre: RF-03, RF-04, RF-05, RF-06 · RNF-10 · CA-03.1, CA-03.2, CA-04.1, CA-05.1, CA-05.2, CA-06.1
  - Prueba primero (RED): `web/src/app/aportar/acciones.test.ts`: sin fuente o sin correo se rechaza; un Turnstile inválido (llave de prueba "siempre falla") se rechaza sin guardar; el 6.º envío en una hora del mismo origen se rechaza; un envío válido devuelve un número de seguimiento y guarda el correo solo en `aportantes`
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T04, T05
  - Archivos: `web/src/app/aportar/page.tsx`, `web/src/app/aportar/acciones.ts`, `web/src/components/formulario-aporte.tsx`, `web/src/lib/limite.ts`
- [ ] **T10 · S** · Acceso de editores a `/admin` con enlace mágico
  - Cubre: RF-07 · RNF-07 · CA-07.1
  - Prueba primero (RED): `web/src/lib/acceso.test.ts`: un correo fuera de `editores` no genera enlace; sin sesión de editor, `/admin` redirige a `/admin/entrar`
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T05
  - Archivos: `web/src/middleware.ts`, `web/src/lib/acceso.ts`, `web/src/app/admin/entrar/page.tsx`
- [ ] **T11 · M** · Lista y detalle de aportes pendientes, con origen y comparación
  - Cubre: RF-08, RF-12 · CA-08.1, CA-12.1
  - Prueba primero (RED): `web/src/components/aportes/*.test.tsx` con datos de ejemplo: la lista muestra tipo, origen (`usuario` o `agente` + nombre), fecha y fuente; el detalle de una corrección muestra el valor actual y el propuesto lado a lado
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T10
  - Archivos: `web/src/app/admin/page.tsx`, `web/src/app/admin/[id]/page.tsx`, `web/src/components/aportes/lista.tsx`, `web/src/components/aportes/comparacion.tsx`
- [ ] **T12 · M** · Aprobar (con ajustes) o rechazar con motivo, historial y revalidación
  - Cubre: RF-09, RF-10, RF-11, RF-16 · CA-09.1, CA-09.2, CA-10.1, CA-11.1
  - Prueba primero (RED): `web/src/app/admin/acciones.test.ts` contra **pruebas**: rechazar sin motivo falla; aprobar con ajuste publica la versión ajustada y el historial guarda propuesta y versión final; aprobar llama a `revalidatePath` en las rutas afectadas; un ajuste inválido se rechaza con el esquema zod
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T11
  - Archivos: `web/src/app/admin/acciones.ts`, `web/src/components/aportes/decision.tsx`
- [ ] **T13 · S** · Descarga CSV por sección con fuente y licencia
  - Cubre: RF-14 · RNF-10 · CA-14.1
  - Prueba primero (RED): `web/src/lib/csv.test.ts`: solo registros aprobados, columna de fuente, línea de licencia CC BY 4.0, sin correos
  - Hecho cuando (GREEN): pruebas en verde; `/datos/proyectos.csv` responde con `text/csv`
  - Depende de: T05
  - Archivos: `web/src/lib/csv.ts`, `web/src/app/datos/[seccion]/route.ts`
- [ ] **T14 · S** · Canal de agentes: `proponer_aporte.py` y skills conectadas
  - Cubre: RF-12 · CA-12.1
  - Prueba primero (RED): `pruebas/test_proponer_aporte.py` con REST simulado: envía con `origen = agente`, el nombre del agente y la fuente obligatoria; sin fuente se niega
  - Hecho cuando (GREEN): pruebas en verde; `buscar-noticias` y `ficha-normativa` usan el script en lugar de editar los CSV
  - Depende de: T05
  - Archivos: `scripts/proponer_aporte.py`, `pruebas/test_proponer_aporte.py`, dos `SKILL.md`
- [ ] **T15 · S** · Respaldo diario a CSV en GitHub Actions
  - Cubre: RF-13 · RNF-08 · CA-13.1
  - Prueba primero (RED): `pruebas/test_respaldo.py` con REST simulado: escribe un CSV por tabla publicada, sin correos, y devuelve error distinto de cero si la API falla
  - Hecho cuando (GREEN): pruebas en verde; `.github/workflows/respaldo.yml` diario (se activa al subir el repositorio en P4)
  - Depende de: T05
  - Archivos: `scripts/respaldo.py`, `pruebas/test_respaldo.py`, `.github/workflows/respaldo.yml`
- [ ] **T16 · S** · Metadatos por página, accesibilidad base y móvil
  - Cubre: RNF-01, RNF-03, RNF-09
  - Prueba primero (RED): `web/src/app/metadatos.test.ts` exige `title` y `description` propios en `/`, `/aportar` y las cuatro secciones; prueba de componente con `jest-axe` sin violaciones en el inicio y en `/aportar`
  - Hecho cuando (GREEN): pruebas en verde
  - Depende de: T07, T09
  - Archivos: `metadata` de cada `page.tsx`, `web/src/app/layout.tsx`
- [ ] **T17 · XS** · Despliegue de vista previa en Vercel (requiere confirmación del usuario)
  - Cubre: RNF-06, RNF-07, RNF-11
  - Prueba primero (RED): `web/tests/secretos.test.ts` compila y busca en `.next/static` el nombre y el valor de la llave de servicio (falla si aparecen; hoy falla porque no existe el build de verificación)
  - Hecho cuando (GREEN): prueba en verde y despliegue de **vista previa** en `*.vercel.app` con variables del proyecto **pruebas**, solo con aprobación explícita
  - Depende de: T16, P4, P5
  - Archivos: `web/tests/secretos.test.ts`, `web/vercel.json` (si hace falta)

Estimación total: 17 tareas (2 XS, 10 S, 5 M) ≈ 15,5 h. Además, P1–P5 dependen del usuario.

## Escenarios E2E
Se ejecutan con Playwright contra `npm run dev` conectado al proyecto **pruebas**, con
datos sembrados por el propio escenario y llaves de prueba de Turnstile.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1 | 1. Sembrar un proyecto `Pendiente` y uno `Aprobado` 2. Abrir `/` y `/datos/proyectos.csv` | Solo aparece el aprobado |
| E2E-02 | CA-02.1 | 1. Sembrar proyectos en varios estados 2. Abrir `/` | Tarjetas separadas de MW y MWh "en operación" que suman solo `En operación`, con coma decimal |
| E2E-03 | CA-03.1 | 1. Abrir `/aportar` 2. Llenar todo menos la fuente 3. Enviar | Mensaje que señala la fuente; no hay aporte nuevo |
| E2E-04 | CA-03.2 | 1. Abrir `/aportar` 2. Llenar todo menos el correo 3. Enviar | Mensaje que señala el correo |
| E2E-05 | CA-04.1, CA-06.1 | 1. Enviar un aporte válido 2. Abrir `/` 3. Entrar como editor a `/admin` | Número de seguimiento; nada cambia en `/`; el aporte figura como pendiente |
| E2E-06 | CA-05.1 | 1. Usar la llave de prueba "siempre falla" 2. Enviar | Envío rechazado; no hay aporte nuevo |
| E2E-07 | CA-05.2 | 1. Enviar 5 aportes válidos 2. Enviar el 6.º | El 6.º muestra un mensaje de espera |
| E2E-08 | CA-07.1 | 1. Abrir `/admin` sin sesión 2. Pedir acceso con un correo no autorizado | Redirige al acceso; no se envía enlace |
| E2E-09 | CA-08.1 | 1. Sembrar una corrección de potencia 2. Abrir su detalle como editor | Valor actual y propuesto lado a lado, con fuente |
| E2E-10 | CA-09.1 | 1. Abrir un aporte 2. Rechazar sin motivo | Exige el motivo |
| E2E-11 | CA-09.2, CA-10.1, CA-11.1 | 1. Ajustar y aprobar una corrección 2. Abrir la página pública 3. Ver el historial | Se publica la versión ajustada en menos de 5 minutos; el historial muestra fecha, editor, aporte y valores anterior y nuevo con fuente |
| E2E-12 | CA-12.1 | 1. Correr `proponer_aporte.py` contra **pruebas** con origen `agente` 2. Abrir `/admin` | Aparece con origen `agente` y el nombre del agente |
| E2E-13 | CA-13.1 | 1. Correr `python scripts/respaldo.py --entorno pruebas` | Se generan los CSV sin correos, o termina con error si la API falla |
| E2E-14 | CA-14.1 | 1. Descargar `/datos/proyectos.csv` | Solo aprobados, columna de fuente, licencia CC BY 4.0, sin correos |
| E2E-15 | CA-15.1 | 1. Importar el CSV actual 2. Importar un CSV corregido de prueba | Primero se rechazan los 7 con su motivo; después se aceptan |
| E2E-16 | CA-16.1 | 1. Intentar `Estado = Planeado` por el formulario, por la aprobación y por la importación | Rechazado con el mismo mensaje en las tres vías |
| E2E-17 | CA-17.1 | 1. Emular movimiento reducido 2. Abrir `/` | KPI sin animación de conteo |
| E2E-18 | RNF-01, RNF-03 | 1. Viewport de 375 px 2. Recorrer `/`, `/aportar` y las secciones 3. Correr axe | Sin desplazamiento horizontal ni violaciones graves de axe; consola sin errores |
| E2E-19 | RNF-02 | 1. Medir LCP de `/` con el build de producción y throttling 4G | LCP < 2,5 s |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1 | T05, T07 | E2E-01 |
| RF-02 | CA-02.1 | T07 | E2E-02 |
| RF-03 | CA-03.1, CA-03.2 | T04, T09 | E2E-03, E2E-04 |
| RF-04 | CA-04.1 | T05, T09 | E2E-05 |
| RF-05 | CA-05.1, CA-05.2 | T09 | E2E-06, E2E-07 |
| RF-06 | CA-06.1 | T09 | E2E-05 |
| RF-07 | CA-07.1 | T10 | E2E-08 |
| RF-08 | CA-08.1 | T11 | E2E-09 |
| RF-09 | CA-09.1, CA-09.2 | T12 | E2E-10, E2E-11 |
| RF-10 | CA-10.1 | T12 | E2E-11 |
| RF-11 | CA-11.1 | T05, T12 | E2E-11 |
| RF-12 | CA-12.1 | T11, T14 | E2E-12 |
| RF-13 | CA-13.1 | T15 | E2E-13 |
| RF-14 | CA-14.1 | T13 | E2E-14 |
| RF-15 | CA-15.1 | T06 | E2E-15 |
| RF-16 | CA-16.1 | T04, T05, T06, T12 | E2E-16 |
| RF-17 | CA-17.1 | T08 | E2E-17 |
| RNF-01 | — | T07, T16 | E2E-18 |
| RNF-02 | — | T07 | E2E-19 |
| RNF-03 | — | T16 | E2E-18 |
| RNF-04 | — | T03 | E2E-02 |
| RNF-05 | — | T02 | revisión visual en E2E-18 |
| RNF-06 | — | T17 | revisión de planes (sin costo) |
| RNF-07 | — | T05, T10, T17 | prueba `secretos.test.ts` |
| RNF-08 | — | T15 | E2E-13 |
| RNF-09 | — | T01, T07, T16 | E2E-18 |
| RNF-10 | — | T05, T09, T13 | E2E-14 |
| RNF-11 | — | T17 | despliegue de vista previa |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Sin P1/P2 no se puede probar la base (T05 a T15) | T01–T04 no dependen de Supabase; pedir P1 y P2 apenas se apruebe el plan |
| 3,4 GB de RAM: `next dev`, Vitest y Playwright juntos pueden quedarse sin memoria | Correr las suites por separado; Playwright solo con Chromium; los workflows usan un solo agente a la vez en la fase TDD |
| Pruebas de integración contra la nube: lentas o intermitentes | Datos de prueba con prefijo único y limpieza por prueba; reintento único en E2E |
| Enlace mágico difícil de automatizar en E2E | En **pruebas**, la sesión de editor se crea con la API de administración (`generateLink`) desde el *setup* de Playwright |
| El cronograma de `CLAUDE.md` asumía otro stack | Con este plan, la plataforma base ocupa del 20 al 21 de octubre; las secciones (002–005) del 22 al 25; revisión el 26; entrega el 27. Se actualiza el cronograma al aprobar |
| Revalidación en 5 minutos | `revalidatePath` inmediato al aprobar + `revalidate = 300` como respaldo |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-19 | T01 | Sí: no existía el h1 del observatorio (página por defecto) | 1/1 pruebas; build OK | @types/node 20→24 por conflicto con Vitest 5; lang es-CO y metadatos; .env.example; 5 vulnerabilidades altas solo en dependencias de desarrollo (eslint), 0 en producción |
| 2026-10-19 | T02 | Sí: no existían el botón de shadcn ni el tema | 6/6 pruebas; build OK | shadcn/ui (estilo base-nova, Base UI, paquete cn); tokens copiados en web/src/styles/tokens con --ring→--focus-ring; Raleway con next/font; sin modo oscuro (el DS no lo define). Revisión visual pendiente |
| 2026-10-19 | T03 | Sí: no existía formato.ts | 5/5 pruebas | Intl es-CO con useGrouping always para que 1.500 lleve punto de miles; valores vacíos se muestran como — |

## Informe E2E
Pendiente (`e2e-informe.md`).
