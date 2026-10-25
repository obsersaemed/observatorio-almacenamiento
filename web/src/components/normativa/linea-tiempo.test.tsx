// 004 · T06 · RF-02, RF-03, RF-06, RNF-01, RNF-03 · CA-02.1, CA-03.1, CA-06.1. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Norma } from "@/lib/normativa";
import { preferirMovimientoReducido } from "../graficas/prueba-recharts";
import { BarraAnios } from "./barra-anios";
import { LineaTiempo } from "./linea-tiempo";

const norma = (id: string, fecha: string, n: Partial<Norma> = {}): Norma => ({
  id, fecha, emisor: "CREG", tipo: "Resolución", numero: id.split("-")[2], titulo: `Título ${id}`, estado: "Vigente",
  resumen: null, explicacion: `Explicación ${id}`, aplica_a: null, relacionada_con: null, enlace: "https://ejemplo.co", ...n,
});
const VIEJA = norma("CREG-RES-098-2019", "2019-07-11");
const MEDIA = norma("CREG-RES-101023-2022", "2022-06-02");
const NUEVA = norma("CREG-RES-101113-2026", "2026-06-19", { relacionada_con: "CREG-RES-098-2019" });
const NORMAS = [VIEJA, MEDIA, NUEVA];

let desplazar: ReturnType<typeof vi.fn>;
beforeEach(() => {
  desplazar = vi.fn();
  Element.prototype.scrollIntoView = desplazar as unknown as Element["scrollIntoView"];
  preferirMovimientoReducido(false);
});

describe("LineaTiempo", () => {
  test("un separador por año, de mayor a menor, cada uno con sus normas (CA-02.1)", () => {
    render(<LineaTiempo normas={NORMAS} publicadas={NORMAS} />);
    const anios = screen.getAllByRole("region");
    expect(anios.map((a) => a.getAttribute("aria-label"))).toEqual(["2026", "2022", "2019"]);
    expect(within(anios[0]).getByRole("heading", { level: 2, name: "2026" })).toHaveAttribute("id", "anio-2026");
    expect(within(anios[2]).getByRole("article", { name: /098 de 2019/ })).toBeInTheDocument();
  });

  test("en escritorio las tarjetas se alternan a cada lado; en móvil van en una columna (RNF-01)", () => {
    render(<LineaTiempo normas={[MEDIA, norma("CNO-ACU-1-2022", "2022-01-01", { emisor: "CNO", tipo: "Acuerdo" })]} publicadas={NORMAS} />);
    const filas = screen.getAllByTestId("fila-norma");
    expect(filas[0].className).toMatch(/md:pr-/);
    expect(filas[1].className).toMatch(/md:ml-auto/);
    for (const f of filas) expect(f.className).not.toMatch(/(^|\s)(pr-|ml-auto)/);
  });

  test("el enlace a una relacionada la despliega, la lleva a la vista y le da el foco (CA-06.1)", () => {
    render(<LineaTiempo normas={NORMAS} publicadas={NORMAS} />);
    const nueva = screen.getByRole("article", { name: /101113 de 2026/ });
    fireEvent.click(within(nueva).getByRole("button", { name: /Ver explicación/ }));
    fireEvent.click(within(nueva).getByRole("link", { name: "Resolución CREG 098 de 2019" }));
    const destino = screen.getByRole("article", { name: /098 de 2019/ });
    expect(within(destino).getByRole("button", { name: /Ver explicación/ })).toHaveAttribute("aria-expanded", "true");
    expect(desplazar).toHaveBeenCalled();
    expect(destino).toHaveFocus();
  });

  test("una relacionada publicada que no está en el resultado avisa para quitar los filtros", () => {
    const onFuera = vi.fn();
    render(<LineaTiempo normas={[NUEVA]} publicadas={NORMAS} onFuera={onFuera} />);
    fireEvent.click(screen.getByRole("button", { name: /Ver explicación/ }));
    fireEvent.click(screen.getByRole("link", { name: "Resolución CREG 098 de 2019" }));
    expect(onFuera).toHaveBeenCalledWith("CREG-RES-098-2019");
  });

  test("al recibir una norma por abrir, la despliega y la lleva a la vista", () => {
    render(<LineaTiempo normas={NORMAS} publicadas={NORMAS} abrirAlCargar="CREG-RES-098-2019" />);
    expect(within(screen.getByRole("article", { name: /098 de 2019/ })).getByRole("button", { name: /Ver explicación/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(desplazar).toHaveBeenCalled();
  });
});

describe("BarraAnios (RF-03)", () => {
  test("un enlace por año que lleva a su separador (CA-03.1)", () => {
    document.body.insertAdjacentHTML("beforeend", '<h2 id="anio-2019">2019</h2>');
    render(<BarraAnios anios={["2026", "2022", "2019"]} />);
    const barra = screen.getByRole("navigation", { name: "Ir al año" });
    const enlaces = within(barra).getAllByRole("link");
    expect(enlaces.map((e) => e.textContent)).toEqual(["2026", "2022", "2019"]);
    expect(enlaces[2]).toHaveAttribute("href", "#anio-2019");
    fireEvent.click(enlaces[2]);
    expect(desplazar).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  test("con movimiento reducido el salto es inmediato (RNF-03)", () => {
    preferirMovimientoReducido(true);
    document.body.insertAdjacentHTML("beforeend", '<h2 id="anio-2026">2026</h2>');
    render(<BarraAnios anios={["2026"]} />);
    fireEvent.click(screen.getByRole("link", { name: "2026" }));
    expect(desplazar).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  test("sin años la barra queda vacía (CA-09.1)", () => {
    render(<BarraAnios anios={[]} />);
    expect(within(screen.getByRole("navigation", { name: "Ir al año" })).queryAllByRole("link")).toHaveLength(0);
  });
});
