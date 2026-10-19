Grouped vertical bar chart matching "Comparación MW vs MWh por proyecto" — value labels above bars, light gridlines, a two-color series (teal + purple).

```jsx
<BarChart
  categories={['Canadian solar', 'La Martina', 'BESS Termozipa']}
  series={[
    { label: 'Potencia nominal [MW]', color: 'var(--series-1)', values: [50, 9, 7] },
    { label: 'Capacidad máxima [MWh]', color: 'var(--series-2)', values: [45, 6.9, 3.9] },
  ]}
/>
```
