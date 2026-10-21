// 002 · T09 · RF-05, RF-06, CA-05.1, CA-05.2, CA-06.1: tarjeta del proyecto. Datos ficticios.
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";
import { TarjetaProyecto } from "./tarjeta-proyecto";

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "Proyecto ficticio", operador: "Operador X", estado: "Anunciado", tecnologia: "Li-ion", fpo: "2030",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 50, capacidad_maxima_mwh: 195, ...f,
});

describe("TarjetaProyecto", () => {
  test("muestra las cifras en es-CO con unidades y la duración (CA-05.1)", () => {
    render(<TarjetaProyecto proyecto={aProyectoMapa(fila({ punto_de_conexion_kv: 115 }))} />);
    const tarjeta = screen.getByRole("dialog", { name: "Proyecto ficticio" });
    expect(tarjeta).toHaveTextContent("50,0 MW");
    expect(tarjeta).toHaveTextContent("195,0 MWh");
    expect(tarjeta).toHaveTextContent("3,9 h");
    expect(tarjeta).toHaveTextContent("115 kV");
    for (const texto of ["Operador X", "Anunciado", "Li-ion", "2030", "Villavicencio, Meta"]) {
      expect(tarjeta).toHaveTextContent(texto);
    }
  });

  test("no muestra enlaces de fuente; el único enlace es Proponer corrección (CA-05.1, CA-06.1)", () => {
    render(<TarjetaProyecto proyecto={aProyectoMapa(fila({}))} />);
    const enlaces = screen.getAllByRole("link");
    expect(enlaces).toHaveLength(1);
    expect(enlaces[0]).toHaveAccessibleName("Proponer corrección");
    expect(enlaces[0]).toHaveAttribute(
      "href",
      `/aportar?tipo=${encodeURIComponent("Corrección")}&registro=${encodeURIComponent("Proyecto ficticio")}`,
    );
  });

  test("sin servicios dice «Sin dato» y oculta los campos técnicos vacíos (CA-05.2)", () => {
    render(
      <TarjetaProyecto
        proyecto={aProyectoMapa(fila({ operador: null, potencia_nominal_mw: null, capacidad_maxima_mwh: null }))}
      />,
    );
    const tarjeta = screen.getByRole("dialog");
    expect(tarjeta).toHaveTextContent("Servicios: Sin dato");
    expect(tarjeta).not.toHaveTextContent("Operador");
    expect(tarjeta).not.toHaveTextContent("Potencia");
    expect(tarjeta).not.toHaveTextContent("Duración");
    expect(tarjeta).not.toHaveTextContent("kV");
  });

  test("lista varios servicios", () => {
    render(
      <TarjetaProyecto
        proyecto={aProyectoMapa(fila({ tipo_uso_conexion: "Regulación primaria de frecuencia, Inyección de energía en la noche" }))}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Servicios: Regulación primaria de frecuencia, Inyección de energía en la noche",
    );
  });
});
