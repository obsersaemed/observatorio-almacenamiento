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

  test("el botón primario de shadcn usa el color de marca", () => {
    render(<Button>Aportar</Button>);
    expect(screen.getByRole("button", { name: "Aportar" }).className).toContain("bg-primary");
  });
});
