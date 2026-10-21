// T16 · RNF-03: sin violaciones automáticas de accesibilidad (axe) en las piezas públicas
// y de edición, y navegación por teclado desde el encabezado.
import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, test, vi } from "vitest";
import { ListaAportes } from "./aportes/lista";
import { EncabezadoSitio } from "./encabezado-sitio";
import { FormularioAporte } from "./formulario-aporte";
import { Inicio, PanelKpi } from "./inicio";
import { MapaProyectos } from "./mapa/mapa-proyectos";
import { TarjetaProyecto } from "./mapa/tarjeta-proyecto";
import { VistaMapa } from "./mapa/vista-mapa";
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
    project([lng, lat]: [number, number]) {
      return { x: (lng + 80) * 10, y: (13 - lat) * 10 };
    }
  }
  return { default: { Map: Mapa }, Map: Mapa };
});
vi.mock("./mapa/mapa-diferido", () => ({ MapaDiferido: () => null }));

const filaMapa = (f: Partial<FilaPublica>): FilaPublica => ({
  nombre: "Ficticio", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: "Inyección de energía en la noche", punto_de_conexion_kv: 115, departamento: "Meta",
  municipio: "Villavicencio", latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 50, capacidad_maxima_mwh: 195,
  fuente: "https://ejemplo.co", publicacion: "Aprobado", ...f,
});
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

describe("axe sin violaciones", () => {
  test.each([
    ["encabezado", <EncabezadoSitio key="e" />],
    ["inicio", <Inicio key="i" panelKpi={<PanelKpi kpi={kpi} />} />],
    ["formulario de aporte", <FormularioAporte key="f" accion={vi.fn()} siteKey="clave" />],
    ["lista de aportes", <ListaAportes key="l" aportes={[{ id: 1, tipo: "Noticia", registro_afectado: null, descripcion: "x", datos: {}, fuente: "https://e.co", origen: "usuario", agente: null, publicacion: "Pendiente", creado_en: "2026-10-20T00:00:00Z" }]} />],
    ["vista de /mapa (002 · RNF-03)", <VistaMapa key="v" filas={filasMapa} />],
    ["tarjeta del proyecto (002)", <TarjetaProyecto key="t" proyecto={aProyectoMapa(filasMapa[0])} onCerrar={vi.fn()} />],
  ])("%s", async (_nombre, elemento) => {
    const { container } = render(<div>{elemento}</div>);
    expect(await violaciones(container)).toEqual([]);
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
