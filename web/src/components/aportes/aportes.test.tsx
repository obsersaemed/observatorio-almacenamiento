// T11 · CA-08.1, CA-12.1: lista de pendientes y comparación lado a lado.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { AporteFila } from "@/lib/aportes-admin";
import { Comparacion } from "./comparacion";
import { ListaAportes } from "./lista";

const aporte = (cambios: Partial<AporteFila>): AporteFila => ({
  id: 7,
  tipo: "Noticia",
  registro_afectado: null,
  descripcion: "Nueva subasta",
  datos: {},
  fuente: "https://www.ejemplo.co/nota",
  origen: "usuario",
  agente: null,
  publicacion: "Pendiente",
  creado_en: "2026-10-19T15:00:00Z",
  ...cambios,
});

describe("ListaAportes", () => {
  test("muestra tipo, origen, fecha y fuente, con acceso al detalle (CA-12.1)", () => {
    render(
      <ListaAportes
        aportes={[aporte({}), aporte({ id: 8, tipo: "Norma", origen: "agente", agente: "ficha-normativa" })]}
      />,
    );
    const filas = screen.getAllByRole("row").slice(1);
    expect(filas).toHaveLength(2);
    expect(within(filas[0]).getByText("Noticia")).toBeInTheDocument();
    expect(within(filas[0]).getByText("Usuario")).toBeInTheDocument();
    expect(within(filas[0]).getByText("19/10/2026")).toBeInTheDocument();
    expect(within(filas[0]).getByRole("link", { name: "ejemplo.co" })).toHaveAttribute("href", "https://www.ejemplo.co/nota");
    expect(within(filas[1]).getByText("Agente: ficha-normativa")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: /revisar/i })).toHaveAttribute("href", "/admin/8");
  });

  test("sin pendientes lo dice", () => {
    render(<ListaAportes aportes={[]} />);
    expect(screen.getByText(/no hay aportes pendientes/i)).toBeInTheDocument();
  });
});

describe("Comparacion (CA-08.1, RNF-04)", () => {
  test("muestra el nombre legible del campo y los valores lado a lado, y resalta lo que cambia", () => {
    render(
      <Comparacion
        filas={[
          { campo: "potencia_nominal_mw", etiqueta: "Potencia nominal [MW]", actual: "7", propuesto: "4,5", cambia: true },
          { campo: "estado", etiqueta: "Estado", actual: "En operación", propuesto: "En operación", cambia: false },
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Valor actual" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Propuesto" })).toBeInTheDocument();
    const fila = screen.getByRole("row", { name: /Potencia nominal \[MW\]/ });
    expect(within(fila).getByText("7")).toBeInTheDocument();
    expect(within(fila).getByText("4,5")).toBeInTheDocument();
    expect(fila).toHaveAttribute("data-cambia", "true");
    expect(screen.queryByText("potencia_nominal_mw")).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Estado/ })).toHaveAttribute("data-cambia", "false");
  });
});
