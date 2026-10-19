Project-status indicator used on the map, legend and data table.

```jsx
<StatusBadge status="op" />                {/* green dot + "En operación" */}
<StatusBadge status="susp" variant="text" /> {/* red label for a table cell */}
<StatusBadge status="con" variant="pill" />
```

Statuses: `op` (verde), `con` (naranja), `plan` (gris), `susp` (rojo). Also exports the `STATUS` map for custom rendering.
