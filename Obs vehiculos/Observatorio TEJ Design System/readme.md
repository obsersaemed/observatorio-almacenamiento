# Observatorio TEJ — Design System

Design system for the **Observatorio de Transición Energética Justa en Colombia** (Observatorio TEJ) and its data observatories — starting with the **Observatorio de Almacenamiento de Energía** (sistemas BESS: baterías, potencias, capacidades y ubicaciones en Colombia). The observatory is published on the web as a map + statistics dashboard; this system carries the brand foundations, reusable components and full-screen kits needed to build and extend those pages.

## Context & sources
This system was built from two sources the user provided (no code repository or Figma):
- **`uploads/MAQUETACONTENIDOSv1.pdf`** — grayscale content wireframe ("maqueta") of the TEJ website: masthead, nav (Quiénes somos · Secciones · Glosario · Observatorios · Noticias · Contacto), search + language toggle + social links, a hero with description and "Acceso sección" buttons, and section landing pages. Typeface: **Raleway** (Bold + Regular; Arial as PDF fallback). Signature motif: a faint **Colombia departments map** watermark. Copied to `assets/colombia-map-watermark.png`.
- **`uploads/pasted-1789828414417-0.png`** — the user's Data Studio / Looker observatory: teal title pill, KPI cards, bar chart (MW vs MWh), technology donut, potencia-vs-FPO line chart, a Leaflet map of Colombia with status-colored markers, and a project inventory table. This is the source of the **data-visualization palette** (teal + purple, green/orange/gray status). Copied to `assets/reference-dashboard.png`.

Brand: **Observatorio de Transición Energética Justa** ("Observatorio TEJ" / short mark "TEJ").

> **No logo was provided.** Neither source contains a brand logo, so the identity is set in **Raleway** type (`Logo` component). Do not invent a mark — replace `Logo` if an official logo becomes available.

## CONTENT FUNDAMENTALS
- **Language:** Spanish (Colombia), institutional but public-facing. A future EN toggle exists (`LangToggle`).
- **Voice:** third-person, informative and neutral — describes data, does not editorialize. E.g. "Inventario de sistemas BESS en Colombia", "Almacenamiento de energía por baterías — operadores y capacidades". No "we/you" address in labels.
- **Casing:** Sentence case for body and section titles; the observatory title appears in **UPPERCASE** on the teal pill ("OBSERVATORIO DE ALMACENAMIENTO DE ENERGIA" in the source). Nav labels are sentence case.
- **Numbers:** es-CO conventions — **decimal comma** ("67,0" MW; "57,8" MWh). Units in square brackets: "Potencia total instalada [MW]", "Capacidad total [MWh]".
- **Domain terms (verbatim):** BESS, Li-ion, FPO (Fecha de Puesta en Operación), potencia nominal, capacidad máxima; estados: **En operación / En construcción / Planeado / Suspendido**. Departamento + Municipio for location.
- **Tone examples:** "Descripción breve, impactante del sitio." (hero); "Descripción breve y clara de la sección." (section); "Conoce más del trilema" (CTA).
- **Emoji:** none. Icons are simple line/solid glyphs (search, chevron, info, social).

