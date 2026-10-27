// 007 · T12 · RF-08, RF-09 · CA-08.1, CA-08.2, CA-08.3, CA-09.1: barra de filtros recogida con
// chips de los filtros activos y conteo. Datos ficticios.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { BarraFiltros } from "./barra-filtros";

const boton = () => screen.getByRole("button", { name: /filtros/i });

describe("BarraFiltros", () => {
  test("al montar el panel está recogido y el botón dice «Filtros» (CA-08.1)", () => {
    render(
      <BarraFiltros activos={[]} onQuitar={vi.fn()} conteo="3 proyectos">
        <p>Contenido del panel</p>
      </BarraFiltros>,
    );
    expect(boton()).toHaveAccessibleName("Filtros");
    expect(boton()).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(boton().getAttribute("aria-controls")!);
    expect(panel).not.toBeNull();
    expect(panel).not.toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("3 proyectos");
  });

  test("al pulsar el botón se despliega el panel y dice «Ocultar filtros»; otro clic lo recoge (CA-08.2)", () => {
    render(
      <BarraFiltros activos={[]} onQuitar={vi.fn()} conteo="3 proyectos">
        <p>Contenido del panel</p>
      </BarraFiltros>,
    );
    fireEvent.click(boton());
    expect(boton()).toHaveAccessibleName("Ocultar filtros");
    expect(boton()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Contenido del panel")).toBeVisible();
    fireEvent.click(boton());
    expect(boton()).toHaveAccessibleName("Filtros");
    expect(screen.getByText("Contenido del panel")).not.toBeVisible();
  });

  test("con un filtro activo el botón dice «Filtros (1)» y el chip lo quita (CA-08.3, CA-09.1)", () => {
    const onQuitar = vi.fn();
    render(
      <BarraFiltros
        activos={[{ campo: "estado", valor: "En operación", etiqueta: "En operación" }]}
        onQuitar={onQuitar}
        conteo="1 proyecto"
      >
        <p>Contenido del panel</p>
      </BarraFiltros>,
    );
    expect(boton()).toHaveAccessibleName("Filtros (1)");
    expect(boton()).toHaveAttribute("aria-expanded", "false");
    const chip = screen.getByRole("button", { name: "Quitar filtro En operación" });
    expect(chip).toHaveTextContent("En operación");
    expect(chip.querySelector("svg.lucide")).not.toBeNull();
    fireEvent.click(chip);
    expect(onQuitar).toHaveBeenCalledWith("estado", "En operación");
    expect(screen.getByRole("status")).toHaveTextContent("1 proyecto");
  });

  test("muestra la búsqueda y las acciones cuando se pasan", () => {
    render(
      <BarraFiltros
        activos={[]}
        onQuitar={vi.fn()}
        conteo="3 proyectos"
        busqueda={<input type="search" aria-label="Buscar" />}
        acciones={<button type="button">Descargar CSV</button>}
      >
        <p>Contenido del panel</p>
      </BarraFiltros>,
    );
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar CSV" })).toBeInTheDocument();
  });
});
