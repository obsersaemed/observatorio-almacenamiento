import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import Mapa, { metadata as mMapa } from "./mapa/page";
import Normativa, { metadata as mNormativa } from "./normativa/page";
import Noticias, { metadata as mNoticias } from "./noticias/page";
import Vehiculos, { metadata as mVehiculos } from "./vehiculos/page";

describe("páginas de sección (placeholder hasta las specs 002–005)", () => {
  test.each([
    [Mapa, mMapa, "Implementación en el país"],
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
