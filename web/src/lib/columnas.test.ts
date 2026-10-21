import { describe, expect, test } from "vitest";
import { valorEsCo } from "./columnas";
import { leerNumero } from "./esquemas";

describe("valorEsCo", () => {
  test("números con coma decimal y sin separador de miles, para que se lean de vuelta igual", () => {
    expect(valorEsCo({ tipo: "numero" }, 4.5)).toBe("4,5");
    expect(valorEsCo({ tipo: "numero" }, 1500)).toBe("1500");
    expect(leerNumero(valorEsCo({ tipo: "numero" }, 1500.25))).toBe(1500.25);
  });
  test("textos sin cambios y vacíos como cadena vacía", () => {
    expect(valorEsCo({ tipo: "texto" }, "1.500")).toBe("1.500");
    expect(valorEsCo({ tipo: "numero" }, null)).toBe("");
  });
});
