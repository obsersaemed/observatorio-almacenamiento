// 006 · T06 · RF-07: dona de tecnología.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";
import { preferirMovimientoReducido, rechartsConTamano } from "./prueba-recharts";

vi.mock("recharts", (original) => rechartsConTamano(original as () => Promise<Record<string, unknown>>));
const { GraficaTecnologia } = await import("./grafica-tecnologia");

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 1, capacidad_maxima_mwh: 1, ...f,
});
const proyectos = [
  fila({ potencia_nominal_mw: 150, capacidad_maxima_mwh: 300 }),
  fila({ potencia_nominal_mw: 35.2, capacidad_maxima_mwh: 172.8 }),
].map(aProyectoMapa);

beforeEach(() => preferirMovimientoReducido(true));

describe("GraficaTecnologia", () => {
  test("pestañas MW, MWh y Proyectos; el centro muestra el total de la pestaña activa", () => {
    render(<GraficaTecnologia proyectos={proyectos} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Potencia [MW]", "Energía [MWh]", "Proyectos"]);
    expect(screen.getByTestId("total-dona")).toHaveTextContent("185,2 MW");
    fireEvent.click(screen.getByRole("tab", { name: "Energía [MWh]" }));
    expect(screen.getByTestId("total-dona")).toHaveTextContent("472,8 MWh");
    fireEvent.click(screen.getByRole("tab", { name: "Proyectos" }));
    expect(screen.getByTestId("total-dona")).toHaveTextContent("2 proyectos");
  });

  test("la leyenda trae cada tecnología con su porcentaje en texto (CA-07.1)", () => {
    render(<GraficaTecnologia proyectos={proyectos} />);
    expect(screen.getByRole("list", { name: "Tecnologías" })).toHaveTextContent("Li-ion100,0 %");
  });

  test("la tabla trae valor y porcentaje", () => {
    render(<GraficaTecnologia proyectos={proyectos} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Tecnología", "Potencia [MW]", "Participación [%]"]);
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Li-ion185,2100,0");
  });

  test("un proyecto en singular", () => {
    render(<GraficaTecnologia proyectos={proyectos.slice(0, 1)} />);
    fireEvent.click(screen.getByRole("tab", { name: "Proyectos" }));
    expect(screen.getByTestId("total-dona")).toHaveTextContent("1 proyecto");
  });
});
