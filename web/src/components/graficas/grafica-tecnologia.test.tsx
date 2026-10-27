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
  test("sin pestañas: muestra la potencia y el centro lleva el total en MW (ajuste del 2026-10-24)", () => {
    render(<GraficaTecnologia proyectos={proyectos} />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.getByTestId("total-dona")).toHaveTextContent("185,2 MW");
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
});

// 008 · T05 · RF-05, RNF-02: dona de tecnología en kW.
describe("GraficaTecnologia con unidades (008)", () => {
  const medidor = [
    fila({ tecnologia: "LFP", potencia_nominal_mw: 0.107 }),
    fila({ tecnologia: "LFP", potencia_nominal_mw: 0.015 }),
  ].map(aProyectoMapa);

  test("con unidades=\"kW\": total en kW y tabla con [kW]", () => {
    render(<GraficaTecnologia proyectos={medidor} unidades="kW" />);
    expect(screen.getByTestId("total-dona")).toHaveTextContent("122,0 kW");
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Tecnología", "Potencia [kW]", "Participación [%]"]);
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("LFP122,0100,0");
  });

  test("con unidades=\"MW\" queda como hoy", () => {
    render(<GraficaTecnologia proyectos={proyectos} unidades="MW" />);
    expect(screen.getByTestId("total-dona")).toHaveTextContent("185,2 MW");
  });
});
