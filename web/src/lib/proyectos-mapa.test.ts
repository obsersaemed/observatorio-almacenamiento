// 002 · T05, T06: filtrado, opciones con conteo, duración y KPI de /mapa. Datos ficticios.
import { describe, expect, test } from "vitest";
import {
  aProyectoMapa,
  duracionHoras,
  filtrar,
  kpiSeccion,
  opcionesDe,
  segmentoDe,
  SIN_DATO,
  soloSegmento,
  type FilaProyecto,
  type ProyectoMapa,
} from "./proyectos-mapa";

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "Ficticio",
  operador: "Operador A",
  estado: "En operación",
  tecnologia: "Li-ion",
  fpo: "2024",
  tipo_uso_conexion: null,
  punto_de_conexion_kv: null,
  departamento: "Cundinamarca",
  municipio: "Tocancipá",
  latitud: 4.9,
  longitud: -73.9,
  potencia_nominal_mw: 10,
  capacidad_maxima_mwh: 20,
  ...f,
});

const proyectos: ProyectoMapa[] = [
  fila({ nombre: "A", estado: "En operación", departamento: "Cundinamarca", municipio: "Tocancipá", tipo_uso_conexion: "Regulación primaria de frecuencia, Inyección de energía en la noche" }),
  fila({ nombre: "B", estado: "Anunciado", departamento: "Cundinamarca", municipio: "Paratebueno", operador: "Operador B", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195 }),
  fila({ nombre: "C", estado: "En operación", departamento: "Valle del Cauca", municipio: "Palmira", tipo_uso_conexion: "Inyección de energía en la noche", potencia_nominal_mw: "1,5", capacidad_maxima_mwh: 2 }),
  fila({ nombre: "D", estado: "En operación", departamento: "Meta", municipio: "Villavicencio", fpo: "2030", latitud: null, longitud: null }),
].map(aProyectoMapa);

const nombres = (ps: ProyectoMapa[]) => ps.map((p) => p.nombre);

describe("aProyectoMapa", () => {
  test("separa los servicios, convierte números y marca si tiene ubicación", () => {
    const [a, , c, d] = proyectos;
    expect(a.servicios).toEqual(["Regulación primaria de frecuencia", "Inyección de energía en la noche"]);
    expect(proyectos[1].servicios).toEqual([]);
    expect(c.mw).toBe(1.5);
    expect(a.ubicado).toBe(true);
    expect(d.ubicado).toBe(false);
  });
});

describe("filtrar (RF-08, CA-08.1, CA-14.2, CA-12.1)", () => {
  test("sin filtros devuelve todos", () => {
    expect(nombres(filtrar(proyectos, {}))).toEqual(["A", "B", "C", "D"]);
  });

  test("varios valores dentro de un filtro: basta con uno; entre filtros: se cumplen todos", () => {
    const r = filtrar(proyectos, { departamento: ["Cundinamarca", "Valle del Cauca"], estado: ["En operación"] });
    expect(nombres(r)).toEqual(["A", "C"]);
  });

  test("un proyecto con dos servicios aparece al filtrar por cualquiera de ellos", () => {
    expect(nombres(filtrar(proyectos, { servicios: ["Regulación primaria de frecuencia"] }))).toEqual(["A"]);
    expect(nombres(filtrar(proyectos, { servicios: ["Inyección de energía en la noche"] }))).toEqual(["A", "C"]);
  });

  test("«Sin dato» encuentra los proyectos sin servicios", () => {
    expect(nombres(filtrar(proyectos, { servicios: [SIN_DATO] }))).toEqual(["B", "D"]);
  });

  test("filtros por operador, tecnología y año de FPO", () => {
    expect(nombres(filtrar(proyectos, { operador: ["Operador B"] }))).toEqual(["B"]);
    expect(nombres(filtrar(proyectos, { tecnologia: ["Li-ion"], fpo: ["2030"] }))).toEqual(["D"]);
  });

  test("una combinación sin resultados devuelve una lista vacía", () => {
    expect(filtrar(proyectos, { departamento: ["Meta"], estado: ["Anunciado"] })).toEqual([]);
  });
});

