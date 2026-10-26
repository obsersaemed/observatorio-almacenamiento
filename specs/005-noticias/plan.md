# 005 · Noticias — Plan

Estado: Terminado
Fecha: 2026-10-26
Spec: [spec.md](spec.md)

## Enfoque técnico
`/noticias` lee de Supabase las noticias aprobadas, con la caché por etiqueta de las otras
secciones. La etiqueta es `noticias`, que `/admin` ya revalida al aprobar un aporte de tipo
*Noticia*. La lógica pura va en `web/src/lib/noticias.ts`: el orden y el enlace principal. La
lista es un componente de servidor sin JavaScript de cliente, porque no tiene filtros ni
estado.

**Qué se reutiliza:**
- `formatoFecha` y el patrón de lectura de `datos-publicos.ts` (como `normasPublicas`).
- La cola de aportes, `/admin` y `scripts/proponer_aporte.py --carpeta` (de la 004).
- El patrón de validación de propuestas de `pruebas/test_propuestas_normativa.py`.

No hay librerías nuevas ni cambios de esquema: la tabla `noticias` ya tiene las columnas.

**Carga inicial:** se busca desde el 1 de enero de 2025 con la skill `buscar-noticias`. Cada
noticia queda como propuesta JSON en `specs/005-noticias/propuestas/`. Una prueba de Python
las valida y después se envían a la base de pruebas como aportes `Pendiente`.

**Datos de los E2E:** el E2E siembra noticias ficticias y las borra al final, como en la 004.

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `web/src/lib/noticias.ts` (+ test) | Crear | Tipo, orden (fecha y título) y enlace principal |
| `web/src/lib/datos-publicos.ts` (+ test) | Modificar | `noticiasPublicas()` con la etiqueta `noticias` |
| `web/src/components/noticias/lista-noticias.tsx` (+ test) | Crear | Tarjetas, texto y enlace a la nota, aviso de lista vacía |
| `web/src/app/noticias/page.tsx` | Modificar | Reemplaza «Sección en construcción», sin descarga |
| `web/src/app/secciones.test.tsx` | Modificar | `/noticias` ya no es un aviso de construcción ni enlaza el CSV |
| `web/src/components/a11y.test.tsx` | Modificar | axe sobre la lista |
| `pruebas/test_propuestas_noticias.py` | Crear | Valida las propuestas antes de enviarlas |
| `specs/005-noticias/propuestas/*.json` | Crear | Carga inicial |
| `.claude/skills/buscar-noticias/SKILL.md` | Modificar | Propone por la cola de aportes (RF-07) |
| `pruebas/test_skill_buscar_noticias.py` | Crear | Comprueba el procedimiento de la skill |
| `web/e2e/005-noticias.spec.ts` | Crear | Escenarios E2E (lo escribe el agente E2E limpio) |

## Cambios de datos
- Esquema: sin cambios.
- Validación: las mismas reglas de `esquemas.json`. La prueba de las propuestas además exige
  resumen, fecha entre el 2025-01-01 y hoy, y enlaces sin repetir.
- Importación: `proponer_aporte.py --carpeta` (tipo *Noticia*, agente `buscar-noticias`).

## Tareas
- [x] **T01 · S** · Orden y enlace de las noticias
  - Cubre: RF-01 · CA-01.1, CA-01.2
  - Prueba primero (RED): `web/src/lib/noticias.test.ts`:
    - ordena de la más reciente a la más antigua y, con la misma fecha, por título;
    - el enlace principal es la primera URL de `enlace`.

    Falla porque el módulo no existe.
  - Hecho cuando (GREEN): pasan.
  - Depende de: —
  - Archivos: `web/src/lib/noticias.ts`
- [x] **T02 · S** · Lectura pública de noticias
  - Cubre: RF-05, RF-08 · CA-05.1, CA-08.1
  - Prueba primero (RED): `datos-publicos.test.ts`: `leerNoticias` pide solo `publicacion =
    Aprobado` con las columnas públicas, y `ETIQUETA_NOTICIAS` es la etiqueta que revalida
    `/admin` para un aporte *Noticia*. Falla porque no existen.
  - Hecho cuando (GREEN): pasan.
  - Depende de: T01
  - Archivos: `web/src/lib/datos-publicos.ts`
