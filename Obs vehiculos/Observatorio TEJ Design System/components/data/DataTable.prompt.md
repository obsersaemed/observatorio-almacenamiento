The observatory's project-inventory table — light-teal header, zebra rows, right-aligned numeric columns and colored status cells. Composes StatusBadge.

```jsx
<DataTable
  columns={[
    { key: 'nombre', label: 'Nombre' },
    { key: 'operador', label: 'Operador' },
    { key: 'estado', label: 'Estado', status: true },
    { key: 'capacidad', label: 'Capacidad [MWh]', numeric: true },
  ]}
  rows={[{ nombre: 'La Martina', operador: 'Erco', estado: 'op', capacidad: '6,9' }]}
/>
```

Status columns take a status key (`op | con | plan | susp`) as the cell value.
