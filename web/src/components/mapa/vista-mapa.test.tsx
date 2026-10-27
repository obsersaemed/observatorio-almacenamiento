// 002 · T13 · RF-07, RF-09, RF-10, RF-13: la vista de /mapa une filtros, URL, tabla, KPI,
// mapa y descarga sobre el mismo resultado. El mapa (WebGL) se simula. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LICENCIA } from "@/lib/csv";
import type { FilaPublica } from "@/lib/proyectos-mapa";

// 008 · T06: el mapa simulado expone las unidades y deja elegir un punto (como un clic en el marcador).
vi.mock("./mapa-diferido", () => ({
  MapaDiferido: ({
    proyectos,
    seleccionado,
    onSeleccionar,
    unidades,
  }: {
    proyectos: { nombre: string }[];
    seleccionado: string | null;
    onSeleccionar: (n: string | null) => void;
    unidades?: string;
  }) => (
    <ul aria-label="Puntos del mapa" data-seleccionado={seleccionado ?? ""} data-unidades={unidades ?? ""}>
      {proyectos.map((p) => (
        <li key={p.nombre} onClick={() => onSeleccionar(p.nombre)}>
          {p.nombre}
        </li>
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
// 007 · T13: el panel empieza recogido; se despliega antes de abrir un desplegable.
const abrirFiltro = (titulo: string) => {
  const principal = screen.queryByRole("button", { name: /^Filtros/ });
  if (principal?.getAttribute("aria-expanded") === "false") fireEvent.click(principal);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${titulo} `) }));
};
const antes = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const proyectosFiltrados = () => screen.getByRole("group", { name: "Proyectos identificados" }).textContent;

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
    fireEvent.click(screen.getByRole("button", { name: "Descargar CSV" }));

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
    const filtros = screen.getByRole("button", { name: /^Filtros/ });
    const mapa = screen.getByRole("list", { name: "Puntos del mapa" });
    expect(filtros.compareDocumentPosition(graficas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(graficas.compareDocumentPosition(mapa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(graficas).getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Capacidad por estado", "Evolución por año de FPO", "Tecnología",
    ]);
  });

  test("007 · T13 · con ?estado=En operación el panel está recogido, se ve el chip y el conteo coincide (CA-08.1, CA-08.3, CA-09.1)", () => {
    window.history.replaceState(null, "", "/mapa?estado=En%20operaci%C3%B3n");
    render(<VistaMapa filas={filas} />);
    const principal = screen.getByRole("button", { name: "Filtros (1)" });
    expect(principal).toHaveAttribute("aria-expanded", "false");
    expect(filasDeTabla()).toEqual(["Operando"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 proyecto");
    fireEvent.click(screen.getByRole("button", { name: "Quitar filtro En operación" }));
    expect(window.location.search).toBe("");
    expect(screen.getByRole("status")).toHaveTextContent("3 proyectos");
    expect(filasDeTabla()).toHaveLength(3);
  });

  test("007 · T13 · el orden es KPI, barra de filtros, gráficas, mapa y tabla (CA-15.1)", () => {
    render(<VistaMapa filas={filas} />);
    const kpi = screen.getByRole("region", { name: "Instalado (en operación)" });
    const barra = screen.getByRole("button", { name: /^Filtros/ });
    const graficas = screen.getByRole("region", { name: "Gráficas" });
    const mapa = screen.getByRole("list", { name: "Puntos del mapa" });
    const tabla = screen.getByRole("table");
    expect(antes(kpi, barra)).toBe(true);
    expect(antes(barra, graficas)).toBe(true);
    expect(antes(graficas, mapa)).toBe(true);
    expect(antes(mapa, tabla)).toBe(true);
    expect(graficas).toHaveClass("min-[860px]:grid-cols-3");
  });

  // 008 · T06: reemplaza la prueba 007 · T15 (pestañas internas del mapa), retiradas por la spec 008.
  test("008 · el mapa ya no lleva pestañas internas «Tipo de almacenamiento»", () => {
    render(<VistaMapa filas={filas} />);
    expect(screen.queryByRole("tablist", { name: "Tipo de almacenamiento" })).toBeNull();
    expect(screen.getByRole("region", { name: "Mapa" })).toContainElement(screen.getByRole("list", { name: "Puntos del mapa" }));
  });

  test("006 · al filtrar, barras y dona suman lo mismo que los KPI «según filtros» (CA-02.1)", () => {
    render(<VistaMapa filas={filas} />);
    abrirFiltro("Departamento");
    fireEvent.click(screen.getByRole("checkbox", { name: "Sucre (1)" }));
    fireEvent.keyDown(document.body, { key: "Escape" });
    const kpiMw = screen.getByRole("group", { name: "Potencia total proyectada" });
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

// 008 · T06 · RF-03, RF-04, RF-05, RF-06, RF-08 · CA-01.1, CA-01.2, CA-03.2, CA-04.1, CA-04.2,
// CA-04.3, CA-06.1, CA-08.1: el segmento cambia toda la página. 7 proyectos de gran escala y 3
// ficticios del segmento «Detrás del medidor».
const { BotonesSegmento } = await import("./botones-segmento");

const MEDIDOR = "Maximización de autoconsumo PV y respaldo";
const granEscala = Array.from({ length: 7 }, (_, i) =>
  fila({ nombre: `Grande ${i + 1}`, potencia_nominal_mw: 10, capacidad_maxima_mwh: 20, tipo_uso_conexion: i % 2 ? "Inyección de energía en la noche" : null }),
);
const medidor = [
  fila({ nombre: "Casa ficticia", tipo_uso_conexion: MEDIDOR, departamento: "Antioquia", municipio: "Medellín", potencia_nominal_mw: 0.015, capacidad_maxima_mwh: 0.04, fuente: "Información de una empresa ficticia" }),
  fila({ nombre: "Comercio ficticio", tipo_uso_conexion: MEDIDOR, estado: "En construcción", departamento: "Nariño", municipio: "Ipiales", potencia_nominal_mw: 0.107, capacidad_maxima_mwh: 0.241 }),
  fila({ nombre: "Planta ficticia", tipo_uso_conexion: MEDIDOR, estado: "Anunciado", departamento: "Antioquia", municipio: "Guarne", potencia_nominal_mw: 0.03, capacidad_maxima_mwh: 0.119 }),
];
const todas = [...granEscala, ...medidor];
const NOTA = "Ubicación aproximada: cabecera del municipio";

const montarPagina = (filasPagina: FilaPublica[] = todas) =>
  render(
    <>
      <BotonesSegmento />
      <VistaMapa filas={filasPagina} />
    </>,
  );
const enSegmento = () => window.history.replaceState(null, "", "/mapa?segmento=detras-del-medidor");

describe("VistaMapa por segmento (008)", () => {
  test("en «Gran escala» (por defecto) KPI, conteo, gráficas, puntos y tabla cuentan 7, en MW (CA-01.1, CA-05.3)", () => {
    montarPagina();
    expect(filasDeTabla()).toHaveLength(7);
    expect(puntos()).toHaveLength(7);
    expect(proyectosFiltrados()).toContain("7");
    expect(screen.getByRole("status")).toHaveTextContent("7 proyectos");
    expect(screen.getByRole("group", { name: "Potencia total proyectada" })).toHaveTextContent("70,0 MW");
    expect(screen.getByRole("columnheader", { name: "Potencia [MW]" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Puntos del mapa" })).toHaveAttribute("data-unidades", "MW");
    expect(screen.queryByText(NOTA)).toBeNull();
    const dona = screen.getByRole("region", { name: "Tecnología" });
    expect(within(dona).getByTestId("total-dona")).toHaveTextContent("70,0 MW");
  });

  test("en «Detrás del medidor» todo cuenta 3, en kW y kWh, con la nota de ubicación (CA-01.2, CA-04.1, CA-05.1, CA-06.1)", () => {
    enSegmento();
    montarPagina();
    expect(filasDeTabla()).toEqual(["Casa ficticia", "Comercio ficticio", "Planta ficticia"]);
    expect(puntos()).toEqual(["Casa ficticia", "Comercio ficticio", "Planta ficticia"]);
    expect(proyectosFiltrados()).toContain("3");
    expect(screen.getByRole("status")).toHaveTextContent("3 proyectos");
    expect(screen.getByRole("group", { name: "Potencia instalada [kW]" })).toHaveTextContent("15,0 kW");
    expect(screen.getByRole("group", { name: "Energía instalada [kWh]" })).toHaveTextContent("40,0 kWh");
    expect(screen.getByRole("group", { name: "Potencia total proyectada" })).toHaveTextContent("152,0 kW");
    expect(screen.getByRole("columnheader", { name: "Potencia [kW]" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Energía [kWh]" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Puntos del mapa" })).toHaveAttribute("data-unidades", "kW");
    expect(screen.getByText(NOTA)).toBeInTheDocument();
    const estados = screen.getByRole("region", { name: "Capacidad por estado" });
    expect(within(estados).getByRole("tab", { name: "Potencia [kW]" })).toBeInTheDocument();
    const dona = screen.getByRole("region", { name: "Tecnología" });
    expect(within(dona).getByTestId("total-dona")).toHaveTextContent("152,0 kW");
  });

  test("las opciones de los filtros salen del segmento; filtrar conserva el segmento en la URL (CA-04.1)", () => {
    enSegmento();
    montarPagina();
    abrirFiltro("Departamento");
    expect(screen.getByRole("checkbox", { name: "Antioquia (2)" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Nariño (1)" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /^Meta/ })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Nariño (1)" }));
    const p = new URLSearchParams(window.location.search);
    expect(p.get("segmento")).toBe("detras-del-medidor");
    expect(p.getAll("departamento")).toEqual(["Nariño"]);
    expect(filasDeTabla()).toEqual(["Comercio ficticio"]);
  });

  test("Limpiar filtros conserva el segmento", () => {
    window.history.replaceState(null, "", "/mapa?segmento=detras-del-medidor&departamento=Nari%C3%B1o");
    montarPagina();
    expect(filasDeTabla()).toEqual(["Comercio ficticio"]);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(window.location.search).toBe("?segmento=detras-del-medidor");
    expect(filasDeTabla()).toHaveLength(3);
  });

  test("cambiar de segmento limpia los filtros y escribe ?segmento= (CA-04.2, CA-03.2)", () => {
    window.history.replaceState(null, "", "/mapa?departamento=Meta");
    montarPagina();
    expect(filasDeTabla()).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: "Detrás del medidor" }));
    expect(window.location.search).toBe("?segmento=detras-del-medidor");
    expect(screen.getByRole("button", { name: /^Filtros/ })).toHaveAccessibleName("Filtros");
    expect(filasDeTabla()).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Gran escala" }));
    expect(window.location.search).toBe("");
    expect(filasDeTabla()).toHaveLength(7);
  });

  test("un clic en un punto del segmento lo selecciona para abrir su tarjeta (CA-04.3)", () => {
    enSegmento();
    montarPagina();
    fireEvent.click(within(screen.getByRole("list", { name: "Puntos del mapa" })).getByText("Comercio ficticio"));
    expect(screen.getByRole("list", { name: "Puntos del mapa" })).toHaveAttribute("data-seleccionado", "Comercio ficticio");
  });

  test("la descarga trae solo las filas del segmento, con su fuente (RF-04, CA-09.3)", async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:prueba"));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    enSegmento();
    montarPagina();
    fireEvent.click(screen.getByRole("button", { name: "Descargar CSV" }));
    const lineas = (await blob!.text()).replace(/^﻿/, "").trim().split(/\r\n/);
    expect(lineas.slice(2)).toHaveLength(3);
    expect(lineas.slice(2).join("\n")).not.toMatch(/Grande/);
    expect(lineas[2]).toContain("Información de una empresa ficticia");
  });

  test("sin proyectos del segmento: «Sección en construcción», sin KPI, gráficas, mapa ni tabla (CA-08.1)", () => {
    enSegmento();
    montarPagina(granEscala);
    expect(screen.getByRole("heading", { name: "Sección en construcción" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aquí se publicarán los sistemas de baterías instalados en usuarios (industria, comercio y hogares), detrás del medidor. Los datos están en preparación.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Instalado (en operación)" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Gráficas" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Puntos del mapa" })).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    // Los botones siguen ahí para volver a «Gran escala».
    fireEvent.click(screen.getByRole("button", { name: "Gran escala" }));
    expect(filasDeTabla()).toHaveLength(7);
  });
});
