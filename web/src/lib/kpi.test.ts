import { describe, expect, test } from "vitest";
import { calcularKpi, type ProyectoKpi } from "./kpi";

const p = (estado: string, mw: number | null, mwh: number | null): ProyectoKpi => ({
  estado,
  potencia_nominal_mw: mw,
  capacidad_maxima_mwh: mwh,
});

describe("KPI del inicio (CA-02.1)", () => {
  const proyectos = [
    p("En operación", 7, 3.9),
    p("En operación", 9, 6.9),
    p("En operación", 1, null),
    p("En construcción", 18, 25),
    p("Anunciado", 50, 195),
    p("Inactivo", 50, 45),
  ];

  test("MW y MWh en operación suman solo proyectos En operación, por separado", () => {
    const k = calcularKpi(proyectos);
    expect(k.mwOperacion).toBe(17);
    expect(k.mwhOperacion).toBeCloseTo(10.8);
  });

  test("cuenta proyectos por estado y el total", () => {
    const k = calcularKpi(proyectos);
    expect(k.total).toBe(6);
    expect(k.porEstado).toEqual({
      "En operación": 3,
      "En construcción": 1,
      Anunciado: 1,
      Inactivo: 1,
    });
  });

  test("sin proyectos todo es cero", () => {
    expect(calcularKpi([])).toEqual({
      total: 0,
      porEstado: { "En operación": 0, "En construcción": 0, Anunciado: 0, Inactivo: 0 },
      mwOperacion: 0,
      mwhOperacion: 0,
    });
  });

  test("acepta números que llegan como texto desde la API (numeric de Postgres)", () => {
    const k = calcularKpi([{ estado: "En operación", potencia_nominal_mw: "7.5" as never, capacidad_maxima_mwh: "2" as never }]);
    expect(k.mwOperacion).toBe(7.5);
    expect(k.mwhOperacion).toBe(2);
  });
});
