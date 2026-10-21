// 002 · T11 · RF-01, RF-04, RF-07, RNF-03, RNF-05, RNF-06: mapa con marcadores accesibles.
// MapLibre necesita WebGL: aquí se simula y se prueba lo que hace el componente.
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";

const instancias: MapaFalso[] = [];
class MapaFalso {
  opciones: Record<string, unknown>;
  flyTo = vi.fn();
  jumpTo = vi.fn();
  remove = vi.fn();
  constructor(opciones: Record<string, unknown>) {
    this.opciones = opciones;
    instancias.push(this);
  }
  on(evento: string, fn: () => void) {
    if (evento === "load") queueMicrotask(fn);
    return this;
  }
  off() {
    return this;
  }
  project([lng, lat]: [number, number]) {
    return { x: (lng + 80) * 10, y: (13 - lat) * 10 };
  }
}
vi.mock("maplibre-gl", () => ({ default: { Map: MapaFalso }, Map: MapaFalso }));

const { MapaProyectos } = await import("./mapa-proyectos");

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 7, capacidad_maxima_mwh: 3.9, ...f,
});
const proyectos = [
  fila({ nombre: "Uno", estado: "En operación" }),
  fila({ nombre: "Dos", estado: "Anunciado", latitud: 9.3, longitud: -75.4 }),
  fila({ nombre: "Sin punto", latitud: null, longitud: null }),
].map(aProyectoMapa);

