// T03 · RF-02: encabezado gris oscuro con barra de acento y página actual marcada.
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EncabezadoSitio } from "./encabezado-sitio";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta }));

const ORDEN = ["Inicio", "Implementación", "Vehículos", "Normativa", "Noticias", "Aportar"];

function enlacesMenu() {
  return within(screen.getByRole("navigation", { name: "Principal" })).getAllByRole("link");
}

describe("EncabezadoSitio (RF-02)", () => {
  beforeEach(() => {
    ruta = "/";
  });

  test("con /normativa, «Normativa» es la página actual y lleva el subrayado de acento", () => {
    ruta = "/normativa";
    render(<EncabezadoSitio />);
    for (const enlace of enlacesMenu()) {
      if (enlace.textContent === "Normativa") {
        expect(enlace).toHaveAttribute("aria-current", "page");
        expect(enlace.className).toContain("border-accent");
      } else {
        expect(enlace).not.toHaveAttribute("aria-current");
        expect(enlace.className).not.toContain("border-accent");
      }
    }
  });

  test("hay una barra de acento junto al nombre y seis entradas en orden", () => {
    render(<EncabezadoSitio />);
    const nombre = screen.getByRole("link", { name: "Observatorio de Almacenamiento de Energía" });
    const barra = nombre.querySelector('[aria-hidden="true"]');
    expect(barra).not.toBeNull();
    expect(barra!.className).toContain("bg-accent");
    expect(enlacesMenu().map((e) => e.textContent)).toEqual(ORDEN);
  });

  test.each([
    ["/", "Inicio"],
    ["/mapa", "Implementación"],
    ["/vehiculos", "Vehículos"],
    ["/noticias", "Noticias"],
    ["/aportar", "Aportar"],
    ["/normativa/algo", "Normativa"],
  ])("en %s solo «%s» es la página actual", (r, actual) => {
    ruta = r;
    render(<EncabezadoSitio />);
    const marcados = enlacesMenu().filter((e) => e.getAttribute("aria-current") === "page");
    expect(marcados.map((e) => e.textContent)).toEqual([actual]);
  });

  test("fuera del menú (p. ej. /admin) ninguna entrada se marca", () => {
    ruta = "/admin";
    render(<EncabezadoSitio />);
    expect(enlacesMenu().some((e) => e.hasAttribute("aria-current"))).toBe(false);
  });
});
