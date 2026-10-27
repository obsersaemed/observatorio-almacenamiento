// 008 · T06 · RF-03, RF-05: el panel del mapa ya no tiene pestañas internas (las reemplazan los
// botones de segmento debajo del título, que cambian toda la página). Antes: 007 · T15
// (CA-16.1, CA-16.2, CA-18.1). El mapa (WebGL) se simula. Datos ficticios.
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";

vi.mock("./mapa-diferido", () => ({
  MapaDiferido: ({ proyectos, unidades }: { proyectos: { nombre: string }[]; unidades?: string }) => (
    <ul aria-label="Puntos del mapa" data-unidades={unidades ?? ""}>
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

const mapa = () => screen.queryByRole("list", { name: "Puntos del mapa" });

describe("PanelMapa", () => {
  test("muestra el mapa en una región «Mapa», sin pestañas internas", () => {
    render(<PanelMapa proyectos={proyectos} seleccionado={null} onSeleccionar={vi.fn()} />);
    expect(screen.getByRole("region", { name: "Mapa" })).toContainElement(mapa());
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByText("Sección en construcción")).toBeNull();
  });

  test("pasa las unidades al mapa, para la tarjeta del proyecto (CA-05.2)", () => {
    render(<PanelMapa proyectos={proyectos} seleccionado={null} onSeleccionar={vi.fn()} unidades="kW" />);
    expect(mapa()).toHaveAttribute("data-unidades", "kW");
  });
});
