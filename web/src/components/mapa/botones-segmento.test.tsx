// 008 · T06 · RF-03, RF-04, RNF-03 · CA-03.1, CA-03.2, CA-04.2: botones de segmento de /mapa.
// El segmento vive en la URL (?segmento=detras-del-medidor); por defecto, «Gran escala».
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { BotonesSegmento } from "./botones-segmento";

beforeEach(() => window.history.replaceState(null, "", "/mapa"));

describe("BotonesSegmento", () => {
  test("dos botones con «Gran escala» marcado por defecto (CA-03.1)", () => {
    render(<BotonesSegmento />);
    const grupo = screen.getByRole("group", { name: "Tipo de almacenamiento" });
    expect(grupo).toBeInTheDocument();
    const botones = screen.getAllByRole("button");
    expect(botones.map((b) => b.textContent)).toEqual(["Gran escala", "Detrás del medidor"]);
    expect(screen.getByRole("button", { name: "Gran escala" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Detrás del medidor" })).toHaveAttribute("aria-pressed", "false");
  });

  test("abrir la URL con ?segmento=detras-del-medidor marca ese botón (CA-03.2)", () => {
    window.history.replaceState(null, "", "/mapa?segmento=detras-del-medidor");
    render(<BotonesSegmento />);
    expect(screen.getByRole("button", { name: "Detrás del medidor" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Gran escala" })).toHaveAttribute("aria-pressed", "false");
  });

  test("cambiar de segmento escribe ?segmento= en la URL y limpia los filtros (CA-03.2, CA-04.2)", () => {
    window.history.replaceState(null, "", "/mapa?estado=Anunciado&departamento=Sucre");
    render(<BotonesSegmento />);
    fireEvent.click(screen.getByRole("button", { name: "Detrás del medidor" }));
    expect(window.location.search).toBe("?segmento=detras-del-medidor");
    expect(screen.getByRole("button", { name: "Detrás del medidor" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Gran escala" }));
    expect(window.location.search).toBe("");
  });

  test("son botones nativos en el orden de Tab: se usan con Tab y Enter (CA-03.2, RNF-03)", () => {
    render(<BotonesSegmento />);
    for (const b of screen.getAllByRole("button")) {
      expect(b.tagName).toBe("BUTTON");
      expect(b).toHaveAttribute("type", "button");
      expect(b).not.toHaveAttribute("tabindex", "-1");
    }
  });

  test("el elegido usa los tokens de selección, como las pestañas", () => {
    render(<BotonesSegmento />);
    expect(screen.getByRole("button", { name: "Gran escala" }).className).toContain("bg-[var(--surface-selected)]");
    expect(screen.getByRole("button", { name: "Gran escala" }).className).toContain("text-[var(--text-on-selected)]");
  });
});
