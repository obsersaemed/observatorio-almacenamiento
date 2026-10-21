// T11 · RF-08, RF-12: datos para la revisión de aportes.
import { describe, expect, test } from "vitest";
import { compararCampos, etiquetaOrigen, tablaDestino } from "./aportes-admin";

describe("etiquetaOrigen (CA-12.1)", () => {
  test("usuario o agente con su nombre", () => {
    expect(etiquetaOrigen({ origen: "usuario", agente: null })).toBe("Usuario");
    expect(etiquetaOrigen({ origen: "agente", agente: "buscar-noticias" })).toBe("Agente: buscar-noticias");
    expect(etiquetaOrigen({ origen: "editor", agente: null })).toBe("Editor");
  });
});

describe("tablaDestino", () => {
  test("se deduce del tipo, o de datos.tabla en las correcciones", () => {
    expect(tablaDestino({ tipo: "Proyecto nuevo", datos: {} })).toBe("proyectos");
    expect(tablaDestino({ tipo: "Noticia", datos: {} })).toBe("noticias");
    expect(tablaDestino({ tipo: "Norma", datos: {} })).toBe("normas");
    expect(tablaDestino({ tipo: "Corrección", datos: {} })).toBe("proyectos");
    expect(tablaDestino({ tipo: "Corrección", datos: { tabla: "normas" } })).toBe("normas");
  });
});

describe("compararCampos (CA-08.1)", () => {
  test("lista cada campo propuesto con su etiqueta, valores en es-CO y si cambia (RNF-04)", () => {
    const actual = { nombre: "BESS Termozipa", potencia_nominal_mw: 7, estado: "En operación" };
    const propuesto = { potencia_nominal_mw: 4.5, estado: "En operación", tabla: "proyectos" };
    expect(compararCampos("proyectos", actual, propuesto)).toEqual([
      { campo: "potencia_nominal_mw", etiqueta: "Potencia nominal [MW]", actual: "7", propuesto: "4,5", cambia: true },
      { campo: "estado", etiqueta: "Estado", actual: "En operación", propuesto: "En operación", cambia: false },
    ]);
  });

  test("sin registro actual todos los campos son nuevos", () => {
    expect(compararCampos("noticias", null, { titulo: "X" })).toEqual([
      { campo: "titulo", etiqueta: "titulo", actual: "—", propuesto: "X", cambia: true },
    ]);
  });
});
