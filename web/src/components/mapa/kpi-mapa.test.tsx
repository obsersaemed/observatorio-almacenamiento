// 002 · T12 · RF-11, CA-11.1: KPI «Instalado» y «según filtros», MW y MWh por separado.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { KpiMapa } from "./kpi-mapa";

describe("KpiMapa", () => {
  test("dos grupos; MW y MWh en tarjetas distintas; el filtrado aclara que suma todos los estados", () => {
    render(<KpiMapa kpi={{ instalado: { mw: 17, mwh: 12.8 }, filtrado: { total: 2, mw: 100, mwh: 390 } }} />);

    const instalado = screen.getByRole("region", { name: "Instalado (en operación)" });
    expect(within(instalado).getByRole("group", { name: "Potencia instalada [MW]" })).toHaveTextContent("17,0 MW");
    expect(within(instalado).getByRole("group", { name: "Energía instalada [MWh]" })).toHaveTextContent("12,8 MWh");

    const filtrado = screen.getByRole("region", { name: "Según filtros (todos los estados)" });
    expect(within(filtrado).getByRole("group", { name: "Proyectos según filtros" })).toHaveTextContent("2");
    expect(within(filtrado).getByRole("group", { name: "Potencia según filtros [MW] (todos los estados)" })).toHaveTextContent("100,0 MW");
    expect(within(filtrado).getByRole("group", { name: "Energía según filtros [MWh] (todos los estados)" })).toHaveTextContent("390,0 MWh");
  });

  test("con un resultado vacío los KPI filtrados muestran 0 (CA-12.1)", () => {
    render(<KpiMapa kpi={{ instalado: { mw: 17, mwh: 12.8 }, filtrado: { total: 0, mw: 0, mwh: 0 } }} />);
    const filtrado = screen.getByRole("region", { name: "Según filtros (todos los estados)" });
    expect(within(filtrado).getByRole("group", { name: "Proyectos según filtros" })).toHaveTextContent("0");
    expect(within(filtrado).getByRole("group", { name: /Potencia/ })).toHaveTextContent("0,0 MW");
  });
});
