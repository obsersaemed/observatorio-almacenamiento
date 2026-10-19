# 001 · Arquitectura, plataforma y visualización

Estado: Aprobado (2026-10-19)
Fecha: 2026-10-19

## Decisiones (2026-10-19)
El usuario confirmó que el desarrollo **no es remunerado** y delegó las demás preguntas
en la recomendación de Claude:

| # | Pregunta | Decisión |
|---|---|---|
| 1 | Uso comercial | No remunerado → **Vercel Hobby** (opción E) |
| 2 | Repositorio | **Cuenta personal de GitHub** (requisito de Hobby); se transfiere a una organización al migrar a TEJ |
| 3 | Fuente de verdad | **Supabase** reemplaza a la Sheet después de la importación inicial; la Sheet queda congelada como histórico. Respaldo diario a CSV en el repositorio |
| 4 | Editores | En el MVP, **solo el usuario**. Lista de editores ampliable sin cambiar código |
| 5 | Agentes | En el MVP, **a mano desde Claude Code** (sin gasto de API). Programados en una fase posterior |
| 6 | Alcance del MVP | Se acepta el recorte propuesto |

## Idea
Definir la arquitectura completa del observatorio antes de construir cualquier sección:
técnica de programación, componentes de visualización, animaciones, hospedaje, base de
datos y la forma en que los datos se actualizan (por el equipo, por **agentes** y por
**usuarios** del sitio).

## Requisitos que guían la decisión (dados por el usuario)
1. Página **moderna, interactiva y con animaciones**.
2. Evaluar **React** y librerías de componentes actuales.
3. Usar planes **gratuitos**: Vercel (hospedaje) y Supabase (base de datos).
4. Datos **vivos**: se actualizan continuamente, incluso por **agentes** y por los **usuarios** de la página.
5. Restricciones previas: solo SAEB, sitio único migrable a TEJ, MVP el **2026-10-27**.

> El requisito 4 cambia la arquitectura de la v1. Un sitio de CSV estáticos no admite
> aportes de usuarios ni de agentes con revisión. Hace falta una base de datos con
> permisos, una cola de moderación y una interfaz de administración.

## Referencias analizadas

