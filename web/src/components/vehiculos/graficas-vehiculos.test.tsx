// 003 · T10 · RF-06 a RF-10: gráficas de /vehiculos. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { armarLineas, OTROS } from "@/lib/vehiculos";
import { preferirMovimientoReducido, rechartsConTamano } from "../graficas/prueba-recharts";

vi.mock("recharts", (original) => rechartsConTamano(original as () => Promise<Record<string, unknown>>));
const { GraficaMarcas } = await import("./grafica-marcas");
const { GraficaEnergiaTipo } = await import("./grafica-energia-tipo");
const { DonaMarcas, DonaTecnologia } = await import("./donas-vehiculos");

const muchas = armarLineas(
  Array.from({ length: 12 }, (_, i) => ({
    marca: `M${String(i).padStart(2, "0")}`, linea: `L${i}`, tipo_de_bateria: i % 3 ? "LFP" : "Lithium-ion",
    capacidad_minima_kwh: 40, capacidad_maxima_kwh: 60, potencia_kw: null,
  })),
  Array.from({ length: 12 }, (_, i) => ({ linea: `L${i}`, ano: 2024 + (i % 2), unidades: (i + 1) * 10 })),
);
const filasTabla = (region: HTMLElement) => within(region).getAllByRole("row").slice(1).map((r) => r.textContent);

beforeEach(() => preferirMovimientoReducido(true));

describe("GraficaMarcas (RF-06, CA-06.1)", () => {
  test("10 barras (9 marcas + «Otros») y leyenda por año con el último «(parcial)»", () => {
    const { container } = render(<GraficaMarcas lineas={muchas} corte="2025-06-30" />);
    const region = screen.getByRole("region", { name: "Vehículos eléctricos vendidos por marca y año de registro" });
    const marcas = [...container.querySelectorAll(".recharts-yAxis .recharts-cartesian-axis-tick-value")].map((t) => t.textContent);
    expect(marcas).toHaveLength(10);
    expect(marcas[0]).toBe("M11");
    expect(marcas[9]).toBe(OTROS);
    expect(within(region).getByRole("list", { name: "Años" })).toHaveTextContent("2024");
    expect(within(region).getByRole("list", { name: "Años" })).toHaveTextContent("2025 (parcial)");
  });

  test("la tabla trae unidades por año y el total, con punto de miles", () => {
    render(<GraficaMarcas lineas={muchas} corte="2025-06-30" />);
    const region = screen.getByRole("region", { name: /por marca y año/ });
    fireEvent.click(within(region).getByRole("button", { name: "Ver como tabla" }));
    expect(within(region).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Marca", "2024 [vehículos]", "2025 (parcial) [vehículos]", "Total [vehículos]",
    ]);
    expect(filasTabla(region).at(-1)).toBe(`${OTROS}402060`);
  });
});

describe("Donas de /vehiculos (RF-07, RF-08)", () => {
  test("participación de marcas: las mismas 10 categorías y el total de vehículos en el centro", () => {
    render(<DonaMarcas lineas={muchas} />);
    const region = screen.getByRole("region", { name: "Participación de marcas en el mercado %" });
    expect(within(region).getByTestId("total-dona")).toHaveTextContent("780 vehículos");
    expect(within(within(region).getByRole("list", { name: "Marcas" })).getAllByRole("listitem")).toHaveLength(10);
  });

  test("tecnología de batería en vehículos, con su porcentaje", () => {
    render(<DonaTecnologia lineas={muchas} />);
    const region = screen.getByRole("region", { name: "Tecnología de batería" });
    expect(within(region).getByRole("list", { name: "Tipos de batería" })).toHaveTextContent("LFP");
    fireEvent.click(within(region).getByRole("button", { name: "Ver como tabla" }));
    expect(within(region).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Tipo de batería", "Ventas [vehículos]", "Participación [%]"]);
  });
});

describe("GraficaEnergiaTipo (RF-09, CA-09.1)", () => {
  test("barras por tipo en MWh, con eje rotulado y valores es-CO que suman el total", () => {
    const { container } = render(<GraficaEnergiaTipo lineas={muchas} />);
    const textos = [...container.querySelectorAll("svg text")].map((t) => t.textContent);
    expect(textos).toContain("Energía [MWh]");
    const region = screen.getByRole("region", { name: "Energía en circulación por tipo de batería [MWh]" });
    fireEvent.click(within(region).getByRole("button", { name: "Ver como tabla" }));
    expect(filasTabla(region)).toEqual(["LFP28,0", "Lithium-ion11,0"]); // 560 y 220 vehículos × 50 kWh
  });
});

describe("Vacío (RF-10, CA-10.2)", () => {
  test("las cuatro dicen «Sin datos para estos filtros»", () => {
    render(
      <>
        <GraficaMarcas lineas={[]} corte={null} />
        <DonaMarcas lineas={[]} />
        <DonaTecnologia lineas={[]} />
        <GraficaEnergiaTipo lineas={[]} />
      </>,
    );
    expect(screen.getAllByText("Sin datos para estos filtros")).toHaveLength(4);
  });
});

describe("003 · años con colores distintos (como el tablero de Looker)", () => {
  test("cada año tiene su color y ninguno se repite", () => {
    const tres = armarLineas(
      [{ marca: "A", linea: "A1", tipo_de_bateria: "LFP", capacidad_minima_kwh: 1, capacidad_maxima_kwh: 1, potencia_kw: null }],
      [2024, 2025, 2026].map((ano) => ({ linea: "A1", ano, unidades: 1 })),
    );
    const { container } = render(<GraficaMarcas lineas={tres} corte="2026-09-17" />);
    const colores = [...container.querySelectorAll(".recharts-bar-rectangle path")].map((p) => p.getAttribute("fill"));
    expect(colores).toEqual(["var(--purple-200)", "var(--teal-600)", "var(--peach-400)"]);
  });
});

describe("003 · T15: unidad en las tablas de las donas (RNF-04)", () => {
  test("la columna de vehículos dice «Ventas [vehículos]»", () => {
    render(<DonaMarcas lineas={muchas} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Marca", "Ventas [vehículos]", "Participación [%]"]);
  });
});
