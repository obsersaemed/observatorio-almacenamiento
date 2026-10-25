// 004 · T08 · RF-07 a RF-12 · CA-07.2, 07.3, 08.1, 09.1, 10.1, 11.1, 12.1: la vista une filtros
// (en la URL), conteo, barra de años, línea de tiempo, descarga y documentos de referencia.
// Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Norma } from "@/lib/normativa";
import { VistaNormativa } from "./vista-normativa";

const norma = (id: string, emisor: string, fecha: string, n: Partial<Norma> = {}): Norma => ({
  id, fecha, emisor, tipo: "Acuerdo", numero: id.split("-")[2], titulo: `Título ${id}`, estado: "Vigente",
  resumen: null, explicacion: null, aplica_a: null, relacionada_con: null, enlace: `https://ejemplo.co/${id}`, ...n,
});
const NORMAS = [
  norma("CNO-ACU-1-2020", "CNO", "2020-01-01"),
  norma("CNO-ACU-2-2022", "CNO", "2022-01-01"),
  norma("CREG-RES-3-2022", "CREG", "2022-02-01", { tipo: "Resolución", relacionada_con: "CNO-ACU-1-2020" }),
  norma("CREG-RES-4-2019", "CREG", "2019-02-01", { tipo: "Resolución", estado: "Derogada" }),
  norma("ACADEMIA-EST-BARRERAS-2023", "Academia", "2023-05-01", {
    tipo: "Estudio", titulo: "Estudio ficticio de barreras", aplica_a: "Universidad ficticia", resumen: "Resumen del estudio.",
  }),
];

const abrirFiltro = (titulo: string) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${titulo} `) }));
const tarjetas = () => within(screen.getByTestId("linea-tiempo")).queryAllByRole("article").map((a) => a.id.replace("norma-", ""));

beforeEach(() => {
  window.history.replaceState(null, "", "/normativa");
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

describe("VistaNormativa", () => {
  test("sin filtros muestra todas las normas, su conteo y los años en la barra", () => {
    render(<VistaNormativa normas={NORMAS} />);
    expect(tarjetas()).toEqual(["CREG-RES-3-2022", "CNO-ACU-2-2022", "CNO-ACU-1-2020", "CREG-RES-4-2019"]);
    expect(screen.getByRole("status")).toHaveTextContent("4 normas");
    expect(within(screen.getByRole("navigation", { name: "Ir al año" })).getAllByRole("link").map((l) => l.textContent)).toEqual([
      "2022",
      "2020",
      "2019",
    ]);
  });

  test("un filtro cambia la URL, el resultado, el conteo y la barra de años (CA-07.2, CA-08.1, CA-10.1)", () => {
    render(<VistaNormativa normas={NORMAS} />);
    abrirFiltro("Entidad");
    fireEvent.click(screen.getByRole("checkbox", { name: "CREG (2)" }));
    abrirFiltro("Estado");
    fireEvent.click(screen.getByRole("checkbox", { name: /^Derogada/ }));
    expect(window.location.search).toContain("entidad=CREG");
    expect(window.location.search).toContain("estado=Derogada");
    expect(tarjetas()).toEqual(["CREG-RES-4-2019"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 norma");
  });

  test("abrir una URL con filtros reproduce el resultado (CA-08.1)", () => {
    window.history.replaceState(null, "", "/normativa?entidad=CNO");
    render(<VistaNormativa normas={NORMAS} />);
    expect(tarjetas()).toEqual(["CNO-ACU-2-2022", "CNO-ACU-1-2020"]);
    expect(screen.getByRole("button", { name: /^Entidad / })).toHaveTextContent("CNO");
  });

  test("«Limpiar filtros» vuelve a todas (CA-07.3)", () => {
    window.history.replaceState(null, "", "/normativa?entidad=CNO");
    render(<VistaNormativa normas={NORMAS} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(tarjetas()).toHaveLength(4);
  });

  test("sin resultados avisa y la barra de años queda vacía (CA-09.1)", () => {
    window.history.replaceState(null, "", "/normativa?entidad=CNO&anio=2019");
    render(<VistaNormativa normas={NORMAS} />);
    expect(screen.getByText("Ninguna norma cumple estos filtros")).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Ir al año" })).queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("0 normas");
  });

  test("no ofrece descargas CSV, con o sin filtros (CA-11.1, cambio del 2026-10-25)", () => {
    render(<VistaNormativa normas={NORMAS} />);
    expect(screen.queryByRole("button", { name: /Descargar CSV/ })).not.toBeInTheDocument();
    window.history.replaceState(null, "", "/normativa?entidad=CNO");
    render(<VistaNormativa normas={NORMAS} />);
    expect(screen.queryByRole("button", { name: /Descargar/ })).not.toBeInTheDocument();
  });

  test("los estudios van en «Documentos de referencia», fuera de la línea, con cualquier filtro (CA-12.1)", () => {
    window.history.replaceState(null, "", "/normativa?entidad=CNO");
    render(<VistaNormativa normas={NORMAS} />);
    expect(tarjetas()).not.toContain("ACADEMIA-EST-BARRERAS-2023");
    const referencia = screen.getByRole("region", { name: "Documentos de referencia" });
    expect(within(referencia).getByText("Estudio ficticio de barreras")).toBeInTheDocument();
    expect(within(referencia).getByText(/Universidad ficticia/)).toBeInTheDocument();
    expect(within(referencia).getByText("Resumen del estudio.")).toBeInTheDocument();
    expect(within(referencia).getByRole("link", { name: /Ver documento/ })).toHaveAttribute("href", "https://ejemplo.co/ACADEMIA-EST-BARRERAS-2023");
  });

  test("una relacionada oculta por los filtros los quita y lleva a ella desplegada (RF-06)", () => {
    window.history.replaceState(null, "", "/normativa?entidad=CREG");
    render(<VistaNormativa normas={NORMAS} />);
    const creg = screen.getByRole("article", { name: /CREG 3 de 2022/ });
    fireEvent.click(within(creg).getByRole("button", { name: /Ver explicación/ }));
    fireEvent.click(within(creg).getByRole("link", { name: "Acuerdo CNO 1 de 2020" }));
    expect(window.location.search).toBe("");
    const destino = screen.getByRole("article", { name: /CNO 1 de 2020/ });
    expect(within(destino).getByRole("button", { name: /Ver explicación/ })).toHaveAttribute("aria-expanded", "true");
  });
});
