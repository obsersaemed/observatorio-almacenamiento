// 004 · T03 · RF-01, 02, 03, 06, 07, 09, 10, 12: lógica de la línea de tiempo. Datos ficticios.
import { describe, expect, test } from "vitest";
import {
  agruparPorAnio,
  fechaDeNorma,
  aniosDe,
  filtrar,
  ordenar,
  opcionesDe,
  relacionadasDe,
  separar,
  textoConteo,
  textoNorma,
  type Norma,
} from "./normativa";

const norma = (n: Partial<Norma> & { id: string }): Norma => ({
  fecha: "2020-01-01", emisor: "CREG", tipo: "Resolución", numero: "1", titulo: "Ficticia", estado: "Vigente",
  precision_fecha: null, resumen: null, explicacion: null, aplica_a: null, relacionada_con: null, enlace: "https://ejemplo.co", ...n,
});

const A = norma({ id: "CREG-RES-098-2019", fecha: "2019-07-11", numero: "098" });
const B = norma({ id: "CNO-ACU-1585-2022", fecha: "2022-06-02", emisor: "CNO", tipo: "Acuerdo", numero: "1585" });
const C = norma({ id: "CREG-RES-101023-2022", fecha: "2022-06-02", numero: "101 023" });
const D = norma({ id: "CREG-RES-101113-2026", fecha: "2026-06-19", numero: "101 113", estado: "Vigente", relacionada_con: "CREG-RES-098-2019; MME-RES-1-2020" });
const E = norma({ id: "XM-DOC-PROC-2024", fecha: "2024-03-01", emisor: "XM", tipo: "Documento", numero: "Procedimiento", estado: "En consulta" });
const EST = norma({ id: "ACADEMIA-EST-BARRERAS-2023", fecha: "2023-05-01", emisor: "Academia", tipo: "Estudio", numero: "Barreras" });
const TODAS = [A, B, C, D, E, EST];

describe("orden y años (RF-01, RF-02, aclaración 5)", () => {
  test("de la más reciente a la más antigua; con la misma fecha, por entidad y luego por número", () => {
    expect(ordenar([A, C, B, D]).map((n) => n.id)).toEqual([D.id, B.id, C.id, A.id]);
  });

  test("agrupa por año, de mayor a menor, con sus normas en orden", () => {
    const grupos = agruparPorAnio([A, B, C, D]);
    expect(grupos.map((g) => g.anio)).toEqual(["2026", "2022", "2019"]);
    expect(grupos[1].normas.map((n) => n.id)).toEqual([B.id, C.id]);
  });

  test("los años de un resultado son los de sus normas (barra de años, CA-03.2)", () => {
    expect(aniosDe([B, A])).toEqual(["2022", "2019"]);
    expect(aniosDe([])).toEqual([]);
  });
});

describe("estudios aparte (RF-12)", () => {
  test("los estudios no van en la línea de tiempo sino en la referencia", () => {
    const { linea, referencia } = separar(TODAS);
    expect(linea.map((n) => n.id)).not.toContain(EST.id);
    expect(referencia.map((n) => n.id)).toEqual([EST.id]);
  });
});

describe("filtros (RF-07, RF-09)", () => {
  test("por entidad y estado a la vez", () => {
    expect(filtrar([A, B, C, D, E], { entidad: ["CREG"], estado: ["Vigente"] }).map((n) => n.id).sort()).toEqual(
      [A.id, C.id, D.id].sort(),
    );
  });

  test("por tipo y por año", () => {
    expect(filtrar([A, B, C, D, E], { tipo: ["Acuerdo"] }).map((n) => n.id)).toEqual([B.id]);
    expect(filtrar([A, B, C, D, E], { anio: ["2022"] }).map((n) => n.id).sort()).toEqual([B.id, C.id].sort());
  });

  test("una combinación sin resultados da una lista vacía", () => {
    expect(filtrar([A, B, C, D, E], { entidad: ["XM"], anio: ["2019"] })).toEqual([]);
  });

  test("las opciones llevan su conteo según los demás filtros", () => {
    expect(opcionesDe([A, B, C, D, E], "entidad", {})).toEqual([
      { valor: "CNO", cantidad: 1 },
      { valor: "CREG", cantidad: 3 },
      { valor: "XM", cantidad: 1 },
    ]);
    expect(opcionesDe([A, B, C, D, E], "entidad", { anio: ["2022"] })).toEqual([
      { valor: "CNO", cantidad: 1 },
      { valor: "CREG", cantidad: 1 },
    ]);
  });

  test("los años van de mayor a menor y los estados en el orden del esquema", () => {
    expect(opcionesDe([A, B, C, D, E], "anio", {}).map((o) => o.valor)).toEqual(["2026", "2024", "2022", "2019"]);
    expect(opcionesDe([A, B, C, D, E], "estado", {}).map((o) => o.valor)).toEqual(["Vigente", "En consulta"]);
  });
});

describe("conteo (RF-10)", () => {
  test("singular y plural con formato es-CO", () => {
    expect(textoConteo(1)).toBe("1 norma");
    expect(textoConteo(3)).toBe("3 normas");
    expect(textoConteo(0)).toBe("0 normas");
  });
});

describe("normas relacionadas (RF-06)", () => {
  test("una publicada trae su norma; una no publicada solo el texto sacado del id", () => {
    const rel = relacionadasDe(D, [A, B, C, D]);
    expect(rel).toEqual([
      { id: A.id, norma: A, texto: "Resolución CREG 098 de 2019" },
      { id: "MME-RES-1-2020", norma: null, texto: "Resolución MME 1 de 2020" },
    ]);
  });

  test("sin relacionadas da una lista vacía", () => {
    expect(relacionadasDe(A, TODAS)).toEqual([]);
  });

  test("el texto de una ley no repite al Congreso", () => {
    expect(textoNorma(norma({ id: "CONGRESO-LEY-1715-2014", emisor: "Congreso", tipo: "Ley", numero: "1715", fecha: "2014-05-13" }))).toBe(
      "Ley 1715 de 2014",
    );
  });
});

describe("precisión de la fecha (CA-04.3)", () => {
  test("con día, solo mes y año, o solo año, sin inventar el día", () => {
    expect(fechaDeNorma(norma({ id: "X", fecha: "2026-06-19" }))).toBe("19/06/2026");
    expect(fechaDeNorma(norma({ id: "X", fecha: "2026-06-19", precision_fecha: "Día" }))).toBe("19/06/2026");
    expect(fechaDeNorma(norma({ id: "X", fecha: "2026-09-01", precision_fecha: "Mes" }))).toBe("septiembre de 2026");
    expect(fechaDeNorma(norma({ id: "X", fecha: "2025-01-01", precision_fecha: "Año" }))).toBe("2025");
  });
});
