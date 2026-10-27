import { describe, expect, test } from "vitest";
import { formatoEnergia, formatoFecha, formatoMW, formatoMWh, formatoNumero, formatoPotencia } from "./formato";

// 008 · T04: en «Detrás del medidor» las cifras van en kW y kWh (RF-05, RNF-02).
describe("formatoPotencia y formatoEnergia (008)", () => {
  test("en kW multiplica por 1000 y usa kW / kWh", () => {
    expect(formatoPotencia(0.015, "kW")).toBe("15,0 kW");
    expect(formatoEnergia(0.04, "kW")).toBe("40,0 kWh");
    expect(formatoPotencia(0.107, "kW")).toBe("107,0 kW");
    expect(formatoEnergia(0.241, "kW")).toBe("241,0 kWh");
  });

  test("en MW queda como hoy", () => {
    expect(formatoPotencia(67, "MW")).toBe(formatoMW(67));
    expect(formatoEnergia(57.8, "MW")).toBe(formatoMWh(57.8));
    expect(formatoPotencia(null, "kW")).toBe("—");
  });
});

describe("formato es-CO", () => {
  test("potencia en MW con un decimal y coma decimal", () => {
    expect(formatoMW(67)).toBe("67,0 MW");
    expect(formatoMW(3.95)).toBe("4,0 MW");
  });

  test("energía en MWh con un decimal y coma decimal", () => {
    expect(formatoMWh(57.8)).toBe("57,8 MWh");
  });

  test("miles con punto", () => {
    expect(formatoNumero(202526.6, 1)).toBe("202.526,6");
    expect(formatoMW(1500)).toBe("1.500,0 MW");
  });

  test("fecha ISO a dd/mm/aaaa sin corrimiento por zona horaria", () => {
    expect(formatoFecha("2026-10-19")).toBe("19/10/2026");
    expect(formatoFecha("2026-01-01")).toBe("01/01/2026");
  });

  test("valores vacíos o inválidos se muestran como guion", () => {
    expect(formatoMW(null)).toBe("—");
    expect(formatoMWh(Number.NaN)).toBe("—");
    expect(formatoFecha("")).toBe("—");
    expect(formatoFecha("19/10/2026")).toBe("—");
  });
});
