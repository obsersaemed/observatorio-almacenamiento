// 007 · T09 · RF-12, RF-05 · CA-12.2: imágenes de las tarjetas del inicio. Proyectos FICTICIOS de
// prueba (nombres y coordenadas inventados para la prueba; no son datos reales).
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MiniMapaColombia } from "./mini-mapa-colombia";
import { IconoVehiculo } from "./icono-vehiculo";
import { MiniLineaNormas } from "./mini-linea-normas";
import { colorDe } from "./mapa/leyenda";

const proyectos = [
  { nombre: "Ficticio A", estado: "En operación", latitud: 4.375, longitud: -73.2136 },
  { nombre: "Ficticio B", estado: "Anunciado", latitud: 10.9, longitud: -74.8 },
  { nombre: "Ficticio C", estado: "En construcción", latitud: null, longitud: null },
  { nombre: "Ficticio D", estado: "Inactivo", latitud: 3.4, longitud: -76.5 },
];

describe("MiniMapaColombia", () => {
  test("un punto por proyecto con coordenadas", () => {
    render(<MiniMapaColombia proyectos={proyectos} />);
    expect(screen.getAllByTestId("punto-proyecto")).toHaveLength(3);
  });

  test("cada punto tiene el color de su estado y su posición según la proyección", () => {
    render(<MiniMapaColombia proyectos={proyectos} />);
    const [a, b, d] = screen.getAllByTestId("punto-proyecto");
    expect(a.style.backgroundColor).toBe(colorDe("En operación"));
    expect(b.style.backgroundColor).toBe(colorDe("Anunciado"));
    expect(d.style.backgroundColor).toBe(colorDe("Inactivo"));
    expect(parseFloat(a.style.left)).toBeCloseTo(47.7, 1);
    expect(parseFloat(a.style.top)).toBeCloseTo(48.4, 1);
    expect(a.style.left).toMatch(/%$/);
    expect(a.style.top).toMatch(/%$/);
  });

  test("la imagen de Colombia es decorativa", () => {
    const { container } = render(<MiniMapaColombia proyectos={proyectos} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(img?.getAttribute("src")).toContain("fondo-colombia.png");
  });
});

describe("imágenes decorativas de vehículos y normativa", () => {
  test("el ícono del vehículo es un SVG de trazo oculto a los lectores de pantalla", () => {
    const { container } = render(<IconoVehiculo />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg?.getAttribute("stroke")).toBeTruthy();
  });

  test("la mini línea de normas tiene 5 puntos y el último en acento", () => {
    const { container } = render(<MiniLineaNormas />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    const puntos = container.querySelectorAll("circle");
    expect(puntos).toHaveLength(5);
    expect(puntos[4].getAttribute("fill")).toBe("var(--accent)");
    expect(puntos[0].getAttribute("fill")).not.toBe("var(--accent)");
  });
});
