// 007 · T18 · RF-23, RF-24, RF-25, RNF-03 · CA-23.1, CA-23.2, CA-24.1, CA-25.1, CA-25.2: línea
// de puntos de /normativa con salto a la ficha. Normas FICTICIAS de prueba.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Norma } from "@/lib/normativa";
import { LineaPuntos } from "./linea-puntos";
import { COLOR_ENTIDAD } from "./tarjeta-norma";
import { VistaNormativa } from "./vista-normativa";

const norma = (id: string, emisor: string, fecha: string, n: Partial<Norma> = {}): Norma => ({
  id, fecha, emisor, tipo: "Resolución", numero: id.split("-")[2], titulo: `Título ${id}`, estado: "Vigente",
  resumen: null, explicacion: null, aplica_a: null, relacionada_con: null, enlace: `https://ejemplo.co/${id}`, ...n,
});
const NORMAS = [
  norma("CREG-RES-3-2022", "CREG", "2022-02-01"),
  norma("CNO-ACU-2-2021", "CNO", "2021-06-15", { tipo: "Acuerdo" }),
  norma("MME-RES-7-2019", "MME", "2019-03-01", { precision_fecha: "Mes" }),
];

function preferirMovimientoReducido(reducir: boolean) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: reducir && consulta.includes("prefers-reduced-motion"),
    media: consulta,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

const puntos = () => within(screen.getByRole("list", { name: "Normas en el tiempo" })).getAllByRole("button");

let desplazar: ReturnType<typeof vi.fn>;
beforeEach(() => {
  window.history.replaceState(null, "", "/normativa");
  desplazar = vi.fn();
  Element.prototype.scrollIntoView = desplazar as unknown as Element["scrollIntoView"];
  preferirMovimientoReducido(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LineaPuntos", () => {
  test("un punto por norma, con el color de su emisor, y leyenda por emisor (CA-23.1)", () => {
    render(<LineaPuntos normas={NORMAS} />);
    expect(puntos()).toHaveLength(3);
    const creg = screen.getByRole("button", { name: "CREG Resolución 3, 01/02/2022: ir a su ficha" });
    expect(creg.style.backgroundColor).toBe(COLOR_ENTIDAD.CREG);
    expect(screen.getByRole("button", { name: "MME Resolución 7, marzo de 2019: ir a su ficha" })).toBeInTheDocument();
    const leyenda = within(screen.getByRole("list", { name: "Emisores" })).getAllByRole("listitem").map((l) => l.textContent);
    expect(leyenda).toEqual(["CNO", "CREG", "MME"]);
  });

  test("al pasar el mouse o enfocar un punto se ve el recuadro con emisor, tipo y número, fecha y título (CA-24.1)", () => {
    render(<LineaPuntos normas={NORMAS} />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole("button", { name: /^CNO/ }));
    const recuadro = screen.getByRole("tooltip");
    expect(recuadro).toHaveTextContent("CNO");
    expect(recuadro).toHaveTextContent("Acuerdo 2");
    expect(recuadro).toHaveTextContent("15/06/2021");
    expect(recuadro).toHaveTextContent("Título CNO-ACU-2-2021");
    fireEvent.mouseLeave(screen.getByRole("button", { name: /^CNO/ }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.focus(screen.getByRole("button", { name: /^CREG/ }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Título CREG-RES-3-2022");
    expect(screen.getByRole("button", { name: /^CREG/ })).toHaveAccessibleDescription(/Título CREG-RES-3-2022/);
  });

  test("con movimiento reducido el salto es instantáneo (RNF-03)", () => {
    preferirMovimientoReducido(true);
    render(
      <>
        <LineaPuntos normas={NORMAS} />
        <article id="norma-CNO-ACU-2-2021" tabIndex={-1} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /^CNO/ }));
    expect(desplazar).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
  });
});

describe("LineaPuntos en la vista", () => {
  test("clic en un punto: la ficha se desplaza a la vista, queda resaltada y con el foco (CA-25.1)", () => {
    render(<VistaNormativa normas={NORMAS} />);
    fireEvent.click(screen.getByRole("button", { name: /^CNO Acuerdo 2/ }));
    const ficha = document.getElementById("norma-CNO-ACU-2-2021")!;
    expect(desplazar).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    expect(desplazar.mock.contexts.at(-1)).toBe(ficha);
    expect(ficha).toHaveAttribute("data-resaltada", "true");
    expect(ficha).toHaveFocus();
    expect(document.getElementById("norma-CREG-RES-3-2022")).not.toHaveAttribute("data-resaltada");
  });

  test("Enter sobre un punto enfocado hace lo mismo (CA-25.2)", () => {
    render(<VistaNormativa normas={NORMAS} />);
    const punto = screen.getByRole("button", { name: /^CREG/ });
    punto.focus();
    fireEvent.keyDown(punto, { key: "Enter" });
    fireEvent.click(punto); // un <button> nativo convierte Enter en clic
    const ficha = document.getElementById("norma-CREG-RES-3-2022")!;
    expect(ficha).toHaveAttribute("data-resaltada", "true");
    expect(ficha).toHaveFocus();
  });

  test("va antes de la línea de tiempo y muestra solo las normas filtradas (CA-23.1, CA-23.2)", () => {
    window.history.replaceState(null, "", "/normativa?entidad=CREG");
    render(<VistaNormativa normas={NORMAS} />);
    expect(puntos()).toHaveLength(1);
    const lista = screen.getByRole("list", { name: "Normas en el tiempo" });
    expect(lista.compareDocumentPosition(screen.getByTestId("linea-tiempo")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
