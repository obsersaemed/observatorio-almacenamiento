// 002 · T08 · RF-02, RF-03, RF-12, RNF-04: tabla ordenable de /mapa. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { aProyectoMapa, type FilaProyecto } from "@/lib/proyectos-mapa";
import { TablaProyectos } from "./tabla-proyectos";

const fila = (f: Partial<FilaProyecto>): FilaProyecto => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 1, capacidad_maxima_mwh: 1, ...f,
});

const proyectos = [
  fila({ nombre: "Pequeño", potencia_nominal_mw: 1.5, capacidad_maxima_mwh: 2 }),
  fila({ nombre: "Grande", potencia_nominal_mw: 50, capacidad_maxima_mwh: 195, tipo_uso_conexion: "Inyección de energía en la noche" }),
  fila({ nombre: "Sin coordenadas", latitud: null, longitud: null, potencia_nominal_mw: 9 }),
].map(aProyectoMapa);

const nombresDeFilas = () =>
  screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("TablaProyectos", () => {
  test("encabezados con unidades entre corchetes y cifras con coma decimal (RNF-04)", () => {
    render(<TablaProyectos proyectos={proyectos} onElegir={vi.fn()} />);
    const encabezados = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(encabezados).toEqual([
      "Nombre", "Operador", "Estado", "Servicios", "Departamento", "Municipio",
      "Potencia [MW]", "Energía [MWh]", "Año de FPO",
    ]);
    expect(screen.getByRole("cell", { name: "1,5" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Inyección de energía en la noche" })).toBeInTheDocument();
  });

  test("ordena por potencia de mayor a menor (CA-02.1)", () => {
    render(<TablaProyectos proyectos={proyectos} onElegir={vi.fn()} />);
    const boton = screen.getByRole("button", { name: /Potencia \[MW\]/ });
    fireEvent.click(boton); // ascendente
    fireEvent.click(boton); // descendente
    expect(nombresDeFilas()[0]).toMatch(/^Grande/);
    expect(screen.getByRole("columnheader", { name: /Potencia/ })).toHaveAttribute("aria-sort", "descending");
  });

  test("marca los proyectos sin ubicación en el mapa (CA-03.1)", () => {
    render(<TablaProyectos proyectos={proyectos} onElegir={vi.fn()} />);
    const fila = screen.getByRole("row", { name: /Sin coordenadas/ });
    expect(within(fila).getByText("sin ubicación en el mapa")).toBeInTheDocument();
  });

  test("con el resultado vacío muestra el aviso (CA-12.1)", () => {
    render(<TablaProyectos proyectos={[]} onElegir={vi.fn()} />);
    expect(screen.getByText("Ningún proyecto cumple estos filtros")).toBeInTheDocument();
  });

  test("cada proyecto se puede elegir con un botón accesible por teclado (RF-07)", () => {
    const onElegir = vi.fn();
    render(<TablaProyectos proyectos={proyectos} onElegir={onElegir} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver Grande en el mapa" }));
    expect(onElegir).toHaveBeenCalledWith("Grande");
  });
});
