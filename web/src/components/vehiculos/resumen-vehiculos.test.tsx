// 003 · T11 · RF-03, RF-05, RF-11, RNF-04: KPI, tabla de tecnología y créditos. Datos ficticios.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { armarLineas } from "@/lib/vehiculos";
import { Creditos, KpiVehiculos, TablaTecnologia } from "./resumen-vehiculos";

const lineas = armarLineas(
  [
    { marca: "A", linea: "A1", tipo_de_bateria: "LFP", capacidad_minima_kwh: 45, capacidad_maxima_kwh: 45, potencia_kw: null },
    { marca: "B", linea: "B1", tipo_de_bateria: "Lithium-ion", capacidad_minima_kwh: 40, capacidad_maxima_kwh: 60, potencia_kw: null },
  ],
  [
    { linea: "A1", ano: 2024, unidades: 30_000 },
    { linea: "A1", ano: 2026, unidades: 1_000 },
    { linea: "B1", ano: 2025, unidades: 14_346 },
  ],
);

describe("KpiVehiculos (RF-03, CA-03.1)", () => {
  test("vehículos con punto de miles y sin «mil»; energía en MWh con un decimal; el rótulo trae los años", () => {
    render(<KpiVehiculos lineas={lineas} />);
    const vehiculos = screen.getByRole("group", { name: "Vehículos eléctricos registrados · 2024–2026" });
    expect(vehiculos).toHaveTextContent("45.346");
    expect(vehiculos).not.toHaveTextContent("mil");
    // 31.000 × 45 + 14.346 × 50 = 2.112.300 kWh
    expect(screen.getByRole("group", { name: "Energía almacenada en circulación [MWh]" })).toHaveTextContent("2.112,3 MWh");
  });
});

describe("TablaTecnologia (RF-05, CA-05.1)", () => {
  test("cada tipo con su porcentaje de vehículos, con un decimal", () => {
    render(<TablaTecnologia lineas={lineas} />);
    const tabla = screen.getByRole("table", { name: "Participación por tipo de batería" });
    expect(within(tabla).getAllByRole("row").slice(1).map((r) => r.textContent)).toEqual(["LFP68,4 %", "Lithium-ion31,6 %"]);
  });
});

describe("Creditos (RF-11, RF-12, CA-11.1)", () => {
  test("fuentes, última actualización (fecha de la importación en Colombia) y ventas hasta", () => {
    render(<Creditos importacion={{ actualizado_en: "2026-10-23T02:30:00+00:00", corte: "2026-09-17" }} />);
    expect(screen.getByText(/^Fuentes:/)).toHaveTextContent(
      "Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última actualización: 22/10/2026 · Ventas hasta el 17/09/2026",
    );
  });

  test("sin importación no inventa fechas", () => {
    render(<Creditos importacion={null} />);
    expect(screen.getByText(/^Fuentes:/)).toHaveTextContent("Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio");
    expect(screen.queryByText(/Última actualización/)).toBeNull();
  });
});
