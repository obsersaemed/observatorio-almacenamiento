// 006 · T04 · RF-03, RF-04, RNF-04, RNF-05, RNF-06: barras horizontales por estado.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";
import { preferirMovimientoReducido, rechartsConTamano } from "./prueba-recharts";

vi.mock("recharts", (original) => rechartsConTamano(original as () => Promise<Record<string, unknown>>));
const { GraficaEstados } = await import("./grafica-estados");

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 1, capacidad_maxima_mwh: 1, ...f,
});
const proyectos = [
  fila({ potencia_nominal_mw: 10, capacidad_maxima_mwh: 20 }),
  fila({ potencia_nominal_mw: 5, capacidad_maxima_mwh: 10 }),
  fila({ estado: "Anunciado", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195 }),
].map(aProyectoMapa);

const filasTabla = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.textContent);

// En jsdom la animación de Recharts no avanza: sin movimiento reducido las barras y sus
// etiquetas no llegan a pintarse. Se prueba el dibujo final con movimiento reducido.
beforeEach(() => preferirMovimientoReducido(true));

describe("GraficaEstados", () => {
  test("pestañas MW, MWh y h; MW por defecto, con unidad en el eje y valores es-CO (CA-03.1)", () => {
    const { container } = render(<GraficaEstados proyectos={proyectos} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Potencia [MW]", "Energía [MWh]", "Duración [h]"]);
    expect(screen.getByRole("tab", { name: "Potencia [MW]" })).toHaveAttribute("aria-selected", "true");
    const textos = [...container.querySelectorAll("svg text")].map((t) => t.textContent);
    expect(textos).toContain("Potencia [MW]");
    expect(textos).toContain("15,0");
    expect(textos).toContain("50,0");
    expect(textos).toContain("En operación");
  });

  test("cada barra tiene el color de su estado, tomado de un token (RNF-05)", () => {
    const { container } = render(<GraficaEstados proyectos={proyectos} />);
    const colores = [...container.querySelectorAll(".recharts-bar-rectangle path")].map((p) => p.getAttribute("fill"));
    expect(colores).toContain("var(--status-op-marker)");
    expect(colores).toContain("var(--status-plan)");
  });

  test("la tabla cambia con la pestaña; la duración es 2,0 h y los vacíos «—» (CA-03.2, CA-04.1)", () => {
    render(<GraficaEstados proyectos={proyectos} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Estado", "Potencia [MW]"]);
    expect(filasTabla()).toEqual(["En operación15,0", "En construcción0,0", "Anunciado50,0", "Inactivo0,0"]);
    fireEvent.click(screen.getByRole("tab", { name: "Energía [MWh]" }));
    expect(screen.getAllByRole("columnheader")[1]).toHaveTextContent("Energía [MWh]");
    expect(filasTabla()[0]).toBe("En operación30,0");
    fireEvent.click(screen.getByRole("tab", { name: "Duración [h]" }));
    expect(filasTabla()).toEqual(["En operación2,0", "En construcción—", "Anunciado3,9", "Inactivo—"]);
  });

  test("sin proyectos muestra el aviso de vacío (RF-09)", () => {
    render(<GraficaEstados proyectos={[]} />);
    expect(screen.getByText("Sin datos para estos filtros")).toBeInTheDocument();
  });

  test("con movimiento reducido no anima; sin la preferencia, sí (RNF-06)", () => {
    const { container, unmount } = render(<GraficaEstados proyectos={proyectos} />);
    expect(container.querySelector("[data-animado]")).toHaveAttribute("data-animado", "false");
    unmount();
    preferirMovimientoReducido(false);
    const otra = render(<GraficaEstados proyectos={proyectos} />);
    expect(otra.container.querySelector("[data-animado]")).toHaveAttribute("data-animado", "true");
  });

  test("las etiquetas de valor van en el color del texto, no en el de la barra (contraste AA)", () => {
    const { container } = render(<GraficaEstados proyectos={proyectos} />);
    const colores = [...container.querySelectorAll(".recharts-label-list text")].map((t) => t.getAttribute("fill"));
    expect(colores.length).toBe(4);
    expect(new Set(colores)).toEqual(new Set(["var(--text-body)"]));
  });

  test("T08 · Duración dibuja «2,0 h», «—» en los estados sin datos y un eje sin marcas repetidas (CA-04.1, RNF-04)", () => {
    const { container } = render(<GraficaEstados proyectos={proyectos.slice(0, 2)} />);
    fireEvent.click(screen.getByRole("tab", { name: "Duración [h]" }));
    const etiquetas = [...container.querySelectorAll(".recharts-label-list text")].map((t) => t.textContent);
    expect(etiquetas).toEqual(["2,0 h", "—", "—", "—"]);
    const marcas = [...container.querySelectorAll(".recharts-xAxis .recharts-cartesian-axis-tick-value")].map((t) => t.textContent);
    expect(new Set(marcas).size).toBe(marcas.length);
    expect(marcas.some((m) => m?.includes(","))).toBe(true);
  });
});

// 008 · T05 · RF-05, RNF-02: en kW y kWh, una medida a la vez (sin compartir eje).
describe("GraficaEstados con unidades (008)", () => {
  const medidor = [
    fila({ potencia_nominal_mw: 0.015, capacidad_maxima_mwh: 0.04 }),
    fila({ estado: "Anunciado", potencia_nominal_mw: 0.03, capacidad_maxima_mwh: 0.119 }),
  ].map(aProyectoMapa);

  test("con unidades=\"kW\": pestañas, eje y tabla en kW y kWh", () => {
    const { container } = render(<GraficaEstados proyectos={medidor} unidades="kW" />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Potencia [kW]", "Energía [kWh]", "Duración [h]"]);
    const textos = [...container.querySelectorAll("svg text")].map((t) => t.textContent);
    expect(textos).toContain("Potencia [kW]");
    expect(textos).toContain("15,0");
    fireEvent.click(screen.getByRole("tab", { name: "Energía [kWh]" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Estado", "Energía [kWh]"]);
    expect(filasTabla()).toEqual(["En operación40,0", "En construcción0,0", "Anunciado119,0", "Inactivo0,0"]);
  });

  test("la duración no cambia con las unidades", () => {
    render(<GraficaEstados proyectos={medidor} unidades="kW" />);
    fireEvent.click(screen.getByRole("tab", { name: "Duración [h]" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(filasTabla()[0]).toBe("En operación2,7");
  });

  test("con unidades=\"MW\" queda como hoy", () => {
    render(<GraficaEstados proyectos={proyectos} unidades="MW" />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Potencia [MW]", "Energía [MWh]", "Duración [h]"]);
  });
});
