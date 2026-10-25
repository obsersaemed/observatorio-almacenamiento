// 003 · T12 · RF-01, RF-02, RF-13: la vista de /vehiculos une filtros (en la URL), KPI, tabla de
// tecnología, gráficas, créditos y descarga sobre el mismo resultado. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LICENCIA } from "@/lib/csv";
import type { FilaLinea, FilaVenta } from "@/lib/vehiculos";

vi.mock("recharts", async (original) => (await import("../graficas/prueba-recharts")).rechartsConTamano(original as () => Promise<Record<string, unknown>>));
vi.mock("./graficas-vehiculos-diferidas", async () => ({ GraficasVehiculosDiferidas: (await import("./graficas-vehiculos")).GraficasVehiculos }));

const { VistaVehiculos } = await import("./vista-vehiculos");

const lineas: FilaLinea[] = [
  { marca: "Byd", linea: "Yuan", tipo_de_bateria: "LFP", capacidad_minima_kwh: 45, capacidad_maxima_kwh: 45, potencia_kw: 130 },
  { marca: "Byd", linea: "Seagull", tipo_de_bateria: "LFP", capacidad_minima_kwh: 30, capacidad_maxima_kwh: 38, potencia_kw: 55 },
  { marca: "Tesla", linea: "Model 3", tipo_de_bateria: "NMC Lithium-ion", capacidad_minima_kwh: 60, capacidad_maxima_kwh: 80, potencia_kw: null },
];
const ventas: FilaVenta[] = [
  { linea: "Yuan", ano: 2024, unidades: 100 },
  { linea: "Seagull", ano: 2025, unidades: 50 },
  { linea: "Model 3", ano: 2026, unidades: 10 },
];
const importacion = { actualizado_en: "2026-10-22T15:00:00+00:00", corte: "2026-09-17" };

const abrirFiltro = (titulo: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${titulo} `) }));
const kpi = (nombre: RegExp) => screen.getByRole("group", { name: nombre }).textContent;

beforeEach(() => window.history.replaceState(null, "", "/vehiculos"));
afterEach(() => vi.restoreAllMocks());

describe("VistaVehiculos", () => {
  test("el encabezado de las opciones del filtro dice «Vehículos», que es lo que cuenta (E2E 004, observación 1)", () => {
    render(<VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />);
    abrirFiltro("Marca");
    expect(screen.getByText("Vehículos")).toBeInTheDocument();
    expect(screen.queryByText("Proyectos")).not.toBeInTheDocument();
  });

  test("muestra filtros, créditos, KPI, tabla de tecnología y las cuatro gráficas (CA-01.1)", () => {
    render(<VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />);
    for (const t of ["Marca", "Tipo de batería", "Línea"]) expect(screen.getByRole("button", { name: new RegExp(`^${t} Todas`) })).toBeInTheDocument();
    expect(screen.getByText(/^Fuentes:/)).toHaveTextContent("Última actualización: 22/10/2026 · Ventas hasta el 17/09/2026");
    expect(kpi(/^Vehículos eléctricos registrados/)).toContain("160");
    expect(screen.getByRole("table", { name: "Participación por tipo de batería" })).toBeInTheDocument();
    expect(screen.getAllByRole("region").map((r) => r.querySelector("h2")?.textContent).filter(Boolean)).toEqual([
      "Vehículos eléctricos vendidos por marca y año de registro",
      "Participación de marcas en el mercado %",
      "Tecnología de batería",
      "Energía en circulación por tipo de batería [MWh]",
    ]);
  });

  test("un filtro por marca cambia KPI, tabla y URL, y la línea solo ofrece sus líneas (CA-02.1)", () => {
    render(<VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />);
    abrirFiltro("Marca");
    fireEvent.click(screen.getByRole("checkbox", { name: "Tesla (10)" }));
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(new URLSearchParams(window.location.search).getAll("marca")).toEqual(["Tesla"]);
    expect(kpi(/^Vehículos eléctricos registrados/)).toContain("10");
    expect(kpi(/^Energía almacenada/)).toContain("0,7 MWh"); // 10 × 70 kWh
    abrirFiltro("Línea");
    expect(within(screen.getByRole("group", { name: "Opciones de Línea" })).getAllByRole("checkbox").map((c) => c.getAttribute("aria-label"))).toEqual(["Model 3 (10)"]);
  });

  test("abrir una URL con filtros reproduce la vista (CA-02.2)", () => {
    window.history.replaceState(null, "", "/vehiculos?tipo=LFP");
    render(<VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />);
    expect(kpi(/^Vehículos eléctricos registrados/)).toContain("150");
  });

  test("sin resultados: KPI en 0 y gráficas con el aviso (CA-10.2)", () => {
    window.history.replaceState(null, "", "/vehiculos?marca=Ninguna");
    render(<VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />);
    expect(kpi(/^Vehículos eléctricos registrados/)).toContain("0");
    expect(screen.getAllByText("Sin datos para estos filtros")).toHaveLength(4);
  });

  test("la descarga trae solo las líneas filtradas, con créditos, fechas y licencia (CA-13.1)", async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:prueba"));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    window.history.replaceState(null, "", "/vehiculos?marca=Byd");
    render(<VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar CSV" }));
    const lineasCsv = (await blob!.text()).replace(/^﻿/, "").trim().split(/\r\n/);
    expect(lineasCsv[0]).toBe(LICENCIA);
    expect(lineasCsv[1]).toBe("# Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio · Última actualización: 22/10/2026 · Ventas hasta el 17/09/2026");
    expect(lineasCsv[2]).toBe("Marca,Línea,Tipo de batería,Capacidad mínima [kWh],Capacidad máxima [kWh],Potencia [kW],2024 [vehículos],2025 [vehículos],Total [vehículos],Energía [MWh]");
    expect(lineasCsv.slice(3)).toEqual(["Byd,Yuan,LFP,45,45,130,100,0,100,4.5", "Byd,Seagull,LFP,30,38,55,0,50,50,1.7"]);
  });
});

describe("003 · T13: conteos de los filtros con punto de miles (RNF-04)", () => {
  test("la opción de una línea con 1.577 vehículos se lee «(1.577)»", () => {
    render(<VistaVehiculos lineas={lineas} ventas={[...ventas, { linea: "Model 3", ano: 2025, unidades: 1_567 }]} importacion={importacion} />);
    fireEvent.click(screen.getByRole("button", { name: /^Línea / }));
    expect(screen.getByRole("checkbox", { name: "Model 3 (1.577)" })).toBeInTheDocument();
  });
});
