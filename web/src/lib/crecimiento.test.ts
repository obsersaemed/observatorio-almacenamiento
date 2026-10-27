// 007 · T07 · RF-10 · CA-10.1, CA-10.3: potencia acumulada por año de FPO para la gráfica del
// inicio. Proyectos FICTICIOS de prueba (no son datos reales).
import { describe, expect, test } from "vitest";
import { crecimiento } from "./crecimiento";

const p = (estado: string, mw: number | null, fpo: string) => ({ estado, mw, fpo });

describe("crecimiento", () => {
  test("acumula por año de FPO los MW de En operación, En construcción y Anunciado", () => {
    const { barras } = crecimiento([
      p("En operación", 7, "2021"),
      p("En operación", 1, "2024"),
      p("En operación", 9, "2025"),
      p("En construcción", 18, "2027"),
      p("Anunciado", 100, "2030"),
    ]);
    expect(barras.map((b) => [b.anio, b.mw])).toEqual([
      [2021, 7],
      [2024, 8],
      [2025, 17],
      [2027, 35],
      [2030, 135],
    ]);
  });

  test("Inactivo no suma en ninguna barra (CA-10.3)", () => {
    const { barras } = crecimiento([p("En operación", 5, "2022"), p("Inactivo", 50, "2022"), p("Inactivo", 3, "2023")]);
    expect(barras).toEqual([{ anio: 2022, mw: 5, proyeccion: false }]);
  });

  test("los proyectos sin año quedan fuera y se cuentan aparte", () => {
    const { barras, sinAnio } = crecimiento([
      p("En operación", 5, "2022"),
      p("Anunciado", 40, ""),
      p("En construcción", 10, "Por definir"),
      p("Inactivo", 2, ""),
    ]);
    expect(barras.map((b) => b.mw)).toEqual([5]);
    expect(sinAnio).toBe(2);
  });

  test("un MW vacío cuenta como cero", () => {
    const { barras } = crecimiento([p("En operación", null, "2022"), p("En operación", 4, "2023")]);
    expect(barras.map((b) => b.mw)).toEqual([0, 4]);
  });

  test("proyeccion: true desde el primer año con En construcción o Anunciado", () => {
    const { barras } = crecimiento([
      p("En operación", 7, "2021"),
      p("Anunciado", 10, "2026"),
      p("En operación", 3, "2028"),
    ]);
    expect(barras.map((b) => [b.anio, b.proyeccion])).toEqual([
      [2021, false],
      [2026, true],
      [2028, true],
    ]);
  });
});
