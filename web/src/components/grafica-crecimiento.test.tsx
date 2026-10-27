// 007 · T08 · RF-10, RF-11, RNF-02, RNF-03 · CA-10.1, CA-10.2, CA-11.1: gráfica de crecimiento
// del inicio. Barras FICTICIAS de prueba (no son datos reales).
import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GraficaCrecimiento } from "./grafica-crecimiento";

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

const barras = [
  { anio: 2021, mw: 7, proyeccion: false },
  { anio: 2025, mw: 17, proyeccion: false },
  { anio: 2027, mw: 34, proyeccion: true },
];

const barrasDibujadas = () => screen.getAllByTestId("barra-crecimiento");

describe("GraficaCrecimiento", () => {
  test("va en una tarjeta con su título", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    expect(screen.getByRole("heading", { name: "Crecimiento del almacenamiento [MW acumulados]" })).toBeInTheDocument();
  });

  test("una barra por año con su valor en formato es-CO y su año (CA-10.1)", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    const dibujadas = barrasDibujadas();
    expect(dibujadas).toHaveLength(3);
    expect(dibujadas[1]).toHaveTextContent("17,0");
    expect(dibujadas[1]).toHaveTextContent("2025");
    expect(dibujadas[2]).toHaveTextContent("34,0");
  });

  test("las barras de proyección son de acento y las demás grises, con la nota (CA-10.2)", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    const columnas = barrasDibujadas().map((b) => within(b).getByTestId("columna"));
    expect(columnas[0].style.backgroundColor).toBe("var(--brand-ink)");
    expect(columnas[1].style.backgroundColor).toBe("var(--brand-ink)");
    expect(columnas[2].style.backgroundColor).toBe("var(--accent)");
    expect(
      screen.getByText("Las barras naranja son proyección: suman proyectos en construcción y anunciados según su año de FPO."),
    ).toBeInTheDocument();
  });

  test("la altura es proporcional al máximo", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    const columnas = barrasDibujadas().map((b) => within(b).getByTestId("columna"));
    expect(columnas[2].style.height).toBe("100%");
    expect(columnas[0].style.height).toBe(`${(7 / 34) * 100}%`);
  });

  test("con movimiento reducido las barras aparecen en su altura final, sin transición (CA-11.1)", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    for (const b of barrasDibujadas()) {
      const columna = within(b).getByTestId("columna");
      expect(columna.style.transition).toBe("none");
      expect(columna.style.height).not.toBe("0%");
    }
  });

  test("sin la preferencia crecen una sola vez con una transición (no hay bucle)", async () => {
    preferirMovimientoReducido(false);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    const columna = within(barrasDibujadas()[2]).getByTestId("columna");
    await waitFor(() => expect(columna.style.height).toBe("100%"));
    expect(columna.style.transition).toContain("height");
    for (const b of barrasDibujadas()) {
      const c = within(b).getByTestId("columna");
      expect(c.getAttribute("style") ?? "").not.toMatch(/infinite/);
      expect(c.className).not.toMatch(/animate-/);
    }
  });

  test("hay una tabla equivalente para lectores de pantalla", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={0} />);
    const tabla = screen.getByRole("table", { name: /Crecimiento del almacenamiento/ });
    // T22 (RNF-01): la tabla va dentro de un contenedor sr-only. Con sr-only en la propia
    // <table>, su ancho mínimo (388 px) ensanchaba la página a 375 px.
    expect(tabla).not.toHaveClass("sr-only");
    expect(tabla.parentElement).toHaveClass("sr-only");
    const filas = within(tabla).getAllByRole("row");
    expect(filas).toHaveLength(4);
    expect(filas[3]).toHaveTextContent("2027");
    expect(filas[3]).toHaveTextContent("34,0");
    expect(filas[3]).toHaveTextContent("Proyección");
  });

  test("informa cuántos proyectos no tienen año de FPO", () => {
    preferirMovimientoReducido(true);
    render(<GraficaCrecimiento barras={barras} sinAnio={2} />);
    expect(screen.getByText(/2 proyectos sin año de FPO no se incluyen/)).toBeInTheDocument();
  });
});