## VISUAL FOUNDATIONS
- **Color:** brand **teal `--teal-300` #4dd0e1** leads — header/nav bands, KPI pills, primary chart series, map accents. Secondary data series is **purple `--purple-200` #ce93d8**; a warm **peach `--peach-300` #f4b183** (from the site wireframe) is a sparing highlight/CTA accent. Project **status** colors: green operación (#2e9b4e), orange construcción (#ef9f2e), gray planeado (#9aa0a6), red suspendido (#e2413a). Neutrals are cool grays on a faint teal-gray page (`--surface-alt` #f5f8f9). Max one or two dominant colors per surface; teal + white carry most of it. Full-opacity ink for text (never alpha-muted).
- **Type:** **Raleway** everywhere (loaded from Google Fonts — see note). ExtraBold/Bold (700–800) for the brand title and headings, Regular/Medium (400–500) for body. Large 800-weight numerals for KPIs. Uppercase kickers/labels carry a small positive letter-spacing (`--ls-caps`).
- **Backgrounds:** predominantly white cards on a faint teal-gray page. The **Colombia-map watermark** is the one signature texture — faint on light surfaces, or lightened via `mix-blend-mode: screen` over teal. No photographic imagery, no aggressive gradients; the only gradients are the soft area fill under the line chart.
- **Corner radii:** cards/panels `--radius-lg` 16px; the header title badge `--radius-xl` 22px; KPI pills 16px; search + toggles + status pills fully round (`--radius-pill`). Chart bars use a small 2px radius.
- **Cards:** white fill, 1px `--border-card` hairline, soft low-contrast shadow (`--shadow-card` = 0 2px 10px rgba(27,50,54,.08)). KPI pills drop the border and use a teal glow (`--shadow-brand`). `SectionCard` adds a colored top accent bar.
- **Shadows:** three tiers — `--shadow-sm`, `--shadow-card`, `--shadow-pop` (popovers/map overlays) — all cool and soft; plus the teal `--shadow-brand` under KPI pills.
- **Borders:** hairline `--line-200`/`--line-300`; teal outline for secondary buttons (1.5px).
- **Motion:** restrained. Buttons brighten ~6% on hover and nudge 1px down on press; nav items get a translucent white wash and an underline on the active/hover state; the map uses a 0.8s `flyTo` ease when a project is selected. No bounces or decorative animation.
- **Hover / press states:** hover = slight brightness reduction (fills) or translucent wash (nav); press = 1px downward translate. Links: `--text-link` teal, underline on hover.
- **Transparency / blur:** used sparingly — translucent white nav washes and the map attribution strip; no glassmorphism.
- **Layout:** centered `--page-max` 1240px column, 28px side gutters. Dashboard uses CSS grid with `minmax(0,1fr)` tracks so panels reflow; KPI strip is a 4-up grid; the map sits in a ~1.9:1 grid beside the donut/status column.
- **Imagery vibe:** cartographic and cool — the faint Colombia outline and OpenStreetMap tiles; no warm/photographic imagery.

## ICONOGRAPHY
- No icon font or SVG sprite existed in the sources. Icons are **inline SVG** drawn in-component at a consistent ~2px stroke (search magnifier, chevrons) or solid brand glyphs (social: X, Instagram, Facebook, LinkedIn in `SocialLinks`).
- Two raster UI glyphs were extracted from the source PDF and copied to `assets/`: `icon-search.png`, `icon-info.png` (the components use crisp inline SVG equivalents; the PNGs are kept for reference/parity).
- **Map markers** are Leaflet `circleMarker`s filled by status color (green/orange/gray/red) with a white ring — matching the source dashboard.
- **No emoji, no unicode-glyph icons.** If a larger icon set is needed later, add a CDN line set (e.g. Lucide, ~2px stroke to match) and document it here — this would be a flagged substitution, none is used today.

## Components
All under `components/`, exported on `window.ObservatorioTEJDesignSystem_45c7be`.
- **Navigation:** `SiteHeader`, `LangToggle`
- **Brand:** `Logo`, `SocialLinks`
- **Forms:** `Button`, `SearchField`
- **Data:** `StatCard`, `Panel`, `StatusBadge`, `StatusLegend`, `DataTable`
- **Charts:** `BarChart`, `DonutChart`, `LineChart`
- **Sections:** `Hero`, `SectionCard`, `MapPanel`

(`STATUS`, exported from `StatusBadge`, is the shared status→color/label map — data, not a component.)

## Index / manifest
- `styles.css` — global entry (import lines only). Consumers link this.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `components/` — `navigation/`, `brand/`, `forms/`, `data/`, `charts/`, `sections/` (each: `.jsx` + `.d.ts` + `.prompt.md` + one `@dsCard` HTML).
- `ui_kits/observatorio-bess/` — the BESS observatory dashboard (spatial-layout proposal; real Leaflet map).
- `ui_kits/sitio-tej/` — the TEJ website (home + section landing).
- `assets/` — `colombia-map-watermark.png`, `icon-search.png`, `icon-info.png`, `reference-dashboard.png`.
- `thumbnail.html` — homepage tile. `SKILL.md` — Agent-Skills wrapper.

## Font note (needs your input)
Raleway is loaded from **Google Fonts** because no font binaries were provided. It matches the source exactly. If you have licensed Raleway files, drop them in `assets/fonts/` and swap the `@import` in `tokens/fonts.css` for local `@font-face` rules.
