// 003 · T10: dona genérica (la usan la tecnología de /mapa y las donas de /vehiculos).
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { preferirMovimientoReducido, rechartsConTamano } from "./prueba-recharts";

vi.mock("recharts", (original) => rechartsConTamano(original as () => Promise<Record<string, unknown>>));
const { Dona } = await import("./dona");

beforeEach(() => preferirMovimientoReducido(true));

describe("Dona", () => {
  test("total en el centro, leyenda con porcentajes en texto y un sector por fila, con colores de token", () => {
    const { container } = render(
      <Dona
        etiquetaLista="Marcas"
        centro="420 vehículos"
        filas={[
          { categoria: "B", valor: 300, porcentaje: (300 * 100) / 420 },
          { categoria: "A", valor: 120, porcentaje: (120 * 100) / 420 },
        ]}
      />,
    );
    expect(screen.getByTestId("total-dona")).toHaveTextContent("420 vehículos");
    const leyenda = screen.getByRole("list", { name: "Marcas" });
    expect(within(leyenda).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["B71,4 %", "A28,6 %"]);
    const colores = [...container.querySelectorAll(".recharts-pie-sector path")].map((p) => p.getAttribute("fill"));
    expect(colores).toHaveLength(2);
    for (const c of colores) expect(c).toMatch(/^var\(--/);
  });
});

describe("003 · paleta distinguible", () => {
  test("los 10 colores categóricos son distintos entre sí en su valor real (colors.css)", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/styles/tokens/colors.css", "utf8");
    const valor = (token: string): string => {
      const nombre = /var\((--[\w-]+)\)/.exec(token)![1];
      const v = new RegExp(`${nombre}:\s*([^;]+);`).exec(css)?.[1].trim() ?? "";
      return v.startsWith("var(") ? valor(v) : v.toLowerCase();
    };
    const { COLORES } = await import("./dona");
    expect(COLORES).toHaveLength(10);
    expect(new Set(COLORES.map(valor)).size).toBe(10);
  });
});

describe("003 · T14: porcentajes con un decimal (RNF-04)", () => {
  test("la leyenda coincide con la tabla: un decimal", async () => {
    const { Dona } = await import("./dona");
    render(<Dona etiquetaLista="Prueba" centro="3 vehículos" filas={[{ categoria: "X", valor: 2, porcentaje: 200 / 3 }, { categoria: "Y", valor: 1, porcentaje: 100 / 3 }]} />);
    expect(within(screen.getByRole("list", { name: "Prueba" })).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["X66,7 %", "Y33,3 %"]);
  });
});
