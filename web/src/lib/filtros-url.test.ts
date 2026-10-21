// 002 · T06 · RF-10, CA-10.1, CA-10.2: los filtros de /mapa viven en la URL.
import { describe, expect, test } from "vitest";
import { consultaDeFiltros, filtrosDeConsulta } from "./filtros-url";

describe("filtros en la URL", () => {
  test("ida y vuelta conserva tildes y valores múltiples", () => {
    const filtros = {
      departamento: ["Cundinamarca", "Valle del Cauca"],
      municipio: ["Tocancipá"],
      servicios: ["Inyección de energía en la noche"],
      estado: ["En operación"],
    };
    const consulta = consultaDeFiltros(filtros);
    expect(consulta.startsWith("?")).toBe(true);
    expect(filtrosDeConsulta(new URLSearchParams(consulta))).toEqual(filtros);
  });

  test("sin filtros la consulta queda vacía (Limpiar filtros)", () => {
    expect(consultaDeFiltros({})).toBe("");
    expect(consultaDeFiltros({ estado: [] })).toBe("");
  });

  test("ignora parámetros desconocidos y valores vacíos", () => {
    const r = filtrosDeConsulta(new URLSearchParams("estado=Anunciado&estado=&otro=x&utm_source=y"));
    expect(r).toEqual({ estado: ["Anunciado"] });
  });

  test("acepta los parámetros de Next (objeto con texto o arreglos)", () => {
    expect(filtrosDeConsulta({ estado: ["Anunciado", "Inactivo"], fpo: "2030", x: "1" })).toEqual({
      estado: ["Anunciado", "Inactivo"],
      fpo: ["2030"],
    });
  });
});
