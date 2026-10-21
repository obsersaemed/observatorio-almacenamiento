// Dónde va la tarjeta de un punto del mapa en escritorio (spec 002, CA-04.4): encima del
// punto si cabe y si no debajo, montada sobre él para que el mouse pase sin hueco, y siempre
// completa dentro del marco del mapa.

/** Separación mínima con los bordes del marco (px). */
export const MARGEN = 8;
/** Cuánto se monta la tarjeta sobre el punto (px): no deja hueco al mover el mouse. */
export const SOLAPE = 6;

type Punto = { x: number; y: number };
type Tamano = { ancho: number; alto: number };

const limitar = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

export function posicionTarjeta(punto: Punto, tarjeta: Tamano, marco: Tamano) {
  const altoUtil = marco.alto - 2 * MARGEN;
  if (tarjeta.alto > altoUtil) {
    return { left: limitar(punto.x - tarjeta.ancho / 2, MARGEN, marco.ancho - tarjeta.ancho - MARGEN), top: MARGEN, maxHeight: altoUtil };
  }
  const arriba = punto.y + SOLAPE - tarjeta.alto;
  const top = arriba >= MARGEN ? arriba : punto.y - SOLAPE;
  return {
    left: limitar(punto.x - tarjeta.ancho / 2, MARGEN, marco.ancho - tarjeta.ancho - MARGEN),
    top: limitar(top, MARGEN, marco.alto - tarjeta.alto - MARGEN),
    maxHeight: undefined,
  };
}
