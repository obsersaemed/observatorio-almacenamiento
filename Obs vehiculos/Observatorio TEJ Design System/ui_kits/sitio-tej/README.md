# UI Kit — Sitio TEJ

Recreation of the **Observatorio de Transición Energética Justa** website from the source content wireframe (`MAQUETACONTENIDOSv1.pdf`). Two click-through screens.

## Files
- `index.html` — entry point.
- `TejSite.jsx` — home + section-landing screens, composing DS components (`SiteHeader`, `Hero`, `SectionCard`, `Panel`, `Button`, `Logo`, `SocialLinks`). Exposes `window.TejSite`.

## Screens
- **Home** — masthead, hero (title, blurb, search, three "Acceso sección" buttons over the map watermark) and the "Secciones" card grid.
- **Sección (Trilema)** — teal section hero with the map watermark, "Conoce más del trilema" / "Secciones" CTAs, and tool + publications panels.

## Interactions
- Access buttons, nav items and section cards navigate between Home and the section landing.
- Language toggle is interactive (cosmetic).

Content strings ("Descripción breve, impactante del sitio…", section names) are kept verbatim from the wireframe placeholders.
