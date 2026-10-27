// 007 · RF-11, CA-11.2: Aparecer ya no anima; muestra su contenido sin estilos de transición.
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Aparecer } from "./aparecer";

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

describe("Aparecer", () => {
  test.each([true, false])("con movimiento reducido = %s muestra el contenido sin estilos de transición", (reducir) => {
    preferirMovimientoReducido(reducir);
    render(<Aparecer className="caja">contenido</Aparecer>);
    const caja = screen.getByText("contenido");
    expect(caja).toHaveAttribute("data-animado", "false");
    expect(caja).toHaveClass("caja");
    expect(caja.getAttribute("style") ?? "").not.toMatch(/opacity|transform|transition/);
  });
});
