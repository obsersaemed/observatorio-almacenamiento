// 003 · T07: cifras de /vehiculos. Datos ficticios.
import { describe, expect, test } from "vitest";
import {
  armarLineas,
  esParcial,
  filtrar,
  kpiVehiculos,
  OTROS,
  opcionesDe,
  porMarca,
  porTipo,
  type FilaLinea,
  type FilaVenta,
} from "./vehiculos";

const lineas: FilaLinea[] = [
  { marca: "A", linea: "A1", tipo_de_bateria: "LFP", capacidad_minima_kwh: 40, capacidad_maxima_kwh: 60, potencia_kw: null },
  { marca: "A", linea: "A2", tipo_de_bateria: "Lithium-ion", capacidad_minima_kwh: 50, capacidad_maxima_kwh: 50, potencia_kw: 100 },
  { marca: "B", linea: "B1", tipo_de_bateria: "LFP", capacidad_minima_kwh: "30", capacidad_maxima_kwh: "30", potencia_kw: null },
];
const ventas: FilaVenta[] = [
  { linea: "A1", ano: 2024, unidades: 100 },
  { linea: "A1", ano: 2025, unidades: 0 },
  { linea: "A2", ano: 2025, unidades: 20 },
  { linea: "B1", ano: 2024, unidades: "300" },
];
const todas = armarLineas(lineas, ventas);
const nombres = (xs: { linea: string }[]) => xs.map((x) => x.linea);

describe("armarLineas", () => {
  test("une la ficha con las ventas: capacidad promedio, unidades por año, total y kWh (RF-04)", () => {
    expect(todas[0]).toMatchObject({ marca: "A", linea: "A1", tipo: "LFP", capProm: 50, porAnio: { 2024: 100, 2025: 0 }, unidades: 100, kwh: 5000 });
    expect(todas[2]).toMatchObject({ capProm: 30, unidades: 300, kwh: 9000 });
  });
});

describe("kpiVehiculos (RF-03, CA-03.2)", () => {
  test("vehículos = suma de unidades; energía en MWh = Σ unidades × capacidad promedio ÷ 1.000", () => {
    expect(kpiVehiculos(todas)).toEqual({ vehiculos: 420, mwh: 15 });
    expect(kpiVehiculos(filtrar(todas, { linea: ["A1"] }))).toEqual({ vehiculos: 100, mwh: 5 });
  });
  test("vacío da 0", () => {
    expect(kpiVehiculos([])).toEqual({ vehiculos: 0, mwh: 0 });
  });
});

describe("filtrar y opcionesDe (RF-02, CA-02.1)", () => {
  test("varios valores dentro de un filtro; entre filtros se cumplen todos", () => {
    expect(nombres(filtrar(todas, { marca: ["A"], tipo: ["LFP"] }))).toEqual(["A1"]);
    expect(nombres(filtrar(todas, { tipo: ["LFP", "Lithium-ion"] }))).toEqual(["A1", "A2", "B1"]);
  });
  test("cada opción trae su conteo de vehículos; la línea solo ofrece las de la marca elegida", () => {
    expect(opcionesDe(todas, "marca", {})).toEqual([
      { valor: "A", cantidad: 120 },
      { valor: "B", cantidad: 300 },
    ]);
    expect(opcionesDe(todas, "linea", { marca: ["A"] }).map((o) => o.valor)).toEqual(["A1", "A2"]);
  });
});

describe("porTipo (RF-05, RF-08, RF-09)", () => {
  test("participación en vehículos que suma 100 y energía por tipo que suma el KPI", () => {
    const tipos = porTipo(todas);
    expect(tipos).toEqual([
      { tipo: "LFP", vehiculos: 400, porcentaje: (400 * 100) / 420, mwh: 14 },
      { tipo: "Lithium-ion", vehiculos: 20, porcentaje: (20 * 100) / 420, mwh: 1 },
    ]);
    expect(tipos.reduce((t, x) => t + x.porcentaje, 0)).toBeCloseTo(100);
  });
});

describe("porMarca (RF-06, RF-07)", () => {
  const muchas = armarLineas(
    Array.from({ length: 12 }, (_, i) => ({
      marca: `M${String(i).padStart(2, "0")}`, linea: `L${i}`, tipo_de_bateria: "LFP",
      capacidad_minima_kwh: 10, capacidad_maxima_kwh: 10, potencia_kw: null,
    })),
    Array.from({ length: 12 }, (_, i) => ({ linea: `L${i}`, ano: 2024 + (i % 2), unidades: (i + 1) * 10 })),
  );

  test("las 9 marcas con más ventas, de mayor a menor, y «Otros» al final con el resto", () => {
    const marcas = porMarca(muchas);
    expect(marcas).toHaveLength(10);
    expect(marcas.slice(0, 3).map((m) => m.marca)).toEqual(["M11", "M10", "M09"]);
    expect(marcas[9]).toEqual({ marca: OTROS, total: 10 + 20 + 30, porAnio: { 2024: 10 + 30, 2025: 20 }, porcentaje: (60 * 100) / 780 });
    expect(marcas.reduce((t, m) => t + m.porcentaje, 0)).toBeCloseTo(100);
  });

  test("con 9 marcas o menos no hay «Otros»", () => {
    expect(porMarca(todas).map((m) => m.marca)).toEqual(["B", "A"]);
  });
});

describe("esParcial (RF-06)", () => {
  test("el último año es parcial si el corte es anterior al 31 de diciembre de ese año", () => {
    expect(esParcial(2026, "2026-09-17")).toBe(true);
    expect(esParcial(2025, "2026-09-17")).toBe(false);
    expect(esParcial(2026, "2026-12-31")).toBe(false);
    expect(esParcial(2026, null)).toBe(false);
  });
});
