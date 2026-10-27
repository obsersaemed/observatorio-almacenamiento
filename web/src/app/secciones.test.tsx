import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/datos-publicos", () => ({
  proyectosParaMapa: () => new Promise(() => {}),
  vehiculosPublicos: () => new Promise(() => {}),
  normasPublicas: () => new Promise(() => {}),
  noticiasPublicas: () => new Promise(() => {}),
}));

import Inicio from "./page";
import Mapa, { metadata as mMapa } from "./mapa/page";
import Normativa, { metadata as mNormativa } from "./normativa/page";
import Noticias, { metadata as mNoticias } from "./noticias/page";
import Vehiculos, { metadata as mVehiculos } from "./vehiculos/page";
import { TEXTOS } from "@/lib/textos";

describe("Implementación en el país (spec 002)", () => {
  test("ya no es un aviso de construcción: título, metadatos y espacio para la vista con datos", () => {
    render(<Mapa />);
    expect(screen.getByRole("heading", { level: 1, name: "Implementación de SAEB en Colombia" })).toBeInTheDocument();
    expect(screen.queryByText(/en construcción/i)).toBeNull();
    expect(screen.getByText(/Cargando los proyectos/)).toBeInTheDocument();
    expect(mMapa.title).toBe("Implementación de SAEB en Colombia");
    expect(String(mMapa.description ?? "").length).toBeGreaterThan(20);
  });
});

describe("Vehículos eléctricos (spec 003)", () => {
  test("ya no es un aviso de construcción: título, metadatos y espacio para la vista con datos", () => {
    render(<Vehiculos />);
    expect(screen.getByRole("heading", { level: 1, name: "Almacenamiento de energía en vehículos eléctricos" })).toBeInTheDocument();
    expect(screen.queryByText(/en construcción/i)).toBeNull();
    expect(screen.getByText(/Cargando los datos de vehículos/)).toBeInTheDocument();
    expect(mVehiculos.title).toBe("Almacenamiento de energía en vehículos eléctricos");
    expect(String(mVehiculos.description ?? "").length).toBeGreaterThan(20);
  });
});

describe("Evolución normativa (spec 004, RF-17)", () => {
  test("ya no es un aviso de construcción: título, metadatos y espacio para la línea de tiempo", () => {
    render(<Normativa />);
    expect(screen.getByRole("heading", { level: 1, name: "Evolución normativa de los SAEB" })).toBeInTheDocument();
    expect(screen.queryByText(/en construcción/i)).toBeNull();
    expect(screen.getByText(/Cargando las normas/)).toBeInTheDocument();
    expect(mNormativa.title).toBe("Evolución normativa de los SAEB");
    expect(String(mNormativa.description ?? "").length).toBeGreaterThan(20);
  });

  test("no ofrece la descarga de los datos completos (CA-11.1, cambio del 2026-10-25)", () => {
    render(<Normativa />);
    expect(screen.queryByRole("link", { name: /descargar datos/i })).toBeNull();
  });
});

describe("Noticias (spec 005, RF-10, RF-09)", () => {
  test("ya no es un aviso de construcción: título, metadatos y espacio para la lista", () => {
    render(<Noticias />);
    expect(screen.getByRole("heading", { level: 1, name: "Noticias" })).toBeInTheDocument();
    expect(screen.queryByText(/en construcción/i)).toBeNull();
    expect(screen.getByText(/Cargando las noticias/)).toBeInTheDocument();
    expect(mNoticias.title).toBe("Noticias");
    expect(String(mNoticias.description ?? "").length).toBeGreaterThan(20);
  });

  test("no ofrece la descarga de los datos (CA-09.1)", () => {
    render(<Noticias />);
    expect(screen.queryByRole("link", { name: /descargar datos/i })).toBeNull();
  });
});

describe("descarga de datos de cada sección (RF-14)", () => {
  test.each([
    [Mapa, "/datos/proyectos.csv"],
  ])("%#: enlaza al CSV de la sección", (Pagina, ruta) => {
    render(<Pagina />);
    expect(screen.getByRole("link", { name: /descargar datos/i })).toHaveAttribute("href", ruta);
  });
});

describe("introducción al final (007 · RF-03, CA-03.1)", () => {
  test.each([
    ["/mapa", Mapa, TEXTOS.mapa],
    ["/vehiculos", Vehiculos, TEXTOS.vehiculos],
    ["/normativa", Normativa, TEXTOS.normativa],
    ["/noticias", Noticias, TEXTOS.noticias],
  ])("%s: el h1 va primero, luego el contenido, y la intro es el último bloque del main", (_ruta, Pagina, texto) => {
    const { container } = render(<Pagina />);
    const main = container.querySelector("main")!;
    const bloques = Array.from(main.children);
    expect(bloques[0].tagName).toBe("H1");
    expect(bloques[0]).toHaveTextContent(texto.titulo);
    expect(bloques[1]).not.toHaveTextContent(texto.intro);
    expect(bloques[1]).toHaveAttribute("role", "status"); // el contenido (aún cargando) va justo después
    expect(bloques.at(-1)!.textContent).toBe(texto.intro);
  });
});

describe("inicio (007 · T11 · RF-10 a RF-14, RNF-05)", () => {
  test("muestra al instante el título, la intro y las tarjetas; la gráfica, las cifras y las noticias cargan aparte", () => {
    render(<Inicio />);
    expect(screen.getByRole("heading", { level: 1, name: TEXTOS.inicio.titulo })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.inicio.intro)).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByLabelText("Cargando la gráfica de crecimiento")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Cargando cifras")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Cargando las últimas noticias")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("link", { name: "Aportar" })).toHaveAttribute("href", "/aportar");
  });
});
