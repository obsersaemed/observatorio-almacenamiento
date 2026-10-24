import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Inicio, PanelKpi } from "./inicio";

const kpi = {
  total: 7,
  porEstado: { "En operación": 3, "En construcción": 1, Anunciado: 2, Inactivo: 1 },
  mwOperacion: 17,
  mwhOperacion: 10.8,
};

describe("inicio", () => {
  test("muestra el título del observatorio", () => {
    render(<Inicio panelKpi={<PanelKpi kpi={kpi} />} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Observatorio de Sistemas de Almacenamiento de Energía en Colombia" }),
    ).toBeInTheDocument();
  });

  test("potencia y energía en operación van en tarjetas separadas con coma decimal (CA-02.1)", () => {
    render(<Inicio panelKpi={<PanelKpi kpi={kpi} />} />);
    const potencia = screen.getByRole("group", { name: "Potencia en operación [MW]" });
    const energia = screen.getByRole("group", { name: "Energía en operación [MWh]" });
    expect(potencia).not.toBe(energia);
    expect(within(potencia).getByText("17,0 MW", { selector: ".sr-only" })).toBeInTheDocument();
    expect(within(energia).getByText("10,8 MWh", { selector: ".sr-only" })).toBeInTheDocument();
  });

  test("muestra el número de proyectos por estado", () => {
    render(<Inicio panelKpi={<PanelKpi kpi={kpi} />} />);
    const estados = screen.getByRole("group", { name: "Proyectos por estado" });
    expect(within(estados).getByText("En operación").nextSibling).toHaveTextContent("3");
    expect(within(estados).getByText("Anunciado").nextSibling).toHaveTextContent("2");
  });

  test("da acceso a las cuatro secciones", () => {
    render(<Inicio panelKpi={<PanelKpi kpi={kpi} />} />);
    for (const [nombre, ruta] of [
      ["Implementación de SAEB en Colombia", "/mapa"],
      ["Almacenamiento de energía en vehículos eléctricos", "/vehiculos"],
      ["Evolución normativa de los SAEB", "/normativa"],
      ["Noticias", "/noticias"],
    ]) {
      expect(screen.getByRole("link", { name: new RegExp(nombre) })).toHaveAttribute("href", ruta);
    }
  });

  test("invita a aportar datos", () => {
    render(<Inicio panelKpi={<PanelKpi kpi={kpi} />} />);
    expect(screen.getByRole("link", { name: /aportar/i })).toHaveAttribute("href", "/aportar");
  });
});