- [x] **T03 · M** · Lista de noticias
  - Cubre: RF-02, RF-03, RF-04, RF-09, RNF-02 · CA-02.1, CA-03.1, CA-03.2, CA-04.1, CA-09.1
  - Prueba primero (RED): `lista-noticias.test.tsx` comprueba:
    - cada tarjeta muestra fecha dd/mm/aaaa, medio, título y resumen;
    - la tarjeta termina con «Si quieres saber más sobre esta noticia, haz clic en el
      enlace»;
    - el enlace lleva a la nota original con `target=_blank` y `rel=noopener`, y su nombre
      incluye el título;
    - sin noticias se lee «Todavía no hay noticias publicadas»;
    - no hay descargas;
    - el orden es el de T01.
  - Hecho cuando (GREEN): pasan.
  - Depende de: T01
  - Archivos: `web/src/components/noticias/lista-noticias.tsx`
- [x] **T04 · S** · Página `/noticias`
  - Cubre: RF-10, RF-09, RNF-05, RNF-06 · CA-10.1, CA-09.1
  - Prueba primero (RED): `secciones.test.tsx`: `/noticias` muestra la lista (con Suspense)
    y no «Sección en construcción» ni el enlace «Descargar datos». Hoy falla.
  - Hecho cuando (GREEN): pasa, y el build sale bien.
  - Depende de: T02, T03
  - Archivos: `web/src/app/noticias/page.tsx`, `secciones.test.tsx`
- [x] **T05 · XS** · Accesibilidad
  - Cubre: RNF-04
  - Prueba primero (RED): `a11y.test.tsx` corre axe sobre la lista con varias noticias.
  - Hecho cuando (GREEN): sin violaciones.
  - Depende de: T03
  - Archivos: `web/src/components/a11y.test.tsx`
- [x] **T06 · XS** · La skill propone por la cola de aportes
  - Cubre: RF-07 · CA-07.1
  - Prueba primero (RED): `pruebas/test_skill_buscar_noticias.py`: el procedimiento usa
    `proponer_aporte.py` y no indica editar `datos/noticias.csv` ni la columna `revision`.
    Falla porque la skill dice que escribe en el CSV.
  - Hecho cuando (GREEN): pasa.
  - Depende de: —
  - Archivos: `.claude/skills/buscar-noticias/SKILL.md`
- [x] **T07 · S** · Validador de propuestas de noticias
  - Cubre: RF-06, RNF-08
  - Prueba primero (RED): `pruebas/test_propuestas_noticias.py` comprueba, para cada JSON de
    `specs/005-noticias/propuestas/`:
    - tipo *Noticia* y agente `buscar-noticias`;
    - datos válidos según el esquema;
    - resumen presente;
    - fecha entre el 2025-01-01 y hoy;
    - enlaces sin repetir;
    - al menos una propuesta.

    Falla porque no hay propuestas.
  - Hecho cuando (GREEN): pasa con la carga de T08.
  - Depende de: T06
  - Archivos: `pruebas/test_propuestas_noticias.py`
- [x] **T08 · M** · Búsqueda y redacción de la carga inicial
  - Cubre: RF-06, RNF-08 · aclaración 2
  - Prueba primero (RED): la de T07.
  - Hecho cuando (GREEN): cada noticia se verificó en la nota original (fecha, medio,
    título y enlace). El resumen es propio y la prueba de T07 pasa.
  - Depende de: T07
  - Archivos: `specs/005-noticias/propuestas/*.json`
- [x] **T09 · XS** · Enviar la carga a la cola de aportes
  - Cubre: RF-06 · CA-06.1
  - Prueba primero (RED): una consulta a **pruebas** no encuentra aportes *Noticia* de
    `buscar-noticias`.
  - Hecho cuando (GREEN): todos los aportes están `Pendiente` en `/admin` y ninguno aparece
    en `/noticias`.
  - Depende de: T08
  - Archivos: — (usa `scripts/proponer_aporte.py --carpeta`)
