// 004 · T10 · RNF-04, RNF-07: los textos de /normativa cumplen WCAG AA con los valores reales
// de los tokens (colors.css). El color de cada entidad es decorativo (la entidad va escrita),
// pero cada uno debe ser distinto para que el color sí ayude a distinguirlas.
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { COLOR_ENTIDAD } from "./tarjeta-norma";

const css = readFileSync("src/styles/tokens/colors.css", "utf8");
const valor = (token: string): string => {
  const nombre = /var\((--[\w-]+)\)/.exec(token)?.[1] ?? token;
  const v = new RegExp(`${nombre}:\s*([^;]+);`).exec(css)?.[1].replace(/\/\*.*\*\//, "").trim() ?? "";
  return v.startsWith("var(") ? valor(v) : v.toLowerCase();
};
const luminancia = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [luminancia(valor(a)), luminancia(valor(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("contraste de /normativa", () => {
  test.each([
    ["títulos y entidad", "var(--text-heading)", "var(--surface-card)"],
    ["fecha, estado y texto", "var(--text-body)", "var(--surface-card)"],
    ["separador de año (texto blanco)", "var(--white)", "var(--teal-600)"],
  ])("%s ≥ 4,5:1", (_n, texto, fondo) => {
    expect(contraste(texto, fondo)).toBeGreaterThanOrEqual(4.5);
  });

  test("control: --text-muted no alcanza AA, por eso la tarjeta no lo usa (valida la medición)", () => {
    expect(contraste("var(--text-muted)", "var(--surface-card)")).toBeLessThan(4.5);
  });

  test("cada entidad tiene un color real distinto", () => {
    const valores = Object.values(COLOR_ENTIDAD).map(valor);
    expect(valores.every((v) => /^#[0-9a-f]{6}$/.test(v))).toBe(true);
    expect(new Set(valores).size).toBe(valores.length);
  });
});
