import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "@/components/ui/button";

const leer = (ruta: string) => readFileSync(join(process.cwd(), ruta), "utf-8");
const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("tema TEJ", () => {
  const tema = leer("src/styles/tema.css");

  test("importa los tokens del design system", () => {
    for (const archivo of ["colors.css", "spacing.css", "typography.css"]) {
      expect(tema).toContain(`./tokens/${archivo}`);
    }
  });

  test("las variables de shadcn apuntan a tokens semánticos", () => {
    const esperado: Record<string, string> = {
      "--primary": "var(--brand)",
      "--primary-foreground": "var(--brand-contrast)",
      "--background": "var(--surface-page)",
      "--foreground": "var(--text-body)",
      "--card": "var(--surface-card)",
      "--border": "var(--border-card)",
      "--ring": "var(--brand-ink)",
    };
    for (const [variable, valor] of Object.entries(esperado)) {
      expect(tema).toMatch(new RegExp(`${variable}:\\s*${valor.replace(/[()]/g, "\\$&")};`));
    }
  });

  test("ni el tema ni globals.css escriben colores a mano", () => {
    for (const css of [tema, leer("src/app/globals.css")]) {
      expect(sinComentarios(css)).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(|hsl\(/);
    }
  });

  test("globals.css usa el tema", () => {
    expect(leer("src/app/globals.css")).toContain("../styles/tema.css");
  });

  test("los textos sobre los fondos del tema cumplen contraste WCAG AA (4,5:1)", () => {
    const definiciones = new Map<string, string>();
    for (const css of [leer("src/styles/tokens/colors.css"), tema]) {
      for (const [, nombre, valor] of sinComentarios(css).matchAll(/(--[\w-]+):\s*([^;]+);/g)) definiciones.set(nombre, valor.trim());
    }
    const resolver = (valor: string): string => {
      const m = /^var\((--[\w-]+)\)$/.exec(valor);
      return m ? resolver(definiciones.get(m[1]) ?? "") : valor;
    };
    const luminancia = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contraste = (a: string, b: string) => {
      const [l1, l2] = [luminancia(resolver(a)), luminancia(resolver(b))].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    };
    for (const texto of ["var(--foreground)", "var(--muted-foreground)", "var(--card-foreground)"]) {
      for (const fondo of ["var(--background)", "var(--card)"]) {
        expect(contraste(texto, fondo), `${texto} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contraste("var(--primary-foreground)", "var(--primary)")).toBeGreaterThanOrEqual(4.5);
  });

  test("el botón primario de shadcn usa el color de marca", () => {
    render(<Button>Aportar</Button>);
    expect(screen.getByRole("button", { name: "Aportar" }).className).toContain("bg-primary");
  });
});