describe("opcionesDe (RF-08, CA-08.2)", () => {
  test("cada opción trae su número de proyectos, ordenadas alfabéticamente", () => {
    expect(opcionesDe(proyectos, "departamento", {})).toEqual([
      { valor: "Cundinamarca", cantidad: 2 },
      { valor: "Meta", cantidad: 1 },
      { valor: "Valle del Cauca", cantidad: 1 },
    ]);
  });

  test("el municipio solo ofrece municipios de los departamentos elegidos", () => {
    const r = opcionesDe(proyectos, "municipio", { departamento: ["Cundinamarca"] });
    expect(r).toEqual([
      { valor: "Paratebueno", cantidad: 1 },
      { valor: "Tocancipá", cantidad: 1 },
    ]);
  });

  test("los conteos de un filtro no dependen de lo elegido en ese mismo filtro", () => {
    const r = opcionesDe(proyectos, "estado", { estado: ["Anunciado"] });
    expect(r).toEqual([
      { valor: "Anunciado", cantidad: 1 },
      { valor: "En operación", cantidad: 3 },
    ]);
  });

  test("servicios cuenta cada servicio por separado y agrega «Sin dato»", () => {
    expect(opcionesDe(proyectos, "servicios", {})).toEqual([
      { valor: "Inyección de energía en la noche", cantidad: 2 },
      { valor: "Regulación primaria de frecuencia", cantidad: 1 },
      { valor: SIN_DATO, cantidad: 2 },
    ]);
  });
});

describe("duracionHoras (RF-05, CA-05.1)", () => {
  test("es energía ÷ potencia", () => {
    expect(duracionHoras(50, 195)).toBeCloseTo(3.9);
  });
  test("queda vacía si falta un dato o la potencia es 0", () => {
    expect(duracionHoras(null, 195)).toBeNull();
    expect(duracionHoras(50, null)).toBeNull();
    expect(duracionHoras(0, 10)).toBeNull();
  });
});

describe("kpiSeccion (RF-11, CA-11.1, CA-12.1)", () => {
  test("Instalado suma solo En operación de todos; según filtros suma todos los estados del resultado", () => {
    const soloAnunciados = filtrar(proyectos, { estado: ["Anunciado"] });
    const k = kpiSeccion(proyectos, soloAnunciados);
    expect(k.instalado).toEqual({ mw: 21.5, mwh: 42 });
    expect(k.filtrado).toEqual({ total: 1, mw: 50, mwh: 195 });
  });

  test("con un resultado vacío los KPI filtrados son 0 y lo instalado no cambia", () => {
    const k = kpiSeccion(proyectos, []);
    expect(k.filtrado).toEqual({ total: 0, mw: 0, mwh: 0 });
    expect(k.instalado.mw).toBe(21.5);
  });
});

// 008 · T04: el segmento se deduce del servicio, leído del esquema (RF-01).
describe("segmentoDe y soloSegmento (008, RF-01)", () => {
  const medidor = fila({ nombre: "M", tipo_uso_conexion: "Maximización de autoconsumo PV y respaldo", potencia_nominal_mw: 0.015 });
  const filas = [fila({ nombre: "A", tipo_uso_conexion: "Regulación primaria de frecuencia" }), medidor, fila({ nombre: "B" })];

  test("con el servicio nuevo es «Detrás del medidor»; con los demás o sin servicio, «Gran escala»", () => {
    expect(segmentoDe(aProyectoMapa(medidor))).toBe("Detrás del medidor");
    expect(segmentoDe(medidor)).toBe("Detrás del medidor");
    expect(segmentoDe(filas[0])).toBe("Gran escala");
    expect(segmentoDe(aProyectoMapa(filas[2]))).toBe("Gran escala");
  });

  test("soloSegmento filtra filas y proyectos", () => {
    expect(soloSegmento(filas, "Gran escala").map((f) => f.nombre)).toEqual(["A", "B"]);
    expect(soloSegmento(filas.map(aProyectoMapa), "Detrás del medidor").map((p) => p.nombre)).toEqual(["M"]);
  });
});
