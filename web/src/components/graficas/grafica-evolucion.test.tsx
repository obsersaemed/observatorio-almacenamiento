// 006 · T05 · RF-05, RF-06: áreas acumuladas por año de FPO.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";
import { preferirMovimientoReducido, rechartsConTamano } from "./prueba-recharts";

vi.mock("recharts", (original) => rechartsConTamano(original as () => Promise<Record<string, unknown>>));
const { GraficaEvolucion } = await import("./grafica-evolucion");

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 1, capacidad_maxima_mwh: 1, ...f,
});
const proyectos = [
  fila({ fpo: "2024", potencia_nominal_mw: 7, capacidad_maxima_mwh: 4 }),
  fila({ fpo: "2021", potencia_nominal_mw: 1, capacidad_maxima_mwh: 2 }),
  fila({ fpo: "2030", estado: "Anunciado", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195 }),
  fila({ fpo: "2019", estado: "Inactivo", potencia_nominal_mw: 50, capacidad_maxima_mwh: 45 }),
  fila({ fpo: "" }),
].map(aProyectoMapa);

beforeEach(() => preferirMovimientoReducido(true));

describe("GraficaEvolucion", () => {
  test("eje x con años enteros en orden y leyenda de las dos series en texto (CA-05.1)", () => {
    const { container } = render(<GraficaEvolucion proyectos={proyectos} />);
    const textos = [...container.querySelectorAll("svg text")].map((t) => t.textContent);
    expect(textos.filter((t) => /^\d{4}$/.test(t ?? ""))).toEqual(["2021", "2024", "2030"]);
    expect(screen.getByText("En operación y en construcción")).toBeInTheDocument();
    expect(screen.getByText("Anunciado (proyectado)")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Potencia [MW]", "Energía [MWh]"]);
  });

  test("la tabla trae los acumulados por año, sin Inactivo (CA-05.1, CA-05.2)", () => {
    render(<GraficaEvolucion proyectos={proyectos} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Año de FPO", "En operación y en construcción [MW]", "Anunciado (proyectado) [MW]",
    ]);
    const filas = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.textContent);
    expect(filas).toEqual(["20211,00,0", "20248,00,0", "20308,050,0"]);
    fireEvent.click(screen.getByRole("tab", { name: "Energía [MWh]" }));
    expect(within(screen.getByRole("table")).getAllByRole("row").at(-1)).toHaveTextContent("20306,0195,0");
  });

  test("avisa cuántos proyectos no tienen año de FPO (CA-06.1)", () => {
    render(<GraficaEvolucion proyectos={proyectos} />);
    expect(screen.getByText("1 proyecto sin año de FPO no aparece en esta gráfica")).toBeInTheDocument();
  });

  test("en plural y sin aviso cuando todos tienen año", () => {
    const { rerender } = render(<GraficaEvolucion proyectos={[...proyectos, aProyectoMapa(fila({ fpo: "" }))]} />);
    expect(screen.getByText("2 proyectos sin año de FPO no aparecen en esta gráfica")).toBeInTheDocument();
    rerender(<GraficaEvolucion proyectos={proyectos.slice(0, 2)} />);
    expect(screen.queryByText(/sin año de FPO/)).toBeNull();
  });

  test("las áreas van en líneas rectas entre años: una curva suavizada inventa valores (CA-05.1)", () => {
    const { container } = render(<GraficaEvolucion proyectos={proyectos} />);
    const trazos = [...container.querySelectorAll(".recharts-area-curve")].map((p) => p.getAttribute("d") ?? "");
    expect(trazos.length).toBeGreaterThan(0);
    for (const d of trazos) expect(d).not.toMatch(/C/);
  });
});
