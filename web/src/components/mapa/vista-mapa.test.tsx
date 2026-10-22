// 002 · T13 · RF-07, RF-09, RF-10, RF-13: la vista de /mapa une filtros, URL, tabla, KPI,
// mapa y descarga sobre el mismo resultado. El mapa (WebGL) se simula. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LICENCIA } from "@/lib/csv";
import type { FilaPublica } from "@/lib/proyectos-mapa";

vi.mock("./mapa-diferido", () => ({
  MapaDiferido: ({ proyectos, seleccionado }: { proyectos: { nombre: string }[]; seleccionado: string | null }) => (
    <ul aria-label="Puntos del mapa" data-seleccionado={seleccionado ?? ""}>
      {proyectos.map((p) => (
        <li key={p.nombre}>{p.nombre}</li>
      ))}
    </ul>
  ),
}));

// 006 · T07: las gráficas se cargan diferidas; aquí se usan directamente, con Recharts de tamaño fijo.
vi.mock("recharts", async (original) => (await import("../graficas/prueba-recharts")).rechartsConTamano(original as () => Promise<Record<string, unknown>>));
vi.mock("../graficas/graficas-diferidas", async () => ({ GraficasDiferidas: (await import("../graficas/graficas")).Graficas }));

const { VistaMapa } = await import("./vista-mapa");

const fila = (f: Partial<FilaPublica>): FilaPublica => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 7, capacidad_maxima_mwh: 3.9,
  fuente: "https://ejemplo.co/fuente", publicacion: "Aprobado", ...f,
});
const filas = [
  fila({ nombre: "Operando", potencia_nominal_mw: 10, capacidad_maxima_mwh: 20 }),
  fila({ nombre: "Anunciado 1", estado: "Anunciado", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195 }),
  fila({ nombre: "Anunciado 2", estado: "Anunciado", departamento: "Sucre", municipio: "Toluviejo", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195 }),
];

const filasDeTabla = () =>
  screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].querySelector("button")?.textContent);
const puntos = () => within(screen.getByRole("list", { name: "Puntos del mapa" })).queryAllByRole("listitem").map((l) => l.textContent);
// T23: las casillas de cada filtro están dentro de su desplegable.
const abrirFiltro = (titulo: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${titulo} `) }));
const proyectosFiltrados = () => screen.getByRole("group", { name: "Proyectos según filtros" }).textContent;

beforeEach(() => window.history.replaceState(null, "", "/mapa"));
afterEach(() => vi.restoreAllMocks());

describe("VistaMapa", () => {
  test("un filtro cambia a la vez la tabla, los KPI, los puntos y la URL (CA-09.1, CA-10.1)", async () => {
    render(<VistaMapa filas={filas} />);
    abrirFiltro("Estado");
    fireEvent.click(screen.getByRole("checkbox", { name: "Anunciado (2)" }));
    expect(filasDeTabla()).toEqual(["Anunciado 1", "Anunciado 2"]);
    expect(await screen.findByText("Anunciado 1", { selector: "li" })).toBeInTheDocument();
    expect(puntos()).toEqual(["Anunciado 1", "Anunciado 2"]);
    expect(proyectosFiltrados()).toContain("2");
    expect(new URLSearchParams(window.location.search).getAll("estado")).toEqual(["Anunciado"]);
  });

  test("abrir una URL con filtros reproduce la vista (CA-10.1)", () => {
    window.history.replaceState(null, "", "/mapa?departamento=Sucre");
    render(<VistaMapa filas={filas} />);
    expect(filasDeTabla()).toEqual(["Anunciado 2"]);
    abrirFiltro("Departamento");
    expect(screen.getByRole("checkbox", { name: "Sucre (1)" })).toBeChecked();
  });

  test("Limpiar filtros vacía la URL y muestra todo (CA-10.2)", () => {
    window.history.replaceState(null, "", "/mapa?estado=Anunciado");
    render(<VistaMapa filas={filas} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(window.location.search).toBe("");
    expect(filasDeTabla()).toHaveLength(3);
  });

  test("elegir una fila selecciona el proyecto en el mapa (CA-07.1)", () => {
    render(<VistaMapa filas={filas} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver Anunciado 2 en el mapa" }));
    expect(screen.getByRole("list", { name: "Puntos del mapa" })).toHaveAttribute("data-seleccionado", "Anunciado 2");
  });

  test("la descarga trae solo el resultado filtrado, con fuente y licencia (CA-13.1)", async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:prueba"));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<VistaMapa filas={filas} />);
    abrirFiltro("Departamento");
    fireEvent.click(screen.getByRole("checkbox", { name: "Sucre (1)" }));
    fireEvent.click(screen.getByRole("button", { name: /Descargar CSV/ }));

    const texto = await blob!.text();
    const lineas = texto.replace(/^﻿/, "").trim().split(/\r\n/);
    expect(lineas[0]).toBe(LICENCIA);
    expect(lineas[1].split(",")).toContain("Fuente");
    expect(lineas.slice(2)).toHaveLength(1);
    expect(lineas[2]).toContain("Anunciado 2");
    expect(texto).not.toMatch(/@/);
  });

  test("sin resultados: tabla con aviso, mapa sin puntos y KPI en 0 (CA-12.1)", () => {
    window.history.replaceState(null, "", "/mapa?estado=Inactivo");
    render(<VistaMapa filas={filas} />);
    expect(screen.getByText("Ningún proyecto cumple estos filtros")).toBeInTheDocument();
    expect(puntos()).toEqual([]);
    expect(proyectosFiltrados()).toContain("0");
  });

  test("006 · las gráficas van después de los filtros y antes del mapa (CA-01.1)", () => {
    render(<VistaMapa filas={filas} />);
    const graficas = screen.getByRole("region", { name: "Gráficas" });
    const filtros = screen.getByText(/^Filtros/, { selector: "summary" });
    const mapa = screen.getByRole("list", { name: "Puntos del mapa" });
    expect(filtros.compareDocumentPosition(graficas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(graficas.compareDocumentPosition(mapa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(graficas).getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Capacidad por estado", "Evolución por año de FPO", "Tecnología",
    ]);
  });

  test("006 · al filtrar, barras y dona suman lo mismo que los KPI «según filtros» (CA-02.1)", () => {
    render(<VistaMapa filas={filas} />);
    abrirFiltro("Departamento");
    fireEvent.click(screen.getByRole("checkbox", { name: "Sucre (1)" }));
    fireEvent.keyDown(document.body, { key: "Escape" });
    const kpiMw = screen.getByRole("group", { name: "Potencia según filtros [MW] (todos los estados)" });
    expect(kpiMw).toHaveTextContent("50,0 MW");
    const graficas = screen.getByRole("region", { name: "Gráficas" });
    const estados = within(graficas).getByRole("region", { name: "Capacidad por estado" });
    fireEvent.click(within(estados).getByRole("button", { name: "Ver como tabla" }));
    const filasEstados = within(estados).getAllByRole("row").slice(1).map((r) => r.textContent);
    expect(filasEstados).toEqual(["En operación0,0", "En construcción0,0", "Anunciado50,0", "Inactivo0,0"]);
    const dona = within(graficas).getByRole("region", { name: "Tecnología" });
    expect(within(dona).getByTestId("total-dona")).toHaveTextContent("50,0 MW");
  });
});
