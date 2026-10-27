// T16 · RNF-03: sin violaciones automáticas de accesibilidad (axe) en las piezas públicas
// y de edición, y navegación por teclado desde el encabezado.
import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, test, vi } from "vitest";
import { ListaAportes } from "./aportes/lista";
import { EncabezadoSitio } from "./encabezado-sitio";
import { FormularioAporte } from "./formulario-aporte";
import { Inicio, PanelKpi, UltimasNoticias } from "./inicio";
import { GraficaCrecimiento } from "./grafica-crecimiento";
import { MiniMapaColombia } from "./mini-mapa-colombia";
import { MapaProyectos } from "./mapa/mapa-proyectos";
import { TarjetaProyecto } from "./mapa/tarjeta-proyecto";
import { VistaMapa } from "./mapa/vista-mapa";
import { BotonesSegmento } from "./mapa/botones-segmento";
import { Graficas } from "./graficas/graficas";
import { GraficasVehiculos } from "./vehiculos/graficas-vehiculos";
import { VistaVehiculos } from "./vehiculos/vista-vehiculos";
import { VistaNormativa } from "./normativa/vista-normativa";
import { TarjetaNorma } from "./normativa/tarjeta-norma";
import { ListaNoticias } from "./noticias/lista-noticias";
import type { Norma } from "@/lib/normativa";
import { armarLineas } from "@/lib/vehiculos";
import { aProyectoMapa, type FilaPublica } from "@/lib/proyectos-mapa";

// /mapa (spec 002): MapLibre necesita WebGL; se simula con un mapa que solo sabe proyectar.
vi.mock("maplibre-gl", () => {
  class Mapa {
    on(e: string, fn: () => void) {
      if (e === "load") queueMicrotask(fn);
      return this;
    }
    off() {}
    remove() {}
    flyTo() {}
    jumpTo() {}
    addControl() {}
    project([lng, lat]: [number, number]) {
      return { x: (lng + 80) * 10, y: (13 - lat) * 10 };
    }
  }
  // 007 · T14: el mapa agrega el control de navegación (acercar y alejar).
  class NavigationControl {}
  return { default: { Map: Mapa, NavigationControl }, Map: Mapa, NavigationControl };
});
vi.mock("./mapa/mapa-diferido", () => ({ MapaDiferido: () => null }));
vi.mock("./graficas/graficas-diferidas", () => ({ GraficasDiferidas: () => null }));
vi.mock("./vehiculos/graficas-vehiculos-diferidas", () => ({ GraficasVehiculosDiferidas: () => null }));
// 006: Recharts con tamaño fijo para que dibuje en jsdom.
vi.mock("recharts", async (original) => (await import("./graficas/prueba-recharts")).rechartsConTamano(original as () => Promise<Record<string, unknown>>));

const filaMapa = (f: Partial<FilaPublica>): FilaPublica => ({
  nombre: "Ficticio", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: "Inyección de energía en la noche", punto_de_conexion_kv: 115, departamento: "Meta",
  municipio: "Villavicencio", latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 50, capacidad_maxima_mwh: 195,
  fuente: "https://ejemplo.co", publicacion: "Aprobado", ...f,
});
const lineasVe = [
  { marca: "A", linea: "A1", tipo_de_bateria: "LFP", capacidad_minima_kwh: 40, capacidad_maxima_kwh: 60, potencia_kw: null },
  { marca: "B", linea: "B1", tipo_de_bateria: "Lithium-ion", capacidad_minima_kwh: 50, capacidad_maxima_kwh: 50, potencia_kw: 100 },
];
const ventasVe = [
  { linea: "A1", ano: 2024, unidades: 100 },
  { linea: "B1", ano: 2025, unidades: 20 },
];
const filasMapa = [filaMapa({}), filaMapa({ nombre: "Sin punto", estado: "Anunciado", latitud: null, longitud: null })];

const kpi = { total: 2, porEstado: { "En operación": 1, "En construcción": 1, Anunciado: 0, Inactivo: 0 }, mwOperacion: 7, mwhOperacion: 3.9 };

async function violaciones(contenedor: Element) {
  // El contraste no se mide en jsdom y las reglas de página completa (un solo <main>,
  // todo dentro de regiones) no aplican a piezas sueltas: se revisan en el navegador (E2E).
  const r = await axe.run(contenedor, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false }, "landmark-one-main": { enabled: false } },
  });
  return r.violations.map((v) => `${v.id}: ${v.help}`);
}

describe("encabezado del sitio", () => {
  test("ofrece saltar al contenido y un menú con las secciones y aportar", () => {
    render(<EncabezadoSitio />);
    expect(screen.getByRole("link", { name: "Saltar al contenido" })).toHaveAttribute("href", "#contenido");
    const menu = screen.getByRole("navigation", { name: "Principal" });
    for (const [nombre, ruta] of [
      ["Inicio", "/"],
      ["Implementación", "/mapa"],
      ["Vehículos", "/vehiculos"],
      ["Normativa", "/normativa"],
      ["Noticias", "/noticias"],
      ["Aportar", "/aportar"],
    ]) {
      expect(within(menu).getByRole("link", { name: nombre })).toHaveAttribute("href", ruta);
    }
  });
});

