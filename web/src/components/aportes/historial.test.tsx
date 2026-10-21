// T19 · RF-11 · CA-11.1: historial consultable en /admin.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { cambiosDe, type FilaHistorial } from "@/lib/historial";
import { TablaHistorial } from "./historial";

const fila = (cambios: Partial<FilaHistorial>): FilaHistorial => ({
  id: 1,
  tabla: "proyectos",
  registro: "BESS Termozipa",
  operacion: "UPDATE",
  antes: { nombre: "BESS Termozipa", potencia_nominal_mw: 7, actualizado_en: "2026-10-19T00:00:00Z" },
  despues: { nombre: "BESS Termozipa", potencia_nominal_mw: 5.25, actualizado_en: "2026-10-20T00:00:00Z" },
  fuente: "https://www.ejemplo.co/correccion",
  editor: "obsersae_med@unal.edu.co",
  aporte_id: 42,
  creado_en: "2026-10-20T15:00:00Z",
  ...cambios,
});

describe("cambiosDe", () => {
  test("solo los campos que cambiaron, con nombre legible y en es-CO, sin columnas internas", () => {
    expect(cambiosDe(fila({}))).toEqual([{ etiqueta: "Potencia nominal [MW]", antes: "7", despues: "5,25" }]);
  });
  test("en un alta, todos los campos con valor aparecen como nuevos", () => {
    const alta = cambiosDe(fila({ operacion: "INSERT", antes: null, despues: { nombre: "Nuevo", estado: "Anunciado" } }));
    expect(alta).toEqual([
      { etiqueta: "Nombre", antes: "—", despues: "Nuevo" },
      { etiqueta: "Estado", antes: "—", despues: "Anunciado" },
    ]);
  });
});

describe("TablaHistorial (CA-11.1)", () => {
  test("muestra fecha, registro, cambios, editor, aporte de origen y fuente", () => {
    render(<TablaHistorial filas={[fila({})]} />);
    const [, f] = screen.getAllByRole("row");
    expect(within(f).getByText("20/10/2026")).toBeInTheDocument();
    expect(within(f).getByText(/BESS Termozipa/)).toBeInTheDocument();
    expect(within(f).getByText(/Potencia nominal \[MW\]: 7 → 5,25/)).toBeInTheDocument();
    expect(within(f).getByText("obsersae_med@unal.edu.co")).toBeInTheDocument();
    expect(within(f).getByRole("link", { name: "N.º 42" })).toHaveAttribute("href", "/admin/42");
    expect(within(f).getByRole("link", { name: "ejemplo.co" })).toHaveAttribute("href", "https://www.ejemplo.co/correccion");
  });

  test("los cambios sin editor (importación) y sin aporte se indican", () => {
    render(<TablaHistorial filas={[fila({ editor: null, aporte_id: null, operacion: "INSERT", antes: null })]} />);
    const [, f] = screen.getAllByRole("row");
    expect(within(f).getByText("Importación o sistema")).toBeInTheDocument();
    expect(within(f).getByText("Alta")).toBeInTheDocument();
  });

  test("sin cambios lo dice", () => {
    render(<TablaHistorial filas={[]} />);
    expect(screen.getByText(/no hay cambios registrados/i)).toBeInTheDocument();
  });
});
