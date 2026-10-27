import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "@/components/ui/button";

const leer = (ruta: string) => readFileSync(join(process.cwd(), ruta), "utf-8");
const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

// Resuelve un token (var(--x)) hasta su color hex, leyendo los tokens y el tema.
const definiciones = new Map<string, string>();
for (const css of [leer("src/styles/tokens/colors.css"), leer("src/styles/tema.css")]) {
  for (const [, nombre, valor] of sinComentarios(css).matchAll(/(--[\w-]+):\s*([^;]+);/g)) definiciones.set(nombre, valor.trim());
}
const resolver = (valor: string): string => {
  const m = /^var\((--[\w-]+)\)$/.exec(valor);
  return m ? resolver(definiciones.get(m[1]) ?? "") : valor.toLowerCase();
};
const luminancia = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const [l1, l2] = [luminancia(resolver(a)), luminancia(resolver(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

describe("tema TEJ", () => {
  const tema = leer("src/styles/tema.css");

  test("importa los tokens del design system", () => {
    for (const archivo of ["colors.css", "spacing.css", "typography.css"]) {
      expect(tema).toContain(`./tokens/${archivo}`);
    }
  });

  test("las variables de shadcn apuntan a tokens semánticos", () => {
    const esperado: Record<string, string> = {
      "--primary": "var(--brand-ink)", // rediseño 007 (RF-04)
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
    for (const texto of ["var(--foreground)", "var(--muted-foreground)", "var(--card-foreground)"]) {
      for (const fondo of ["var(--background)", "var(--card)"]) {
        expect(contraste(texto, fondo), `${texto} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contraste("var(--primary-foreground)", "var(--primary)")).toBeGreaterThanOrEqual(4.5);
  });

  describe("rediseño 007 (RF-01)", () => {
    test("el encabezado es gris oscuro (--teal-600)", () => {
      expect(definiciones.get("--surface-header")).toBe("var(--teal-600)");
      expect(resolver("var(--surface-header)")).toBe("#3f4548");
    });

    test("existen los acentos naranja --accent y --accent-soft", () => {
      expect(resolver("var(--accent)")).toBe("#e8935a");
      expect(resolver("var(--accent-soft)")).toBe("#f4b183");
    });

    test("cada par texto/fondo declarado tiene contraste ≥ 4,5:1", () => {
      const pares: [string, string, string][] = [
        ["cuerpo", "var(--foreground)", "var(--background)"],
        ["cuerpo en tarjeta", "var(--card-foreground)", "var(--card)"],
        ["títulos", "var(--text-heading)", "var(--background)"],
        ["títulos en tarjeta", "var(--text-heading)", "var(--card)"],
        ["enlaces", "var(--text-link)", "var(--card)"],
        ["enlaces sobre el fondo", "var(--text-link)", "var(--background)"],
        ["encabezado", "var(--text-on-brand)", "var(--surface-header)"],
        ["botón principal", "var(--primary-foreground)", "var(--primary)"],
        ["texto oscuro sobre naranja", "var(--accent-foreground)", "var(--accent)"],
        ["pestaña activa y cabecera de la tabla", "var(--text-on-selected)", "var(--surface-selected)"],
      ];
      for (const [nombre, texto, fondo] of pares) {
        expect(contraste(texto, fondo), nombre).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  test("el botón primario de shadcn usa el color de marca", () => {
    render(<Button>Aportar</Button>);
    expect(screen.getByRole("button", { name: "Aportar" }).className).toContain("bg-primary");
  });
});

describe("007 · T24: enlaces de la atribución del mapa (RNF-04, axe link-in-text-block)", () => {
  test("los enlaces de los créditos de MapLibre van subrayados para distinguirse del texto", () => {
    const css = sinComentarios(leer("src/app/globals.css")).replace(/\s+/g, " ");
    // Con más especificidad que la regla de maplibre-gl.css (`.maplibregl-ctrl-attrib a`, que se
    // carga después y quita el subrayado).
    expect(css).toMatch(/\.maplibregl-map \.maplibregl-ctrl-attrib a\s*\{[^}]*text-decoration:\s*underline/);
  });
});
