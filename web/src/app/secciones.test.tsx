import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/datos-publicos", () => ({ proyectosParaMapa: () => new Promise(() => {}) }));

import Mapa, { metadata as mMapa } from "./mapa/page";
import Normativa, { metadata as mNormativa } from "./normativa/page";
import Noticias, { metadata as mNoticias } from "./noticias/page";
import Vehiculos, { metadata as mVehiculos } from "./vehiculos/page";

describe("Implementación en el país (spec 002)", () => {
  test("ya no es un aviso de construcción: título, metadatos y espacio para la vista con datos", () => {
    render(<Mapa />);
    expect(screen.getByRole("heading", { level: 1, name: "Implementación en el país" })).toBeInTheDocument();
    expect(screen.queryByText(/en construcción/i)).toBeNull();
    expect(screen.getByText(/Cargando los proyectos/)).toBeInTheDocument();
    expect(mMapa.title).toBe("Implementación en el país");
    expect(String(mMapa.description ?? "").length).toBeGreaterThan(20);
  });
});

describe("páginas de sección (placeholder hasta las specs 003–005)", () => {
  test.each([
    [Vehiculos, mVehiculos, "Vehículos eléctricos"],
    [Normativa, mNormativa, "Evolución normativa"],
    [Noticias, mNoticias, "Noticias"],
  ])("%#: tiene título, aviso de construcción y metadatos propios", (Pagina, metadata, titulo) => {
    render(<Pagina />);
    expect(screen.getByRole("heading", { level: 1, name: titulo })).toBeInTheDocument();
    expect(screen.getByText(/en construcción/i)).toBeInTheDocument();
    expect(metadata.title).toBe(titulo);
    expect(String(metadata.description ?? "").length).toBeGreaterThan(20);
  });
});

describe("descarga de datos de cada sección (RF-14)", () => {
  test.each([
    [Mapa, "/datos/proyectos.csv"],
    [Normativa, "/datos/normativa.csv"],
    [Noticias, "/datos/noticias.csv"],
  ])("%#: enlaza al CSV de la sección", (Pagina, ruta) => {
    render(<Pagina />);
    expect(screen.getByRole("link", { name: /descargar datos/i })).toHaveAttribute("href", ruta);
  });
});
