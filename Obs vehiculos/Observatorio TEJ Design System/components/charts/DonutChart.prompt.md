SVG donut matching the observatory's "Tecnología" chart, with a centered value and side legend.

```jsx
<DonutChart data={[{ label: 'Li-ion', value: 100 }]} />
<DonutChart data={[{ label: 'Li-ion', value: 80 }, { label: 'Flujo', value: 20 }]} />
```

Segment colors default to the brand series (teal, purple, peach); override per-datum with `color`.