| Sitio | Técnica | Lo que tomamos | Lo que evitamos |
|---|---|---|---|
| [Sandia GESDB](https://sandia.gov/ess-ssl/gesdb/public/statistics.html) | Bootstrap + 6 iframes de Tableau Public | Gráficas por año (anual y acumulada) y por aplicación, con kW y kWh separados; aviso de datos en validación | Iframes lentos; tableros sin actualizar desde 2022 |
| [interconnection.fyi](https://www.interconnection.fyi/eia/projects/type/battery) | **Next.js** generado estático, Vercel | KPI → mapa → tabla; una página por tipo o región (URL compartible, SEO); carga inmediata | — |
| [JRC Storage Inventory](https://ses.jrc.ec.europa.eu/storage-inventory) | Drupal + mashup de Qlik Sense en iframe | Filtros combinables, exportación, **contribución de proyectos por plantilla**, aviso de MWh estimados | Dependencia de un servidor BI; el tablero no había cargado tras 6 s |

## Alternativas de arquitectura

| | Opción | Moderna y animada | Datos vivos (agentes y usuarios) | Costo | Encaje |
|---|---|---|---|---|---|
| A | BI incrustado (Looker, Tableau, Qlik) | Baja | No (edición manual) | Gratis | Descartada |
| B | BI abierto con servidor (Superset, Metabase) | Media | Parcial | Servidor propio | Descartada |
| C | App en Python (Streamlit, Dash) | Baja | Sí, con servidor | Servidor propio | Descartada |
| D | Estático en JS plano + CSV (v1) | Media | **No** | Gratis | Ya no cumple el requisito 4 |
| **E** | **React (Next.js) + Supabase + Vercel** | **Alta** | **Sí, con moderación** | **Gratis (con límites)** | **Recomendada** |
| F | React (Vite, SPA) + Supabase + Cloudflare Pages | Alta | Sí | Gratis | Alternativa si Vercel Hobby no aplica |

## Opción recomendada (E)

### Capas

```
                ┌──────────── Usuarios del sitio ────────────┐
                │ ven datos aprobados · envían aportes (form)│
                └───────────────┬────────────────────────────┘
                                │
  Next.js (React, TypeScript) en Vercel
  ├─ Páginas públicas: generadas en build y regeneradas al aprobar datos
  ├─ /aportar: formulario → tabla `aportes` (estado Pendiente)
  └─ /admin: editores revisan y aprueban (login con enlace mágico)
                                │
  Supabase (Postgres + Auth + Storage + RLS)
  ├─ proyectos, normas, noticias, fuentes          ← solo lectura pública de lo aprobado
  ├─ aportes (cola de moderación)                   ← usuarios y agentes escriben aquí
  └─ historial (auditoría: quién cambió qué y cuándo)
                                ▲
  Agentes programados (GitHub Actions, diario)
  ├─ Noticias: busca y propone noticias           → aportes (Pendiente)
  ├─ Normativa: vigila CREG/MME/CNO y redacta fichas → aportes (Pendiente)
  └─ Proyectos: revisa UPME/XM y propone altas o cambios → aportes (Pendiente)
  + respaldo nocturno: exporta las tablas a CSV en el repo (datos abiertos versionados)
```

**Regla central:** ni usuarios ni agentes publican directamente. Todo entra como
`Pendiente` y un editor lo aprueba. Eso mantiene la regla del proyecto de no publicar
datos inventados ni sin fuente.

### Frontend: React y componentes

| Necesidad | Elegida | Alternativas | Por qué |
|---|---|---|---|
| Framework | **Next.js** (App Router, TypeScript) | Vite + React (F), Astro | Mismo patrón que interconnection.fyi: páginas por departamento o proyecto, SEO, despliegue nativo en Vercel. Versión estable vigente de la serie 16 |
| Estilos y componentes | **Tailwind CSS + shadcn/ui** (Radix), con tema de los tokens TEJ | Mantine, Chakra, MUI | Componentes accesibles que se copian al repo (no hay dependencia cerrada) y se adaptan sin pelear con el design system |
| Bloques de tablero | **Tremor** (KPI, tarjetas, barras, donas) | — | Comprado por Vercel en enero de 2025 y ahora gratis y abierto (MIT); hecho para dashboards con Tailwind y Radix |
| Gráficas | **Recharts v3** (base de las gráficas de shadcn y Tremor) | Apache ECharts (`echarts-for-react`), Nivo, visx | Coherente con shadcn y Tremor; si una vista necesita más (zoom temporal, miles de puntos), se usa ECharts solo en esa vista |
| Mapa | **MapLibre GL** (`react-map-gl`) con teselas abiertas basadas en OSM | react-leaflet | Mapa vectorial fluido, animaciones `flyTo`, agrupación de puntos y estilos con los colores TEJ. Proveedor de teselas gratuito por confirmar en el plan |
| Tabla | **TanStack Table** con el estilo de shadcn | AG Grid | Ordenar, filtrar, paginar y exportar CSV sin licencia |
| Animación de interfaz | **Motion** (antes Framer Motion) | — | Transiciones de página, entrada de tarjetas, conteo animado de KPI, layout animado al filtrar |
| Animación narrativa | **GSAP + ScrollTrigger** | — | Desde 2025 es 100 % gratis, con plugins y uso comercial (Webflow). Para la línea de tiempo normativa contada con el scroll |
| Formularios | react-hook-form + **zod** | — | Las mismas reglas de `esquemas.json` en el formulario, en `/admin` y en los agentes |

Todas las animaciones respetan `prefers-reduced-motion` y cada gráfica tiene una tabla o
un texto equivalente (accesibilidad).

**Claude Design** sigue siendo la herramienta de diseño: maquetas por sección antes de
cada spec. El design system TEJ ya trae componentes JSX (`Obs vehiculos/.../components/`),
que se pueden portar a React o TypeScript casi directamente.

### Plataforma gratuita: qué da y qué riesgos tiene

**Vercel Hobby** (consultado el 2026-10-19):
- Incluye 100 GB/mes de transferencia, 1.000.000 de invocaciones de funciones, 4 h de CPU
  activa y 100 despliegues por día. Sobra para un observatorio.
- Cron: solo **una vez al día**, con precisión de ±59 min.
- ⚠️ **Solo para uso personal no comercial.** Vercel considera comercial cualquier
  proyecto en el que alguien reciba pago por producirlo, *"including a paid employee or
  consultant writing the code"*. Si el observatorio se desarrolla con contrato o
  financiación de la UNAL, Hobby no aplica: habría que pasar a Pro (USD 20 al mes) o a la
  opción F.
- ⚠️ Hobby no se conecta a repositorios de **organizaciones** de GitHub. El repositorio
  tendría que estar en una cuenta personal.

**Supabase Free** (consultado el 2026-10-19):
- Incluye 500 MB de base de datos, 5 GB de egreso, 1 GB de archivos, 50.000 usuarios
  activos al mes, 500.000 invocaciones de Edge Functions y 2 proyectos activos (producción
  y pruebas).
- ⚠️ **Pausa por inactividad**: se pausa si en 7 días no hay actividad suficiente en la
  base. Se mitiga con la lectura diaria de los agentes y del respaldo, más el tráfico del
  sitio. Se puede restaurar hasta 90 días después de la pausa.
- ⚠️ No incluye copias de seguridad descargables. Se mitiga con el respaldo nocturno a CSV
  en el repositorio.

**Alternativa F (si Vercel Hobby no aplica):** Cloudflare Pages Free (500 compilaciones
al mes; la página de límites no menciona restricción comercial) + React con Vite o Next
en exportación estática + Supabase. Se pierde la regeneración incremental de Vercel, pero
se reconstruye el sitio con un *deploy hook* cada vez que se aprueban datos.

### Agentes
- Corren en **GitHub Actions** programado (gratis en repositorios públicos) o en el cron
  diario de Vercel, con Claude (Agent SDK o API) y búsqueda web.
- Escriben **solo** en `aportes` con estado `Pendiente`, citando la fuente de cada cambio.
  Tienen una llave de servicio guardada como secreto, nunca expuesta al navegador.
- ⚠️ El uso de la API de Claude **no es gratis**: hay que definir un presupuesto
  mensual. Mientras tanto, los agentes se pueden correr a mano desde Claude Code con las
  skills `buscar-noticias` y `ficha-normativa`.

### Usuarios que aportan
- Formulario `/aportar` (nuevo proyecto, corrección, noticia) con anti-spam (Cloudflare
  Turnstile, gratuito) y límite de envíos.
- RLS en Supabase: el público solo **lee lo aprobado** e **inserta en `aportes`**.
  Solo los editores aprueban.
- Datos personales del aportante (correo) en una tabla no pública.

### Qué pasa con el arnés actual
| Pieza | Cambio |
|---|---|
| Google Sheet `Base de datos SAEB` | Se importa una vez a Supabase; desde entonces la fuente de verdad es Supabase |
| `datos/esquemas.json` + `validar_datos.py` | Se convierten en esquema SQL (restricciones CHECK) y esquemas zod. El validador sigue sirviendo para el CSV de importación y para el respaldo |
| `sitio/` en HTML plano | Se reemplaza por la app Next.js (por ejemplo `web/`) |
| `Mapa/`, `Vehiculos/dashboard/` | Se portan como componentes React |
| Pipeline Python de `Vehiculos/` | Se mantiene; carga a Supabase en lugar de a la Sheet |
| `CLAUDE.md` | Se actualiza el stack (hoy dice "sin framework"), si se aprueba esta opción |

## Dentro del MVP (8 días) / después
**MVP (2026-10-27):**
- Next.js + shadcn/ui + Tremor con tema TEJ; despliegue en Vercel (o F).
- Supabase con tablas, RLS e importación de la Sheet y del CSV de vehículos.
- Cuatro secciones con KPI animados, mapa MapLibre, gráficas Recharts, tabla y exportación a CSV.
- `/aportar` → `aportes`; `/admin` mínimo para aprobar o rechazar.
- Agente de noticias corrido **a mano** desde Claude Code (la skill escribe en `aportes`).

**Después:**
- Agentes programados (noticias, normativa, proyectos) en GitHub Actions.
- Línea de tiempo normativa con GSAP y scroll; páginas por departamento o proyecto.
- Versión EN; cuentas de aportantes frecuentes; API pública de solo lectura.

## Riesgos
| Riesgo | Mitigación |
|---|---|
| 8 días es poco para pasar a un stack nuevo | MVP recortado (arriba); Claude Code genera el andamiaje; componentes de shadcn y Tremor ya hechos |
| Uso comercial en Vercel Hobby | Confirmarlo antes de desplegar; plan B en F |
| Pausa de Supabase Free | Actividad diaria de agentes y respaldo; restauración hasta 90 días |
| Spam o datos falsos de usuarios | Moderación obligatoria, Turnstile, RLS y fuente obligatoria |
| Agentes que alucinan datos | Solo proponen (`Pendiente`), con fuente obligatoria; un humano aprueba |
| El equipo mantiene un stack con Node | Documentar en `CLAUDE.md`; componentes simples; Claude Code como apoyo |

## Preguntas abiertas
1. **Uso comercial:** ¿alguien recibe pago (contrato o proyecto financiado) por desarrollar el observatorio? Define Vercel Hobby, Pro o la opción F.
2. **Repositorio:** ¿quedará en tu cuenta personal de GitHub o en una organización (UNAL u otra)?
3. **Fuente de verdad:** ¿aceptas que Supabase reemplace a la Google Sheet como base oficial (con respaldo diario a CSV)?
4. **Editores:** ¿quiénes aprueban los aportes? ¿Solo tú o un equipo?
5. **Agentes:** ¿hay presupuesto para la API de Claude, o en el MVP se corren a mano desde Claude Code?
6. **Alcance del MVP:** ¿te sirve el recorte propuesto para el 27 de octubre?

## Fuentes
- [Vercel · Limits](https://vercel.com/docs/limits) · [Fair use y uso comercial](https://vercel.com/docs/limits/fair-use-guidelines) · [Cron jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Supabase · Pricing](https://supabase.com/pricing) · [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Cloudflare Pages · Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Vercel adquiere Tremor](https://vercel.com/blog/vercel-acquires-tremor)
- [Webflow hace GSAP 100 % gratis](https://webflow.com/blog/gsap-becomes-free)
- [shadcn/ui · Chart (Recharts)](https://ui.shadcn.com/docs/components/base/chart)
- [Next.js · Static exports](https://nextjs.org/docs/app/guides/static-exports)
