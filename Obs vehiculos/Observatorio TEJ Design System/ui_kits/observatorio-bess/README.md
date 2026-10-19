# UI Kit — Observatorio de Almacenamiento (BESS)

High-fidelity recreation of the storage-systems observatory, re-laid-out under the **Observatorio TEJ** website identity. This is the spatial-organization proposal for publishing the Data Studio / Looker observatory as a branded web page.

## Files
- `index.html` — entry point; loads the design-system bundle, Leaflet, data and the screen.
- `ObservatorioDashboard.jsx` — the full page, composing DS components (`SiteHeader`, `Hero`, `StatCard`, `Panel`, `BarChart`, `DonutChart`, `LineChart`, `DataTable`, `MapPanel`, `Logo`, `SocialLinks`) + a live Leaflet map.
- `data.js` — the four sample projects from the source dashboard (`window.BESS_DATA`).

## Spatial layout (top → bottom)
1. **TEJ site header** — brand lockup, search, language, teal nav.
2. **Hero band** — section title + blurb + access buttons over the Colombia-map watermark.
3. **KPI strip** — potencia total, capacidad total, proyectos en operación, registrados.
4. **Map + side panels** — large Leaflet map (status-colored markers) beside the Tecnología donut and status summary.
5. **Charts row** — MW vs MWh bar chart + potencia vs FPO line chart.
6. **Inventory table** — full project table; click a row to fly the map to that project.
7. **Footer** — brand + social on teal.

## Interactions
- Click a table row → map flies to the project and opens its popup.
- Click a map marker → selects the project.
- Nav items and language toggle are interactive (cosmetic).

## Data source
Values mirror the user's Data Studio dashboard (Canadian solar, La Martina, BESS Termozipa, Celsia Solar Palmira 2). Coordinates are approximate municipality centroids.
