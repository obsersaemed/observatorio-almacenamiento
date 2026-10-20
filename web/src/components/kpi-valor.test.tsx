// RF-17 · CA-17.1: los KPI se animan, salvo con movimiento reducido.
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Aparecer } from "./aparecer";
import { KpiValor } from "./kpi-valor";

function preferirMovimientoReducido(reducir: boolean) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: reducir && consulta.includes("prefers-reduced-motion"),
    media: consulta,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("KpiValor", () => {
  test("con movimiento reducido muestra el valor final de inmediato y no anima", () => {
    preferirMovimientoReducido(true);
    render(<KpiValor valor={17} unidad="MW" />);
    const visible = screen.getByTestId("kpi-valor");
    expect(visible).toHaveTextContent("17,0 MW");
    expect(visible).toHaveAttribute("data-animado", "false");
  });

  test("sin la preferencia anima el conteo y termina en el valor final", async () => {
    preferirMovimientoReducido(false);
    render(<KpiValor valor={10.8} unidad="MWh" />);
    const visible = screen.getByTestId("kpi-valor");
    expect(visible).toHaveAttribute("data-animado", "true");
    await vi.waitFor(() => expect(visible).toHaveTextContent("10,8 MWh"), { timeout: 3000 });
  });

  test("los lectores de pantalla leen siempre el valor final, no el conteo", () => {
    preferirMovimientoReducido(false);
    render(<KpiValor valor={1500} unidad={null} />);
    expect(screen.getByText("1.500", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByTestId("kpi-valor")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Aparecer", () => {
  test("con movimiento reducido no aplica estilos de animación", () => {
    preferirMovimientoReducido(true);
    render(<Aparecer>contenido</Aparecer>);
    const caja = screen.getByText("contenido");
    expect(caja).toHaveAttribute("data-animado", "false");
    expect(caja.getAttribute("style") ?? "").not.toMatch(/opacity|transform/);
  });

  test("sin la preferencia entra con animación", () => {
    preferirMovimientoReducido(false);
    render(<Aparecer>contenido</Aparecer>);
    expect(screen.getByText("contenido")).toHaveAttribute("data-animado", "true");
  });
});
