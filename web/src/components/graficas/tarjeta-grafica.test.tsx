// 006 · T03 · RF-01, RF-08, RF-09: tarjeta común de las gráficas.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TarjetaGrafica } from "./tarjeta-grafica";

const base = {
  titulo: "Capacidad por estado",
  pestanas: { etiqueta: "Medida", opciones: [{ id: "mw", texto: "Potencia [MW]" }, { id: "mwh", texto: "Energía [MWh]" }], activa: "mw", onCambiar: vi.fn() },
  tabla: { encabezados: ["Estado", "Potencia [MW]"], filas: [["En operación", "17,0"], ["Inactivo", "—"]] },
};

describe("TarjetaGrafica", () => {
  test("una región con su título, las pestañas y el dibujo (RF-01)", () => {
    render(<TarjetaGrafica {...base} vacia={false}><svg data-testid="dibujo" /></TarjetaGrafica>);
    const region = screen.getByRole("region", { name: "Capacidad por estado" });
    expect(within(region).getByRole("tablist", { name: "Medida" })).toBeInTheDocument();
    expect(within(region).getByRole("tabpanel")).toContainElement(screen.getByTestId("dibujo"));
    expect(within(region).queryByRole("table")).toBeNull();
  });

  test("«Ver como tabla» muestra la tabla equivalente y vuelve a la gráfica (RF-08)", () => {
    render(<TarjetaGrafica {...base} vacia={false}><svg data-testid="dibujo" /></TarjetaGrafica>);
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    const tabla = screen.getByRole("table", { name: "Capacidad por estado" });
    expect(within(tabla).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Estado", "Potencia [MW]"]);
    expect(within(tabla).getAllByRole("row").slice(1).map((r) => r.textContent)).toEqual(["En operación17,0", "Inactivo—"]);
    expect(screen.queryByTestId("dibujo")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ver como gráfica" }));
    expect(screen.getByTestId("dibujo")).toBeInTheDocument();
  });

  test("sin datos muestra el aviso y no el dibujo ni la tabla (RF-09)", () => {
    render(<TarjetaGrafica {...base} vacia><svg data-testid="dibujo" /></TarjetaGrafica>);
    expect(screen.getByText("Sin datos para estos filtros")).toBeInTheDocument();
    expect(screen.queryByTestId("dibujo")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ver como tabla" })).toBeNull();
  });

  test("muestra una nota debajo cuando la hay (RF-06)", () => {
    render(<TarjetaGrafica {...base} vacia={false} nota="1 proyecto sin año de FPO no aparece en esta gráfica"><svg /></TarjetaGrafica>);
    expect(screen.getByText("1 proyecto sin año de FPO no aparece en esta gráfica")).toBeInTheDocument();
  });
});
