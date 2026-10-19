Buttons for the TEJ site and observatory — teal fills, teal outlines, text ghosts, and a warm peach accent, with an optional trailing chevron for section-access links.

```jsx
<Button variant="primary">Buscar</Button>
<Button variant="secondary" chevron>Acceso sección 1</Button>
<Button variant="ghost">Conoce más del trilema</Button>
<Button variant="accent" size="lg">Explorar el observatorio</Button>
```

Variants: `primary` (teal fill, white text — main CTA), `secondary` (teal outline on transparent), `ghost` (borderless text link), `accent` (peach fill, ink text — sparingly). Sizes `sm | md | lg`. Set `chevron` for the wireframe's "Acceso sección →" style. Use `as="a"` with `href` for navigation.
