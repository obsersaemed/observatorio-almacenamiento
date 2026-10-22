// 006 · T01: cifras de las gráficas de /mapa (por estado, por año de FPO, por tecnología).
// Datos ficticios.
import { describe, expect, test } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "./proyectos-mapa";
import { evolucion, porEstado, porTecnologia } from "./graficas-mapa";

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 1, capacidad_maxima_mwh: 1, ...f,
});
const p = (f: Partial<FilaProyecto>) => aProyectoMapa(fila(f));

describe("porEstado (RF-03, RF-04)", () => {
  const proyectos = [
    p({ potencia_nominal_mw: 10, capacidad_maxima_mwh: 20 }),
    p({ potencia_nominal_mw: 5, capacidad_maxima_mwh: 10 }),
    p({ estado: "Anunciado", potencia_nominal_mw: 50, capacidad_maxima_mwh: null }),
  ];

  test("los 4 estados en orden fijo, con MW y MWh por separado", () => {
    expect(porEstado(proyectos, "mw")).toEqual([
      { categoria: "En operación", valor: 15 },
      { categoria: "En construcción", valor: 0 },
      { categoria: "Anunciado", valor: 50 },
      { categoria: "Inactivo", valor: 0 },
    ]);
    expect(porEstado(proyectos, "mwh").map((f) => f.valor)).toEqual([30, 0, 0, 0]);
  });

  test("la duración es energía total ÷ potencia total, no la suma de duraciones (CA-04.1)", () => {
    const duracion = porEstado(proyectos, "h");
    expect(duracion[0]).toEqual({ categoria: "En operación", valor: 2 });
    // Anunciado no tiene MWh: sin datos para la duración. Los estados vacíos, igual.
    expect(duracion.slice(1).map((f) => f.valor)).toEqual([null, null, null]);
  });
});

describe("evolucion (RF-05, RF-06)", () => {
  const proyectos = [
    p({ fpo: "2024", potencia_nominal_mw: 7, capacidad_maxima_mwh: 4 }),
    p({ fpo: "2021", potencia_nominal_mw: 1, capacidad_maxima_mwh: 2 }),
    p({ fpo: "2027", estado: "En construcción", potencia_nominal_mw: 18, capacidad_maxima_mwh: 25 }),
    p({ fpo: "2030", estado: "Anunciado", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195 }),
    p({ fpo: "2019", estado: "Inactivo", potencia_nominal_mw: 50, capacidad_maxima_mwh: 45 }),
    p({ fpo: "", potencia_nominal_mw: 3 }),
    p({ fpo: "sin fecha", potencia_nominal_mw: 3 }),
  ];

  test("años en orden ascendente, acumulados, con dos series e Inactivo fuera (CA-05.1, CA-05.2)", () => {
    expect(evolucion(proyectos, "mw").puntos).toEqual([
      { anio: 2021, firme: 1, anunciado: 0 },
      { anio: 2024, firme: 8, anunciado: 0 },
      { anio: 2027, firme: 26, anunciado: 0 },
      { anio: 2030, firme: 26, anunciado: 50 },
    ]);
    expect(evolucion(proyectos, "mwh").puntos.at(-1)).toEqual({ anio: 2030, firme: 31, anunciado: 195 });
  });

  test("cuenta los proyectos sin año de FPO (CA-06.1)", () => {
    expect(evolucion(proyectos, "mw").sinAnio).toBe(2);
  });
});

describe("porTecnologia (RF-07)", () => {
  test("porcentaje por tecnología y total de la medida (CA-07.1)", () => {
    const proyectos = [p({ potencia_nominal_mw: 30 }), p({ potencia_nominal_mw: 10, tecnologia: "Flujo" }), p({ tecnologia: "", potencia_nominal_mw: 0 })];
    const mw = porTecnologia(proyectos, "mw");
    expect(mw.total).toBe(40);
    expect(mw.filas).toEqual([
      { categoria: "Li-ion", valor: 30, porcentaje: 75 },
      { categoria: "Flujo", valor: 10, porcentaje: 25 },
      { categoria: "Sin dato", valor: 0, porcentaje: 0 },
    ]);
    const conteo = porTecnologia(proyectos, "proyectos");
    expect(conteo.total).toBe(3);
    expect(conteo.filas[0]).toEqual({ categoria: "Li-ion", valor: 1, porcentaje: 100 / 3 });
  });

  test("todo Li-ion da 100 %", () => {
    expect(porTecnologia([p({}), p({})], "mwh").filas).toEqual([{ categoria: "Li-ion", valor: 2, porcentaje: 100 }]);
  });
});
