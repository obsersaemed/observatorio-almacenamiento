// 007 · T11 · RF-12, RF-13, RF-14, RNF-01 · CA-12.1, CA-13.1, CA-14.1: inicio nuevo.
// Cifras, proyectos y noticias FICTICIOS de prueba (no son datos reales).
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Inicio, PanelKpi, UltimasNoticias } from "./inicio";
import { GraficaCrecimiento } from "./grafica-crecimiento";
import { MiniMapaColombia } from "./mini-mapa-colombia";
import type { Noticia } from "@/lib/noticias";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: consulta.includes("prefers-reduced-motion"),
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => vi.unstubAllGlobals());

const kpi = {
  total: 7,
  porEstado: { "En operación": 3, "En construcción": 1, Anunciado: 2, Inactivo: 1 },
  mwOperacion: 17,
  mwhOperacion: 10.8,
};

const noticia = (titulo: string, fecha: string): Noticia => ({
  fecha, titulo, medio: "Medio ficticio", enlace: `https://ejemplo.co/${fecha}`, resumen: null, etiquetas: null,
});

const NOTICIAS = [
  noticia("Noticia ficticia vieja", "2024-01-05"),
  noticia("Noticia ficticia 3", "2026-03-01"),
  noticia("Noticia ficticia 1", "2026-09-20"),
  noticia("Noticia ficticia 2", "2026-06-15"),
];

function renderInicio() {
  return render(
    <Inicio
      grafica={<GraficaCrecimiento barras={[{ anio: 2021, mw: 7, proyeccion: false }]} sinAnio={0} />}
      miniMapa={<MiniMapaColombia proyectos={[{ nombre: "Ficticio", estado: "En operación", latitud: 4.4, longitud: -73.2 }]} />}
      panelKpi={<PanelKpi kpi={kpi} />}
      noticias={<UltimasNoticias noticias={NOTICIAS} />}
    />,
  );
}

const antes = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("inicio (007)", () => {
  test("el orden es título, intro, gráfica, secciones, cifras, noticias y aportar", () => {
    renderInicio();
    const orden = [
      screen.getByRole("heading", { level: 1, name: "Observatorio de Sistemas de Almacenamiento de Energía en Colombia" }),
      screen.getByText(/^Explora los proyectos de almacenamiento de energía en Colombia/),
      screen.getByRole("heading", { name: "Crecimiento del almacenamiento [MW acumulados]" }),
      screen.getByRole("heading", { name: "Secciones principales" }),
      screen.getByRole("group", { name: "Potencia en operación [MW]" }),
      screen.getByRole("heading", { name: "Últimas noticias" }),
      screen.getByRole("link", { name: "Aportar" }),
    ];
    for (let i = 1; i < orden.length; i++) expect(antes(orden[i - 1], orden[i])).toBe(true);
  });

  test("tres tarjetas con título, texto original y botón a su sección (CA-12.1)", () => {
    renderInicio();
    const region = screen.getByRole("region", { name: "Secciones principales" });
    const tarjetas = within(region).getAllByRole("article");
    expect(tarjetas).toHaveLength(3);
    const esperadas = [
      ["Implementación de SAEB en Colombia", "Mapa e inventario de los SAEB en Colombia.", "Ver el mapa", "/mapa"],
      ["Almacenamiento de energía en vehículos eléctricos", "Tecnologías y oportunidades de almacenamiento energético en la movilidad eléctrica.", "Ver vehículos", "/vehiculos"],
      ["Evolución normativa de los SAEB", "Consulta el marco regulatorio de los SAEB en Colombia.", "Ver la normativa", "/normativa"],
    ];
    esperadas.forEach(([titulo, texto, boton, ruta], i) => {
      const t = within(tarjetas[i]);
      expect(t.getByRole("heading", { name: titulo })).toBeInTheDocument();
      expect(t.getByText(texto)).toBeInTheDocument();
      expect(t.getByRole("link", { name: boton })).toHaveAttribute("href", ruta);
    });
  });

  test("cada tarjeta tiene su imagen: mapa con puntos, vehículo y línea de normas", () => {
    renderInicio();
    const [impl, veh, norm] = within(screen.getByRole("region", { name: "Secciones principales" })).getAllByRole("article");
    expect(within(impl).getAllByTestId("punto-proyecto")).toHaveLength(1);
    expect(veh.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(norm.querySelectorAll("svg[aria-hidden='true'] circle")).toHaveLength(5);
  });

  test("las tarjetas van en una columna por debajo de 860 px y en tres desde ahí", () => {
    renderInicio();
    const region = screen.getByRole("region", { name: "Secciones principales" });
    const rejilla = within(region).getAllByRole("article")[0].parentElement as HTMLElement;
    expect(rejilla.className).toContain("grid");
    expect(rejilla.className).toContain("min-[860px]:grid-cols-3");
    expect(rejilla.className).not.toMatch(/(^|\s)(sm|md):grid-cols/);
  });

  test("potencia y energía en operación en tarjetas separadas y el número de proyectos (CA-13.1)", () => {
    renderInicio();
    const potencia = screen.getByRole("group", { name: "Potencia en operación [MW]" });
    const energia = screen.getByRole("group", { name: "Energía en operación [MWh]" });
    expect(potencia).not.toBe(energia);
    expect(within(potencia).getByText("17,0 MW", { selector: ".sr-only" })).toBeInTheDocument();
    expect(within(potencia).queryByText(/MWh/)).toBeNull();
    expect(within(energia).getByText("10,8 MWh", { selector: ".sr-only" })).toBeInTheDocument();
    const proyectos = screen.getByRole("group", { name: "Proyectos identificados" });
    expect(within(proyectos).getByText("7", { selector: ".sr-only" })).toBeInTheDocument();
  });

  test("últimas noticias: máximo 3, las más recientes, con fecha, y enlazan a /noticias (CA-14.1)", () => {
    renderInicio();
    const lista = screen.getByRole("list", { name: "Últimas noticias" });
    const items = within(lista).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Noticia ficticia 1");
    expect(items[0]).toHaveTextContent("20/09/2026");
    expect(items[2]).toHaveTextContent("Noticia ficticia 3");
    expect(screen.queryByText("Noticia ficticia vieja")).toBeNull();
    for (const item of items) expect(within(item).getByRole("link")).toHaveAttribute("href", "/noticias");
  });

  test("sin noticias aprobadas lo dice", () => {
    render(<UltimasNoticias noticias={[]} />);
    expect(screen.getByText(/Aún no hay noticias publicadas/)).toBeInTheDocument();
  });

  test("llamado a aportar con el botón de acento a /aportar (CA-14.1)", () => {
    renderInicio();
    const aportar = screen.getByRole("link", { name: "Aportar" });
    expect(aportar).toHaveAttribute("href", "/aportar");
    expect(aportar.className).toContain("bg-accent");
  });
});
