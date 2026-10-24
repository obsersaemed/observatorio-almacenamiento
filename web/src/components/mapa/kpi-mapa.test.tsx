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
