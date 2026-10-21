// 002 · T20, T21 · CA-04.2, CA-04.4: la tarjeta del mapa cabe completa en el marco y no deja
// hueco con el punto. Marco de 800 × 500 px y tarjeta de 280 × 300 px (ficticios).
import { describe, expect, test } from "vitest";
import { MARGEN, posicionTarjeta, SOLAPE } from "./posicion-tarjeta";

const marco = { ancho: 800, alto: 500 };
const tarjeta = { ancho: 280, alto: 300 };

describe("posicionTarjeta", () => {
  test("T21 · encima del punto si cabe, montada sobre él (sin hueco)", () => {
    const r = posicionTarjeta({ x: 400, y: 400 }, tarjeta, marco);
    expect(r.top + tarjeta.alto).toBe(400 + SOLAPE);
    expect(r.left).toBe(400 - tarjeta.ancho / 2);
    expect(r.maxHeight).toBeUndefined();
  });

  test("T21 · debajo del punto si arriba no cabe, también montada sobre él", () => {
    const r = posicionTarjeta({ x: 400, y: 100 }, tarjeta, marco);
    expect(r.top).toBe(100 - SOLAPE);
  });

  test("T20 · nunca se sale por la izquierda ni por la derecha", () => {
    expect(posicionTarjeta({ x: 10, y: 400 }, tarjeta, marco).left).toBe(MARGEN);
    expect(posicionTarjeta({ x: 795, y: 400 }, tarjeta, marco).left).toBe(marco.ancho - tarjeta.ancho - MARGEN);
  });

  test("T20 · si no cabe ni arriba ni abajo, queda dentro del marco", () => {
    const r = posicionTarjeta({ x: 400, y: 250 }, { ancho: 280, alto: 400 }, marco);
    expect(r.top).toBeGreaterThanOrEqual(MARGEN);
    expect(r.top + 400).toBeLessThanOrEqual(marco.alto - MARGEN);
  });

  test("T20 · una tarjeta más alta que el marco limita su alto y empieza en el margen", () => {
    const r = posicionTarjeta({ x: 400, y: 250 }, { ancho: 280, alto: 700 }, marco);
    expect(r.top).toBe(MARGEN);
    expect(r.maxHeight).toBe(marco.alto - 2 * MARGEN);
  });
});
