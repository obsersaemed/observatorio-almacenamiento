// 007 · RF-11, CA-11.2: el KPI muestra el valor final desde el primer render, sin conteo
// (antes, RF-17 de la 001, se animaba).
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
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

  test("sin la preferencia también muestra el valor final desde el primer render, sin conteo", async () => {
    preferirMovimientoReducido(false);
    render(<KpiValor valor={10.8} unidad="MWh" />);
    const visible = screen.getByTestId("kpi-valor");
    expect(visible).toHaveTextContent("10,8 MWh");
    expect(visible).toHaveAttribute("data-animado", "false");
    await new Promise((r) => setTimeout(r, 100));
    expect(visible).toHaveTextContent("10,8 MWh");
  });

  test("los lectores de pantalla leen siempre el valor final, no el conteo", () => {
    preferirMovimientoReducido(false);
    render(<KpiValor valor={1500} unidad={null} />);
    expect(screen.getByText("1.500", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByTestId("kpi-valor")).toHaveAttribute("aria-hidden", "true");
  });
});
