// 007 · T17 · RF-23 · CA-23.1: posiciones de la línea de puntos de /normativa. Normas
// FICTICIAS de prueba (no son datos reales).
import { describe, expect, test } from "vitest";
import { lineaPuntos } from "./linea-puntos";

const n = (id: string, fecha: string, precision_fecha: string | null = null) => ({ id, fecha, precision_fecha });

// Escala: del 1 de enero del primer año menos medio año al 31 de diciembre del último año más
// medio año. Con 2020 y 2023 va de 2019,5 a 2024,5 (5 años = 100 %).
const pct = (anioDecimal: number) => ((anioDecimal - 2019.5) / 5) * 100;

describe("lineaPuntos", () => {
  test("la posición (%) es proporcional a la fecha, con medio año de margen", () => {
    const { puntos } = lineaPuntos([n("a", "2020-01-01"), n("b", "2023-12-31"), n("c", "2022-01-01")]);
    const pos = Object.fromEntries(puntos.map((p) => [p.id, p.posicion]));
    expect(pos.a).toBeCloseTo(pct(2020), 5);
    expect(pos.c).toBeCloseTo(pct(2022), 5);
    expect(pos.b).toBeCloseTo(pct(2023 + 364 / 365), 5);
    for (const p of puntos) {
      expect(p.posicion).toBeGreaterThan(0);
      expect(p.posicion).toBeLessThan(100);
    }
  });

  test("las marcas de año van cada 2 años, en el 1 de enero", () => {
    const { marcas } = lineaPuntos([n("a", "2020-03-01"), n("b", "2023-05-01")]);
    expect(marcas.map((m) => m.anio)).toEqual([2020, 2022, 2024]);
    expect(marcas[0].posicion).toBeCloseTo(pct(2020), 5);
    expect(marcas[1].posicion).toBeCloseTo(pct(2022), 5);
  });

  test("precisión de año: a mitad del año; de mes: a mitad del mes", () => {
    const { puntos } = lineaPuntos([n("a", "2020-01-01", "Año"), n("m", "2023-07-01", "Mes"), n("d", "2021-07-01", "Día")]);
    const pos = Object.fromEntries(puntos.map((p) => [p.id, p.posicion]));
    expect(pos.a).toBeCloseTo(pct(2020.5), 5);
    // julio de 2023: del día 181 (1 de julio) más 15,5 días, sobre 365.
    expect(pos.m).toBeCloseTo(pct(2023 + (181 + 15.5) / 365), 5);
    expect(pos.d).toBeCloseTo(pct(2021 + 181 / 365), 5);
  });

  test("los puntos, ordenados por fecha, alternan arriba y abajo", () => {
    const { puntos } = lineaPuntos([n("c", "2024-02-03"), n("a", "2024-02-01"), n("b", "2024-02-02"), n("d", "2024-02-04")]);
    expect(puntos.map((p) => [p.id, p.arriba])).toEqual([
      ["a", true],
      ["b", false],
      ["c", true],
      ["d", false],
    ]);
  });

  test("sin normas no hay puntos ni marcas", () => {
    expect(lineaPuntos([])).toEqual({ puntos: [], marcas: [] });
  });
});
