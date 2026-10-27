// 002 · T12, T19, T23 · RF-08, RNF-01, CA-08.2: filtros de /mapa como desplegables de
// selección múltiple. Datos ficticios.
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

// 007 · T13: el panel empieza recogido; los desplegables están dentro y se despliega primero.
const abrirPanel = () => {
  const principal = screen.queryByRole("button", { name: /^Filtros/ });
  if (principal?.getAttribute("aria-expanded") === "false") fireEvent.click(principal);
};
const boton = (titulo: string) => {
  abrirPanel();
  return screen.getByRole("button", { name: new RegExp(`^${titulo} `) });
};
const abrir = (titulo: string) => fireEvent.click(boton(titulo));

describe("Filtros", () => {
  test("ofrece los 7 filtros cerrados, cada uno con su título y «Todas»", () => {
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{}} onCambiar={vi.fn()} />);
    abrirPanel();
    const grupos = screen.getAllByRole("group").filter((g) => g.tagName === "FIELDSET").map((g) => g.querySelector("legend")?.textContent);
    expect(grupos).toEqual(["Estado", "Departamento", "Municipio", "Servicios", "Operador", "Tecnología", "Año de FPO"]);
    expect(boton("Estado")).toHaveAccessibleName("Estado Todas");
    expect(boton("Estado")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  test("al abrirse muestra «Todas», un buscador y cada opción con su conteo", () => {
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{}} onCambiar={vi.fn()} />);
    abrir("Departamento");
    expect(boton("Departamento")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("checkbox", { name: "Todas" })).toBeChecked();
    expect(screen.getByRole("searchbox", { name: "Buscar en Departamento" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Cundinamarca (2)" })).not.toBeChecked();
    abrir("Servicios");
    expect(screen.getByRole("checkbox", { name: "Sin dato (3)" })).toBeInTheDocument();
  });

  test("marcar una opción agrega el valor al filtro", () => {
    const onCambiar = vi.fn();
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ estado: ["Anunciado"] }} onCambiar={onCambiar} />);
    abrir("Departamento");
    fireEvent.click(screen.getByRole("checkbox", { name: "Cundinamarca (1)" }));
    expect(onCambiar).toHaveBeenCalledWith({ estado: ["Anunciado"], departamento: ["Cundinamarca"] });
  });

  test("desmarcar quita el valor", () => {
    const onCambiar = vi.fn();
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ estado: ["Anunciado", "En operación"] }} onCambiar={onCambiar} />);
    abrir("Estado");
    fireEvent.click(screen.getByRole("checkbox", { name: /^Anunciado/ }));
    expect(onCambiar).toHaveBeenCalledWith({ estado: ["En operación"] });
  });

  test("«Todas» limpia el filtro", () => {
    const onCambiar = vi.fn();
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ estado: ["Anunciado"], departamento: ["Meta"] }} onCambiar={onCambiar} />);
    abrir("Estado");
    const todas = screen.getByRole("checkbox", { name: "Todas" });
    expect(todas).not.toBeChecked();
    fireEvent.click(todas);
    expect(onCambiar).toHaveBeenCalledWith({ departamento: ["Meta"] });
  });

  test("el botón dice el valor elegido o cuántos hay elegidos", () => {
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ estado: ["Anunciado"], departamento: ["Meta", "Cundinamarca"] }} onCambiar={vi.fn()} />);
    expect(boton("Estado")).toHaveAccessibleName("Estado Anunciado");
    expect(boton("Departamento")).toHaveAccessibleName("Departamento 2 seleccionados");
  });

  test("el buscador acota las opciones", () => {
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{}} onCambiar={vi.fn()} />);
    abrir("Departamento");
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en Departamento" }), { target: { value: "cun" } });
    const opciones = screen.getAllByRole("checkbox").map((c) => c.getAttribute("aria-label") ?? "Todas");
    expect(opciones).toEqual(["Todas", "Cundinamarca (2)"]);
  });

  test("Escape cierra y devuelve el foco al botón; un clic afuera también cierra", () => {
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{}} onCambiar={vi.fn()} />);
    abrir("Estado");
    fireEvent.keyDown(screen.getByRole("searchbox", { name: "Buscar en Estado" }), { key: "Escape" });
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(boton("Estado")).toHaveFocus();
    abrir("Estado");
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  test("con un departamento elegido, el municipio solo lista los de ese departamento (CA-08.2)", () => {
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ departamento: ["Cundinamarca"] }} onCambiar={vi.fn()} />);
    abrir("Municipio");
    const lista = screen.getByRole("group", { name: "Opciones de Municipio" });
    expect(within(lista).getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"))).toEqual([
      "Paratebueno (1)",
      "Tocancipá (1)",
    ]);
  });

  test("007 · T13 · el panel empieza recogido, dice cuántos filtros hay y cada uno es un chip que se quita (CA-08.1, CA-08.3)", () => {
    const onCambiar = vi.fn();
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ estado: ["Anunciado"], departamento: ["Meta"] }} onCambiar={onCambiar} />);
    const principal = screen.getByRole("button", { name: "Filtros (2)" });
    expect(principal).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /^Estado / })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("3 proyectos");
    fireEvent.click(screen.getByRole("button", { name: "Quitar filtro Anunciado" }));
    expect(onCambiar).toHaveBeenCalledWith({ departamento: ["Meta"] });
    fireEvent.click(screen.getByRole("button", { name: "Quitar filtro Meta" }));
    expect(onCambiar).toHaveBeenLastCalledWith({ estado: ["Anunciado"] });
  });

  test("T19 · un valor elegido sin proyectos con los demás filtros sigue visible con (0) y se puede quitar (O-2)", () => {
    const onCambiar = vi.fn();
    render(<Filtros conteo="3 proyectos" proyectos={proyectos} filtros={{ departamento: ["Antioquia"], estado: ["Inactivo"] }} onCambiar={onCambiar} />);
    abrir("Estado");
    expect(screen.getByRole("checkbox", { name: "Inactivo (0)" })).toBeChecked();
    abrir("Departamento");
    const antioquia = screen.getByRole("checkbox", { name: "Antioquia (0)" });
    expect(antioquia).toBeChecked();
    fireEvent.click(antioquia);
    expect(onCambiar).toHaveBeenCalledWith({ estado: ["Inactivo"] });
  });
});
