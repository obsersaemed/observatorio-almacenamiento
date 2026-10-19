The observatory's framed map — a floating title card (top-left), an "Estado" legend (bottom-right) and an attribution strip, wrapping whatever map you pass as `children` (a Leaflet container or a static map image). Composes StatusLegend.

```jsx
<MapPanel title="Inventario de Sistemas BESS en Colombia" height={440}>
  <div id="leaflet-map" style={{ position: 'absolute', inset: 0 }} />
</MapPanel>
```

For a quick static preview pass `mapSrc` instead of children. Real product maps use Leaflet + OpenStreetMap tiles with status-colored markers.