- [x] **T10 · M** · E2E limpio de la 005
  - Cubre: todos los CA
  - Prueba primero (RED): el agente E2E limpio escribe `web/e2e/005-noticias.spec.ts` con
    los escenarios de abajo, sobre noticias ficticias sembradas.
  - Hecho cuando (GREEN): pasa en escritorio y a 375 px, y la limpieza deja la base como
    estaba.
  - Depende de: T04, T05, T09
  - Archivos: `web/e2e/005-noticias.spec.ts`

- [x] **T11 · XS** · Aprobar noticias en `/admin` (falla de E2E-08)
  - Cubre: RF-08 · CA-08.1
  - Prueba primero (RED): `decision.test.ts`: aprobar un aporte *Noticia* nuevo devolvía «'publicacion' es obligatorio».
  - Hecho cuando (GREEN): la noticia se aprueba, se aplica y se revalida la etiqueta `noticias`.
  - Depende de: T02
  - Archivos: `web/src/lib/decision.ts`

Estimación total: 10 tareas (3 XS, 4 S, 3 M), sin tareas L · de 6 a 8 h. La búsqueda de
noticias (T08) es la parte más larga.

## Escenarios E2E
Datos sembrados, ficticios:
- 4 noticias aprobadas de 2025 y 2026, dos de ellas con la misma fecha;
- 1 noticia pendiente.

| ID | Criterio | Pasos | Resultado esperado |
|---|---|---|---|
| E2E-01 | CA-01.1, CA-01.2 | 1. Abrir `/noticias` | De la más reciente a la más antigua; con la misma fecha, por título |
| E2E-02 | CA-02.1 | 1. Mirar una tarjeta | Fecha dd/mm/aaaa, medio, título y resumen |
| E2E-03 | CA-03.1 | 1. Usar el enlace de una noticia | Se lee el texto «Si quieres saber más…» y la nota abre en una pestaña nueva con su URL |
| E2E-04 | CA-03.2 | 1. Listar los nombres accesibles de los enlaces | Cada uno incluye el título de su noticia; no hay dos iguales |
| E2E-05 | CA-04.1 | 1. Sin noticias aprobadas, abrir la página (antes de sembrar o con la limpieza) | «Todavía no hay noticias publicadas» |
| E2E-06 | CA-05.1 | 1. Abrir la página | La noticia pendiente no aparece |
| E2E-07 | CA-06.1 | 1. Entrar a `/admin` como editor (o consultar la cola) | Aportes *Noticia* pendientes de `buscar-noticias`, con enlace; no están en `/noticias` |
| E2E-08 | CA-08.1 | 1. Aprobar una noticia sembrada 2. Recargar `/noticias` en ≤ 5 min | Aparece |
| E2E-09 | CA-09.1 | 1. Buscar descargas | No hay botón ni enlace de descarga |
| E2E-10 | CA-10.1 | 1. En el inicio, usar la tarjeta «Noticias» y el menú | Se llega a la lista |
| E2E-11 | RNF-01, RNF-03, RNF-06 | 1. A 375 px con movimiento reducido, abrir la página | Sin desborde, sin animaciones, consola limpia |
| E2E-12 | RNF-04 | 1. axe 2. Recorrer con Tab | Sin violaciones; foco visible |
| E2E-13 | RNF-05 | 1. Medir el LCP de la página publicada (3 veces) | Mediana ≤ 2,5 s |

