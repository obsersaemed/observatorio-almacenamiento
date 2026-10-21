// 002 · T12 · RF-08, RNF-01, CA-08.2: panel de filtros. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";
import { Filtros } from "./filtros";

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 1, capacidad_maxima_mwh: 1, ...f,
});
const proyectos = [
  fila({ nombre: "A", departamento: "Cundinamarca", municipio: "Tocancipá" }),
  fila({ nombre: "B", departamento: "Cundinamarca", municipio: "Paratebueno", estado: "Anunciado" }),
  fila({ nombre: "C" }),
].map(aProyectoMapa);

describe("Filtros", () => {
  test("ofrece los 7 filtros con el conteo de cada opción", () => {
    render(<Filtros proyectos={proyectos} filtros={{}} onCambiar={vi.fn()} />);
    const grupos = screen.getAllByRole("group").filter((g) => g.tagName === "FIELDSET").map((g) => g.getAttribute("aria-label") ?? g.querySelector("legend")?.textContent);
    expect(grupos).toEqual(["Estado", "Departamento", "Municipio", "Servicios", "Operador", "Tecnología", "Año de FPO"]);
    const departamento = screen.getByRole("group", { name: "Departamento" });
    expect(within(departamento).getByRole("checkbox", { name: "Cundinamarca (2)" })).not.toBeChecked();
    expect(within(screen.getByRole("group", { name: "Servicios" })).getByRole("checkbox", { name: "Sin dato (3)" })).toBeInTheDocument();
  });

  test("marcar una opción agrega el valor al filtro", () => {
    const onCambiar = vi.fn();
    render(<Filtros proyectos={proyectos} filtros={{ estado: ["Anunciado"] }} onCambiar={onCambiar} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Cundinamarca (1)" }));
    expect(onCambiar).toHaveBeenCalledWith({ estado: ["Anunciado"], departamento: ["Cundinamarca"] });
  });

  test("desmarcar quita el valor", () => {
    const onCambiar = vi.fn();
    render(<Filtros proyectos={proyectos} filtros={{ estado: ["Anunciado", "En operación"] }} onCambiar={onCambiar} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /^Anunciado/ }));
    expect(onCambiar).toHaveBeenCalledWith({ estado: ["En operación"] });
  });

  test("con un departamento elegido, el municipio solo lista los de ese departamento (CA-08.2)", () => {
    render(<Filtros proyectos={proyectos} filtros={{ departamento: ["Cundinamarca"] }} onCambiar={vi.fn()} />);
    const municipio = screen.getByRole("group", { name: "Municipio" });
    expect(within(municipio).getAllByRole("checkbox").map((c) => c.getAttribute("aria-label") ?? c.closest("label")?.textContent)).toEqual([
      "Paratebueno (1)",
      "Tocancipá (1)",
    ]);
  });

  test("el panel se puede plegar y dice cuántos filtros hay activos (RNF-01)", () => {
    render(<Filtros proyectos={proyectos} filtros={{ estado: ["Anunciado"], departamento: ["Meta"] }} onCambiar={vi.fn()} />);
    const resumen = screen.getByText(/Filtros/, { selector: "summary" });
    expect(resumen).toHaveTextContent("Filtros (2 activos)");
  });

  test("T19 · un valor elegido sin proyectos con los demás filtros sigue visible con (0) y se puede quitar (O-2)", () => {
    const onCambiar = vi.fn();
    render(<Filtros proyectos={proyectos} filtros={{ departamento: ["Antioquia"], estado: ["Inactivo"] }} onCambiar={onCambiar} />);
    const antioquia = screen.getByRole("checkbox", { name: "Antioquia (0)" });
    expect(antioquia).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Inactivo (0)" })).toBeChecked();
    fireEvent.click(antioquia);
    expect(onCambiar).toHaveBeenCalledWith({ estado: ["Inactivo"] });
  });
});
