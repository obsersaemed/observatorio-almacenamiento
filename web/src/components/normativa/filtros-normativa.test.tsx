// 004 · T07 · RF-07, RNF-01 · CA-07.1, CA-07.3: filtros de /normativa. Datos ficticios.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Norma } from "@/lib/normativa";
import { FiltrosNormativa } from "./filtros-normativa";

const norma = (id: string, emisor: string, fecha: string, n: Partial<Norma> = {}): Norma => ({
  id, fecha, emisor, tipo: "Acuerdo", numero: "1", titulo: "T", estado: "Vigente", resumen: null, explicacion: null,
  aplica_a: null, relacionada_con: null, enlace: "https://ejemplo.co", ...n,
});
const NORMAS = [
  norma("CNO-ACU-1-2020", "CNO", "2020-01-01"),
  norma("CNO-ACU-2-2022", "CNO", "2022-01-01"),
  norma("CREG-RES-3-2022", "CREG", "2022-02-01", { tipo: "Resolución", estado: "Derogada" }),
];

// Spec 007 (T19): el panel va recogido en la barra; se despliega antes de buscar un desplegable.
const boton = (titulo: string) => {
  const barra = screen.getByRole("button", { name: /^(Filtros|Ocultar filtros)/ });
  if (barra.getAttribute("aria-expanded") === "false") fireEvent.click(barra);
  return screen.getByRole("button", { name: new RegExp(`^${titulo} `) });
};
const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

describe("FiltrosNormativa", () => {
  test("cuatro desplegables: entidad, tipo, estado y año", () => {
    render(<FiltrosNormativa normas={NORMAS} filtros={{}} onCambiar={vi.fn()} conteo="3 normas" />);
    for (const t of ["Entidad", "Tipo", "Estado", "Año"]) expect(boton(t)).toBeInTheDocument();
  });

  test("cada opción lleva su conteo (CA-07.1)", () => {
    render(<FiltrosNormativa normas={NORMAS} filtros={{}} onCambiar={vi.fn()} conteo="3 normas" />);
    fireEvent.click(boton("Entidad"));
    expect(screen.getByRole("checkbox", { name: "CNO (2)" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "CREG (1)" })).toBeInTheDocument();
  });

  test("el encabezado de las opciones dice «Normas», no «Proyectos» (E2E 004, observación 1)", () => {
    render(<FiltrosNormativa normas={NORMAS} filtros={{}} onCambiar={vi.fn()} conteo="3 normas" />);
    fireEvent.click(boton("Entidad"));
    expect(screen.getByText("Normas")).toBeInTheDocument();
    expect(screen.queryByText("Proyectos")).not.toBeInTheDocument();
  });

  test("elegir una opción avisa los filtros nuevos; quitarla la borra", () => {
    const onCambiar = vi.fn();
    const { rerender } = render(<FiltrosNormativa normas={NORMAS} filtros={{}} onCambiar={onCambiar} conteo="3 normas" />);
    fireEvent.click(boton("Entidad"));
    fireEvent.click(screen.getByRole("checkbox", { name: "CNO (2)" }));
    expect(onCambiar).toHaveBeenLastCalledWith({ entidad: ["CNO"] });
    rerender(<FiltrosNormativa normas={NORMAS} filtros={{ entidad: ["CNO"] }} onCambiar={onCambiar} conteo="3 normas" />);
    fireEvent.click(screen.getByRole("checkbox", { name: "CNO (2)" }));
    expect(onCambiar).toHaveBeenLastCalledWith({});
  });

  // Spec 007 (T19): reemplaza «en móvil el panel empieza plegado»; ahora empieza recogido en
  // cualquier ancho (RF-08).
  test("el panel empieza recogido (RNF-01, RF-08)", () => {
    render(<FiltrosNormativa normas={NORMAS} filtros={{}} onCambiar={vi.fn()} conteo="3 normas" />);
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveAttribute("aria-expanded", "false");
  });
});
