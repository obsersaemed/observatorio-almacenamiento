// T13 · RF-14 · RNF-10 · CA-14.1: descarga de datos publicados.
import { describe, expect, test } from "vitest";
import { csvDe, LICENCIA, seccionDescargable } from "./csv";

const filas = [
  {
    nombre: "BESS, con coma",
    estado: "En operación",
    departamento: "Cundinamarca",
    municipio: "Tocancipá",
    potencia_nominal_mw: 7.5,
    fuente: "https://ejemplo.co/a",
    publicacion: "Aprobado",
    correo: "no@debe.salir",
    origen_hash: "abc",
  },
  { nombre: "Pendiente", estado: "Anunciado", departamento: "Meta", municipio: "X", fuente: "https://e.co", publicacion: "Pendiente" },
  { nombre: 'Con "comillas"', estado: "Anunciado", departamento: "Meta", municipio: "Y", fuente: "https://e.co/b", publicacion: "Aprobado" },
];

const lineas = (texto: string) => texto.replace(/^﻿/, "").trimEnd().split("\r\n");

describe("csvDe", () => {
  test("empieza con marca UTF-8 y la línea de licencia CC BY 4.0", () => {
    const csv = csvDe("proyectos", filas);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(lineas(csv)[0]).toBe(LICENCIA);
    expect(LICENCIA).toMatch(/CC BY 4\.0/);
  });

  test("el encabezado son las columnas del esquema, en orden, con la de fuente", () => {
    const encabezado = lineas(csvDe("proyectos", filas))[1].split(",");
    expect(encabezado[0]).toBe("Nombre");
    expect(encabezado).toContain("Potencia nominal [MW]");
    expect(encabezado.at(-1)).toBe("Fuente");
    expect(encabezado).not.toContain("publicacion");
  });

  test("solo incluye registros aprobados", () => {
    const texto = csvDe("proyectos", filas);
    expect(texto).not.toContain("Pendiente,");
    expect(lineas(texto)).toHaveLength(2 + 2);
  });

  test("nunca exporta correos ni datos internos (RNF-10)", () => {
    const texto = csvDe("proyectos", filas);
    expect(texto).not.toContain("no@debe.salir");
    expect(texto).not.toContain("abc");
  });

  test("escapa comas y comillas, y usa punto decimal", () => {
    const [, , primera, segunda] = lineas(csvDe("proyectos", filas));
    expect(primera.startsWith('"BESS, con coma",')).toBe(true);
    expect(primera).toContain(",7.5,");
    expect(segunda.startsWith('"Con ""comillas""",')).toBe(true);
  });
});

describe("csvDe de normativa (004 · T20 · CA-04.3)", () => {
  test("una fecha sin día sale como mes y año, o solo año; una completa queda igual", () => {
    const base = { emisor: "XM", tipo: "Documento", numero: "X", titulo: "T", estado: "Vigente", enlace: "https://e.co", publicacion: "Aprobado" };
    const csv = csvDe("normativa", [
      { ...base, id: "A", fecha: "2022-09-01", precision_fecha: "Mes" },
      { ...base, id: "B", fecha: "2022-01-01", precision_fecha: "Año" },
      { ...base, id: "C", fecha: "2026-06-19", precision_fecha: null },
    ]);
    const filas = csv.trim().split(/\r\n/).slice(2).map((l) => l.split(",").slice(0, 3).join(","));
    expect(filas).toEqual(["A,septiembre de 2022,Mes", "B,2022,Año", "C,2026-06-19,"]);
  });
});

describe("seccionDescargable", () => {
  test("acepta solo las secciones públicas", () => {
    expect(seccionDescargable("proyectos.csv")).toBe("proyectos");
    expect(seccionDescargable("normativa.csv")).toBe("normativa");
    expect(seccionDescargable("noticias.csv")).toBe("noticias");
    expect(seccionDescargable("aportes.csv")).toBeNull();
    expect(seccionDescargable("proyectos")).toBeNull();
  });
});
