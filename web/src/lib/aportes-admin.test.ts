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
  test("lista cada campo propuesto con su valor actual y marca los que cambian", () => {
    const actual = { nombre: "BESS Termozipa", potencia_nominal_mw: 7, estado: "En operación" };
    const propuesto = { potencia_nominal_mw: 12, estado: "En operación", tabla: "proyectos" };
    expect(compararCampos(actual, propuesto)).toEqual([
      { campo: "potencia_nominal_mw", actual: "7", propuesto: "12", cambia: true },
      { campo: "estado", actual: "En operación", propuesto: "En operación", cambia: false },
    ]);
  });

  test("sin registro actual todos los campos son nuevos", () => {
    expect(compararCampos(null, { titulo: "X" })).toEqual([{ campo: "titulo", actual: "—", propuesto: "X", cambia: true }]);
  });
});
