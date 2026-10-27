import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "./button";

// Resuelve var(--x) hasta su valor final leyendo los tokens y el tema.
const definiciones = new Map<string, string>();
for (const ruta of ["src/styles/tokens/colors.css", "src/styles/tema.css"]) {
  const css = readFileSync(join(process.cwd(), ruta), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, nombre, valor] of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) definiciones.set(nombre, valor.trim());
}
const resolver = (valor: string): string => {
  const m = /^var\((--[\w-]+)\)$/.exec(valor);
  return m ? resolver(definiciones.get(m[1]) ?? "") : valor.toLowerCase();
};

const clases = (nombre: string) => screen.getByRole("button", { name: nombre }).className.split(/\s+/);

describe("Button formal (RF-04)", () => {
  test("el principal es gris oscuro (--teal-600) con texto blanco", () => {
    render(<Button>Filtros</Button>);
    const c = clases("Filtros");
    expect(c).toContain("bg-primary");
    expect(c).toContain("text-primary-foreground");
    expect(resolver("var(--primary)")).toBe(resolver("var(--teal-600)"));
    expect(resolver("var(--primary-foreground)")).toBe("#ffffff");
  });

  test("el secundario (outline) es blanco con borde gris oscuro de 1,5 px y texto oscuro", () => {
    render(<Button variant="outline">Descargar CSV</Button>);
    const c = clases("Descargar CSV");
    expect(c).toContain("bg-card");
    expect(c).toContain("border-[1.5px]");
    expect(c).toContain("border-[var(--teal-600)]");
    expect(c).toContain("text-[var(--text-heading)]");
    expect(resolver("var(--card)")).toBe("#ffffff");
  });

  test("la variante acento lleva texto oscuro sobre naranja", () => {
    render(<Button variant="acento">Aportar</Button>);
    const c = clases("Aportar");
    expect(c).toContain("bg-accent");
    expect(c).toContain("text-accent-foreground");
  });

  test("el radio es el pequeño y no hay degradados", () => {
    for (const variant of ["default", "outline", "acento"] as const) {
      const { unmount } = render(<Button variant={variant}>Botón</Button>);
      const c = clases("Botón");
      expect(c, variant).toContain("rounded-sm");
      expect(c.some((k) => /^rounded-(lg|xl|md|full)/.test(k)), variant).toBe(false);
      expect(c.some((k) => /gradient|bg-linear|bg-radial|shadow-/.test(k)), variant).toBe(false);
      unmount();
    }
  });
});
