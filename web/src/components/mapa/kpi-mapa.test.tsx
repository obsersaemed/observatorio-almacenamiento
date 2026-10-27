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
    expect(within(filtrado).getByRole("group", { name: "Proyectos identificados" })).toHaveTextContent("2");
    expect(within(filtrado).getByRole("group", { name: "Potencia total proyectada" })).toHaveTextContent("100,0 MW");
    expect(within(filtrado).getByRole("group", { name: "Capacidad energética total proyectada" })).toHaveTextContent("390,0 MWh");
  });

  test("las dos tarjetas de «Instalado» ocupan todo el ancho de su grupo para que quepa el título", () => {
    render(<KpiMapa kpi={{ instalado: { mw: 17, mwh: 12.8 }, filtrado: { total: 2, mw: 100, mwh: 390 } }} />);
    const instalado = screen.getByRole("region", { name: "Instalado (en operación)" });
    const rejilla = within(instalado).getByRole("group", { name: "Potencia instalada [MW]" }).parentElement!;
    expect(rejilla).toHaveClass("lg:grid-cols-2");
    expect(rejilla).not.toHaveClass("lg:grid-cols-3");
  });

  test("con un resultado vacío los KPI filtrados muestran 0 (CA-12.1)", () => {
    render(<KpiMapa kpi={{ instalado: { mw: 17, mwh: 12.8 }, filtrado: { total: 0, mw: 0, mwh: 0 } }} />);
    const filtrado = screen.getByRole("region", { name: "Según filtros (todos los estados)" });
    expect(within(filtrado).getByRole("group", { name: "Proyectos identificados" })).toHaveTextContent("0");
    expect(within(filtrado).getByRole("group", { name: /Potencia/ })).toHaveTextContent("0,0 MW");
  });
});

// 008 · T05 · RF-05, CA-05.1, CA-05.3: en «Detrás del medidor» los KPI van en kW y kWh.
describe("KpiMapa con unidades (008)", () => {
  const kpi = { instalado: { mw: 0.015, mwh: 0.04 }, filtrado: { total: 3, mw: 0.152, mwh: 0.4 } };

  test("con unidades=\"kW\": kW y kWh en tarjetas separadas, con la unidad en la etiqueta", () => {
    render(<KpiMapa kpi={kpi} unidades="kW" />);
    const instalado = screen.getByRole("region", { name: "Instalado (en operación)" });
    expect(within(instalado).getByRole("group", { name: "Potencia instalada [kW]" })).toHaveTextContent("15,0 kW");
    expect(within(instalado).getByRole("group", { name: "Energía instalada [kWh]" })).toHaveTextContent("40,0 kWh");
    const filtrado = screen.getByRole("region", { name: "Según filtros (todos los estados)" });
    expect(within(filtrado).getByRole("group", { name: "Proyectos identificados" })).toHaveTextContent("3");
    expect(within(filtrado).getByRole("group", { name: "Potencia total proyectada" })).toHaveTextContent("152,0 kW");
    expect(within(filtrado).getByRole("group", { name: "Capacidad energética total proyectada" })).toHaveTextContent("400,0 kWh");
    expect(screen.queryByText(/MWh?$/)).toBeNull();
  });

  test("con unidades=\"MW\" queda como hoy", () => {
    render(<KpiMapa kpi={{ instalado: { mw: 17, mwh: 12.8 }, filtrado: { total: 2, mw: 100, mwh: 390 } }} unidades="MW" />);
    expect(screen.getByRole("group", { name: "Potencia instalada [MW]" })).toHaveTextContent("17,0 MW");
    expect(screen.getByRole("group", { name: "Energía instalada [MWh]" })).toHaveTextContent("12,8 MWh");
  });
});
