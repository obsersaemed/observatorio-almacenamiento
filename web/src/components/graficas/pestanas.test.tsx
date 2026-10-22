// 006 · T02 · RNF-03, CA-03.2: pestañas accesibles de las gráficas.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Pestanas } from "./pestanas";

const opciones = [
  { id: "mw", texto: "Potencia [MW]" },
  { id: "mwh", texto: "Energía [MWh]" },
  { id: "h", texto: "Duración [h]" },
];

describe("Pestanas", () => {
  test("tablist con la pestaña activa marcada y solo ella en el orden de Tab", () => {
    render(<Pestanas etiqueta="Medida" opciones={opciones} activa="mwh" onCambiar={vi.fn()} idPanel="panel" />);
    expect(screen.getByRole("tablist", { name: "Medida" })).toBeInTheDocument();
    const pestanas = screen.getAllByRole("tab");
    expect(pestanas.map((p) => p.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    expect(pestanas.map((p) => p.tabIndex)).toEqual([-1, 0, -1]);
    expect(pestanas[1]).toHaveAttribute("aria-controls", "panel");
  });

  test("un clic cambia la pestaña", () => {
    const onCambiar = vi.fn();
    render(<Pestanas etiqueta="Medida" opciones={opciones} activa="mw" onCambiar={onCambiar} idPanel="panel" />);
    fireEvent.click(screen.getByRole("tab", { name: "Duración [h]" }));
    expect(onCambiar).toHaveBeenCalledWith("h");
  });

  test("las flechas cambian la pestaña y mueven el foco, en ciclo", () => {
    const onCambiar = vi.fn();
    const { rerender } = render(<Pestanas etiqueta="Medida" opciones={opciones} activa="mw" onCambiar={onCambiar} idPanel="panel" />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Potencia [MW]" }), { key: "ArrowRight" });
    expect(onCambiar).toHaveBeenLastCalledWith("mwh");
    expect(screen.getByRole("tab", { name: "Energía [MWh]" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Potencia [MW]" }), { key: "ArrowLeft" });
    expect(onCambiar).toHaveBeenLastCalledWith("h");
    rerender(<Pestanas etiqueta="Medida" opciones={opciones} activa="h" onCambiar={onCambiar} idPanel="panel" />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Duración [h]" }), { key: "ArrowRight" });
    expect(onCambiar).toHaveBeenLastCalledWith("mw");
  });
});
