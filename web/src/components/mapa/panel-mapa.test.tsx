// 007 · T15 · RF-16, RF-18 · CA-16.1, CA-16.2, CA-18.1: pestañas del mapa («Gran escala» y
// «Detrás del medidor»). El mapa (WebGL) se simula. Datos ficticios.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";

vi.mock("./mapa-diferido", () => ({
  MapaDiferido: ({ proyectos }: { proyectos: { nombre: string }[] }) => (
    <ul aria-label="Puntos del mapa">
      {proyectos.map((p) => (
        <li key={p.nombre}>{p.nombre}</li>
      ))}
    </ul>
  ),
}));

const { PanelMapa } = await import("./panel-mapa");

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 7, capacidad_maxima_mwh: 3.9, ...f,
});
const proyectos = [fila({ nombre: "Uno" }), fila({ nombre: "Dos" })].map(aProyectoMapa);

const montar = () => render(<PanelMapa proyectos={proyectos} seleccionado={null} onSeleccionar={vi.fn()} />);
const mapa = () => screen.queryByRole("list", { name: "Puntos del mapa" });

describe("PanelMapa", () => {
  test("pestañas «Tipo de almacenamiento» con «Gran escala» elegida y el mapa visible (CA-16.1)", () => {
    montar();
    const lista = screen.getByRole("tablist", { name: "Tipo de almacenamiento" });
    expect(lista).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Gran escala", "Detrás del medidor"]);
    expect(screen.getByRole("tab", { name: "Gran escala" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toContainElement(mapa());
    expect(mapa()).toBeInTheDocument();
  });

  test("«Detrás del medidor» muestra el aviso sin mapa; al volver, el mapa reaparece (CA-18.1)", () => {
    montar();
    fireEvent.click(screen.getByRole("tab", { name: "Detrás del medidor" }));
    expect(screen.getByRole("tab", { name: "Detrás del medidor" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Sección en construcción" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aquí se publicarán los sistemas de baterías instalados en usuarios (industria, comercio y hogares), detrás del medidor. Los datos están en preparación.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tabpanel").querySelector("svg.lucide")).not.toBeNull();
    expect(mapa()).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Gran escala" }));
    expect(mapa()).toBeInTheDocument();
    expect(screen.queryByText("Sección en construcción")).toBeNull();
  });

  test("las flechas cambian de pestaña y mueven el foco (CA-16.2)", () => {
    montar();
    const gran = screen.getByRole("tab", { name: "Gran escala" });
    gran.focus();
    fireEvent.keyDown(gran, { key: "ArrowRight" });
    const detras = screen.getByRole("tab", { name: "Detrás del medidor" });
    expect(detras).toHaveAttribute("aria-selected", "true");
    expect(detras).toHaveFocus();
    fireEvent.keyDown(detras, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Gran escala" })).toHaveAttribute("aria-selected", "true");
    expect(mapa()).toBeInTheDocument();
  });
});