// /normativa (spec 004): normas ficticias de varias entidades y un estudio.
const norma = (id: string, emisor: string, fecha: string, n: Partial<Norma> = {}): Norma => ({
  id, fecha, emisor, tipo: "Resolución", numero: id.split("-")[2], titulo: `Título ficticio ${id}`, estado: "Vigente",
  resumen: "Resumen ficticio.", explicacion: "Explicación ficticia.", aplica_a: "Operadores ficticios",
  relacionada_con: null, enlace: "https://ejemplo.co/a https://ejemplo.co/b", ...n,
});
const normasFicticias: Norma[] = [
  norma("CREG-RES-3-2022", "CREG", "2022-02-01", { relacionada_con: "CNO-ACU-1-2020" }),
  norma("CNO-ACU-1-2020", "CNO", "2020-01-01", { tipo: "Acuerdo" }),
  norma("XM-DOC-2-2024", "XM", "2024-01-01", { tipo: "Documento", estado: "En consulta" }),
  norma("MME-RES-4-2022", "MME", "2022-03-01"),
  norma("CONGRESO-LEY-5-2014", "Congreso", "2014-05-13", { tipo: "Ley" }),
  norma("UPME-DOC-6-2021", "UPME", "2021-01-01", { tipo: "Documento" }),
  norma("ACADEMIA-EST-7-2023", "Academia", "2023-01-01", { tipo: "Estudio" }),
];

describe("axe sin violaciones", () => {
  test.each([
    ["encabezado", <EncabezadoSitio key="e" />],
    ["inicio (007)", <Inicio key="i" grafica={<GraficaCrecimiento barras={[{ anio: 2021, mw: 7, proyeccion: false }, { anio: 2027, mw: 30, proyeccion: true }]} sinAnio={1} />} miniMapa={<MiniMapaColombia proyectos={[{ nombre: "Ficticio", estado: "En operación", latitud: 4.4, longitud: -73.2 }]} />} panelKpi={<PanelKpi kpi={kpi} />} noticias={<UltimasNoticias noticias={[{ fecha: "2026-01-02", titulo: "Noticia ficticia 1", medio: "Medio ficticio", enlace: "https://ejemplo.co/1", resumen: null, etiquetas: null }]} />} />],
    ["formulario de aporte", <FormularioAporte key="f" accion={vi.fn()} siteKey="clave" />],
    ["lista de aportes", <ListaAportes key="l" aportes={[{ id: 1, tipo: "Noticia", registro_afectado: null, descripcion: "x", datos: {}, fuente: "https://e.co", origen: "usuario", agente: null, publicacion: "Pendiente", creado_en: "2026-10-20T00:00:00Z" }]} />],
    ["vista de /mapa (002 · RNF-03)", <VistaMapa key="v" filas={filasMapa} />],
    ["gráficas de /mapa (006 · RNF-03)", <Graficas key="g" proyectos={filasMapa.map(aProyectoMapa)} />],
    ["vista de /vehiculos (003 · RNF-03)", <VistaVehiculos key="vv" lineas={lineasVe} ventas={ventasVe} importacion={{ actualizado_en: "2026-10-22T15:00:00Z", corte: "2026-09-17" }} />],
    ["gráficas de /vehiculos (003 · RNF-03)", <GraficasVehiculos key="gv" lineas={armarLineas(lineasVe, ventasVe)} corte="2026-09-17" />],
    ["tarjeta del proyecto (002)", <TarjetaProyecto key="t" proyecto={aProyectoMapa(filasMapa[0])} onCerrar={vi.fn()} />],
    ["lista de /noticias (005 · RNF-04)", <ListaNoticias key="ln" noticias={[{ fecha: "2026-01-02", titulo: "Noticia ficticia 1", medio: "Medio ficticio", enlace: "https://ejemplo.co/1", resumen: "Resumen ficticio.", etiquetas: null }, { fecha: "2025-05-06", titulo: "Noticia ficticia 2", medio: "Medio ficticio", enlace: "https://ejemplo.co/2", resumen: null, etiquetas: null }]} />],
    ["vista de /normativa (004 · RNF-04)", <VistaNormativa key="vn" normas={normasFicticias} />],
    ["tarjeta de norma desplegada (004 · RNF-04)", <TarjetaNorma key="tn" norma={normasFicticias[0]} relacionadas={[{ id: "CNO-ACU-1-2020", norma: normasFicticias[1], texto: "Acuerdo CNO 1 de 2020" }, { id: "MME-RES-9-2021", norma: null, texto: "Resolución MME 9 de 2021" }]} abierta onAlternar={vi.fn()} onIrA={vi.fn()} />],
  ])("%s", async (_nombre, elemento) => {
    const { container } = render(<div>{elemento}</div>);
    expect(await violaciones(container)).toEqual([]);
  });
});

// 008 · T06 · RNF-03: botones de segmento y la vista en «Detrás del medidor» (con proyectos y vacía).
describe("axe en los segmentos de /mapa (008)", () => {
  const medidor = filaMapa({ nombre: "Medidor ficticio", tipo_uso_conexion: "Maximización de autoconsumo PV y respaldo", punto_de_conexion_kv: null, potencia_nominal_mw: 0.015, capacidad_maxima_mwh: 0.04 });
  test.each([
    ["con proyectos", [...filasMapa, medidor]],
    ["sin proyectos del segmento", filasMapa],
  ])("«Detrás del medidor» %s", async (_nombre, filas) => {
    window.history.replaceState(null, "", "/mapa?segmento=detras-del-medidor");
    const { container } = render(
      <div>
        <BotonesSegmento />
        <VistaMapa filas={filas} />
      </div>,
    );
    expect(await violaciones(container)).toEqual([]);
    window.history.replaceState(null, "", "/");
  });
});

test("mapa con sus puntos y la leyenda (002 · RNF-03)", async () => {
  const { container } = render(
    <div>
      <MapaProyectos proyectos={filasMapa.map(aProyectoMapa)} seleccionado="Ficticio" onSeleccionar={vi.fn()} />
    </div>,
  );
  await screen.findByRole("button", { name: /Ficticio/ });
  expect(await violaciones(container)).toEqual([]);
});