## Trazabilidad
| Requisito | Criterios | Tareas | Escenarios E2E |
|---|---|---|---|
| RF-01 | CA-01.1, CA-01.2 | T01, T03 | E2E-01 |
| RF-02 | CA-02.1 | T03 | E2E-02 |
| RF-03 | CA-03.1, CA-03.2 | T03 | E2E-03, E2E-04 |
| RF-04 | CA-04.1 | T03 | E2E-05 |
| RF-05 | CA-05.1 | T02 | E2E-06 |
| RF-06 | CA-06.1 | T07, T08, T09 | E2E-07 |
| RF-07 | CA-07.1 | T06 | Prueba de Python (no es observable en el sitio) |
| RF-08 | CA-08.1 | T02 | E2E-08 |
| RF-09 | CA-09.1 | T03, T04 | E2E-09 |
| RF-10 | CA-10.1 | T04 | E2E-10 |
| RNF-01, 03, 06 | — | T03, T04 | E2E-11 |
| RNF-02 | — | T03 | E2E-02 |
| RNF-04, 07 | — | T05 | E2E-12 |
| RNF-05 | — | T04 | E2E-13 |
| RNF-08 | — | T07, T08 | Revisión del editor en `/admin` |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| La búsqueda encuentra pocas noticias verificables, o medios de pago sin fecha visible | Se publican solo las verificadas; una nota sin fecha o sin enlace estable se descarta (RNF-08) |
| El plazo del MVP (2026-10-27) | Sin filtros ni cambios de esquema; la interfaz es pequeña. La carga se puede ampliar después con la misma skill |
| Para aprobar en `/admin` hay que entrar con el enlace por correo, y el servicio de correo incluido tiene un límite por hora | Pedir un solo enlace y aprobar por lotes |
| Los E2E en paralelo chocan en la base de pruebas | Se corren en serie, con sus propias noticias ficticias y su limpieza |

## Registro de implementación
| Fecha | Tarea | RED (falló como se esperaba) | GREEN | Refactor / desviación |
|---|---|---|---|---|
| 2026-10-26 | T01 | `noticias.test.ts`: el módulo no existía | 4/4 | — |
| 2026-10-26 | T02 | `datos-publicos.test.ts`: `leerNoticias` y `ETIQUETA_NOTICIAS` no existían | 6/6 | — |
| 2026-10-26 | T03 | `lista-noticias.test.tsx`: el componente no existía | 6/6 | Componente de servidor. El enlace dice «Leer la noticia en <medio>» y su nombre accesible incluye el título |
| 2026-10-26 | T04 | `secciones.test.tsx`: `/noticias` seguía en construcción y enlazaba el CSV | Suite 355/355, tsc y lint sin errores | — |
| 2026-10-26 | T05 | axe sobre la lista | Pasó de entrada | La lista nació accesible (como en la 004); no hubo que cambiar código |
| 2026-10-26 | T06 | `test_skill_buscar_noticias.py`: faltaban `--carpeta` y la regla explícita | 3/3 | Desviación: la skill del repositorio ya proponía por la cola (el plan se basó en la copia vieja de OneDrive); se agregaron el envío por carpeta, el alcance de la aclaración 2 y la verificación de cada nota |
| 2026-10-26 | T07 | `test_propuestas_noticias.py`: no había propuestas | 4/4 al terminar T08 | — |
| 2026-10-26 | T08 | — | 9 noticias verificadas (sep. 2025 a oct. 2026); de los temas repetidos se dejó una nota por medio primario o la más completa | No se hallaron más noticias de 2025 verificables (lo del SAEB del Atlántico es de 2021) |
| 2026-10-26 | T09 | Consulta: 0 aportes *Noticia* de `buscar-noticias` | 9 aportes pendientes (303 a 311), 0 publicadas | — |
| 2026-10-26 | T10 | E2E limpio: 11/13; F-1 (E2E-08): «Aprobar y publicar» de una noticia exigía `publicacion`, que el formulario no ofrece; E2E-13 (LCP) no comprobable en local (1,16 s de referencia) | — | — |
| 2026-10-26 | T11 | `decision.test.ts`: el mismo error de E2E-08 | Suite 356/356, tsc y lint sin errores | `aprobarAporte` valida el registro resultante con `publicacion: Aprobado`. El esquema de noticias es el único que lista esa columna; normas y proyectos no fallaban |
| 2026-10-26 | Repetición E2E | — | `005-noticias.spec.ts`: 14 pasan, 0 fallan (escritorio y 375 px) | El LCP (E2E-13) se mide en el sitio publicado |

## Informe E2E
Enlace a `e2e-informe.md` cuando exista.
