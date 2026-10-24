// Ajuste de diseño (2026-10-23): mapa de Colombia como fondo tenue en todas las páginas.
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { FondoMapa } from "./fondo-mapa";

describe("FondoMapa", () => {
  test("es solo decoración: oculto para lectores de pantalla, sin clics y detrás del contenido", () => {
    const { container } = render(<FondoMapa />);
    const fondo = container.firstElementChild as HTMLElement;
    expect(fondo).toHaveAttribute("aria-hidden", "true");
    expect(fondo).toHaveClass("pointer-events-none", "fixed", "-z-10");
  });

  test("usa la imagen optimizada del mapa y es tenue", () => {
    const { container } = render(<FondoMapa />);
    const fondo = container.firstElementChild as HTMLElement;
    expect(fondo.style.backgroundImage).toBe('url("/fondo-colombia.png")');
    expect(Number(fondo.style.opacity)).toBeLessThanOrEqual(0.15);
  });

  test("el mapa es un 30 % más pequeño que la primera versión (620 px → 434 px; 70vw → 49vw)", () => {
    const { container } = render(<FondoMapa />);
    expect(container.firstElementChild).toHaveClass("bg-[length:min(49vw,434px)_auto]");
  });

  test("con impresión no se muestra", () => {
    const { container } = render(<FondoMapa />);
    expect(container.firstElementChild).toHaveClass("print:hidden");
  });
});