function preferirMovimientoReducido(reducido: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: reducido && q.includes("reduce"),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

async function montar(props: Partial<Parameters<typeof MapaProyectos>[0]> = {}) {
  const onSeleccionar = vi.fn();
  const r = render(<MapaProyectos proyectos={proyectos} seleccionado={null} onSeleccionar={onSeleccionar} {...props} />);
  await screen.findByRole("button", { name: /Uno/ });
  return { ...r, onSeleccionar };
}

beforeEach(() => {
  instancias.length = 0;
  preferirMovimientoReducido(false);
});
afterEach(() => vi.clearAllMocks());

describe("MapaProyectos", () => {
  test("un botón por proyecto con coordenadas, con nombre y estado, coloreado con un token (CA-01.1)", async () => {
    await montar();
    const puntos = screen.getAllByRole("button", { name: /^Uno|^Dos|^Sin punto/ });
    expect(puntos.map((b) => b.getAttribute("aria-label"))).toEqual(["Uno · En operación", "Dos · Anunciado"]);
    expect(puntos[0].style.backgroundColor).toBe("var(--status-op-marker)");
    expect(puntos[1].style.backgroundColor).toBe("var(--status-plan)");
  });

  test("atribución de OpenStreetMap y leyenda con los 4 estados en texto (RNF-03)", async () => {
    await montar();
    const opciones = instancias[0].opciones as { attributionControl: { customAttribution: string } };
    expect(opciones.attributionControl.customAttribution).toMatch(/OpenStreetMap/);
    const leyenda = screen.getByRole("list", { name: "Estados" });
    expect(within(leyenda).getAllByRole("listitem").map((l) => l.textContent)).toEqual([
      "En operación", "En construcción", "Anunciado", "Inactivo",
    ]);
  });

  test("el mouse sobre el punto abre la tarjeta y al salir se cierra (CA-04.1)", async () => {
    await montar();
    const punto = screen.getByRole("button", { name: "Uno · En operación" });
    fireEvent.mouseEnter(punto);
    expect(screen.getByRole("dialog", { name: "Uno" })).toBeInTheDocument();
    fireEvent.mouseLeave(punto);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("un toque abre la tarjeta y la deja abierta, sin mover el mapa (CA-04.2)", async () => {
    // Como en la vista: el componente es controlado y la selección vive en el padre.
    function Controlado() {
      const [s, setS] = useState<string | null>(null);
      return <MapaProyectos proyectos={proyectos} seleccionado={s} onSeleccionar={setS} />;
    }
    render(<Controlado />);
    const punto = await screen.findByRole("button", { name: "Dos · Anunciado" });
    fireEvent.click(punto);
    fireEvent.mouseLeave(punto);
    expect(screen.getByRole("dialog", { name: "Dos" })).toBeInTheDocument();
    expect(instancias[0].flyTo).not.toHaveBeenCalled();
    fireEvent.keyDown(punto, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("el foco del teclado abre la tarjeta y Escape la cierra (CA-04.3)", async () => {
    await montar();
    const punto = screen.getByRole("button", { name: "Uno · En operación" });
    fireEvent.focus(punto);
    expect(screen.getByRole("dialog", { name: "Uno" })).toBeInTheDocument();
    fireEvent.keyDown(punto, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("al elegir un proyecto desde la tabla se centra con vuelo y abre la tarjeta (CA-07.1)", async () => {
    const { rerender, onSeleccionar } = await montar();
    rerender(<MapaProyectos proyectos={proyectos} seleccionado="Dos" onSeleccionar={onSeleccionar} />);
    expect(screen.getByRole("dialog", { name: "Dos" })).toBeInTheDocument();
    expect(instancias[0].flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [-75.4, 9.3] }));
  });

  test("con movimiento reducido se centra sin animación (RNF-06)", async () => {
    preferirMovimientoReducido(true);
    const { rerender, onSeleccionar } = await montar();
    rerender(<MapaProyectos proyectos={proyectos} seleccionado="Uno" onSeleccionar={onSeleccionar} />);
    expect(instancias[0].jumpTo).toHaveBeenCalled();
    expect(instancias[0].flyTo).not.toHaveBeenCalled();
  });

  test("un proyecto elegido sin ubicación lo informa (RF-07)", async () => {
    const { rerender, onSeleccionar } = await montar();
    rerender(<MapaProyectos proyectos={proyectos} seleccionado="Sin punto" onSeleccionar={onSeleccionar} />);
    expect(screen.getByRole("status")).toHaveTextContent("Sin punto no tiene ubicación en el mapa");
  });

  test("al desmontar se libera el mapa", async () => {
    const { unmount } = await montar();
    act(() => unmount());
    expect(instancias[0].remove).toHaveBeenCalled();
  });

  // ---- Correcciones del informe E2E (T15, T16, T17)

  test("T15 · en pantalla táctil el mouse simulado del toque no abre ni cierra la tarjeta (CA-04.2)", async () => {
    function Controlado() {
      const [s, setS] = useState<string | null>(null);
      return <MapaProyectos proyectos={proyectos} seleccionado={s} onSeleccionar={setS} />;
    }
    render(<Controlado />);
    const punto = await screen.findByRole("button", { name: "Uno · En operación" });
    // Secuencia de un toque en el navegador: touchstart → mouseenter → (la tarjeta tapa el punto) mouseleave → click.
    fireEvent.touchStart(punto);
    fireEvent.mouseEnter(punto);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.mouseLeave(punto);
    fireEvent.click(punto);
    await new Promise((r) => setTimeout(r, 400));
    expect(screen.getByRole("dialog", { name: "Uno" })).toBeInTheDocument();
  });

  test("T16 · del punto a la tarjeta con el mouse la tarjeta sigue abierta; al salir de ambos se cierra (CA-04.4)", async () => {
    await montar();
    const punto = screen.getByRole("button", { name: "Uno · En operación" });
    fireEvent.mouseEnter(punto);
    const tarjeta = screen.getByRole("dialog", { name: "Uno" });
    fireEvent.mouseLeave(punto);
    fireEvent.mouseEnter(tarjeta);
    await new Promise((r) => setTimeout(r, 400));
    expect(screen.getByRole("link", { name: "Proponer corrección" })).toBeInTheDocument();
    fireEvent.mouseLeave(tarjeta);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("T16 · Enter sobre el punto deja la tarjeta abierta y lleva el foco a ella (CA-04.4)", async () => {
    function Controlado() {
      const [s, setS] = useState<string | null>(null);
      return <MapaProyectos proyectos={proyectos} seleccionado={s} onSeleccionar={setS} />;
    }
    render(<Controlado />);
    const punto = await screen.findByRole("button", { name: "Dos · Anunciado" });
    punto.focus();
    fireEvent.click(punto, { detail: 0 }); // Enter sobre un botón = clic con detail 0
    const tarjeta = screen.getByRole("dialog", { name: "Dos" });
    expect(tarjeta.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole("link", { name: "Proponer corrección" })).toBeInTheDocument();
  });

  test("T16 · si el foco pasa del punto a la tarjeta, la tarjeta no se cierra (CA-04.4)", async () => {
    await montar();
    const punto = screen.getByRole("button", { name: "Uno · En operación" });
    fireEvent.focus(punto);
    const enlace = screen.getByRole("link", { name: "Proponer corrección" });
    fireEvent.blur(punto, { relatedTarget: enlace });
    expect(screen.getByRole("dialog", { name: "Uno" })).toBeInTheDocument();
  });

  test("T17 · ningún elemento que recibe el foco queda dentro de aria-hidden y el mapa está en español (RNF-03)", async () => {
    const { container } = await montar();
    expect(container.querySelector("[aria-hidden='true'] button, [aria-hidden='true'] a, [aria-hidden='true'] [tabindex]")).toBeNull();
    expect(container.querySelector("[aria-hidden='true'] [tabindex], [aria-hidden='true'] canvas")).toBeNull();
    const contenedorMapa = (instancias[0].opciones as { container: HTMLElement }).container;
    expect(contenedorMapa.closest("[aria-hidden='true']")).toBeNull();
    const locale = (instancias[0].opciones as { locale: Record<string, string> }).locale;
    expect(locale["AttributionControl.ToggleAttribution"]).toMatch(/atribución/);
    expect(locale["Map.Title"]).toMatch(/Mapa/);
  });

  test("T20 · la tarjeta no queda dentro del marco que recorta el mapa (CA-04.2, CA-04.4)", async () => {
    await montar();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Uno · En operación" }));
    const tarjeta = screen.getByRole("dialog", { name: "Uno" });
    const contenedorMapa = (instancias[0].opciones as { container: HTMLElement }).container;
    const marco = contenedorMapa.closest(".overflow-hidden");
    expect(marco).not.toBeNull();
    expect(marco!.contains(tarjeta)).toBe(false);
  });

  test("T22 · Escape cierra la tarjeta abierta con el mouse aunque el foco esté en la página (RF-04, O-8)", async () => {
    await montar();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Uno · En operación" }));
    expect(screen.getByRole("dialog", { name: "Uno" })).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
