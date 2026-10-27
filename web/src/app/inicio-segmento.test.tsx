// 008 · T07 · RF-07, CA-07.1: el inicio (gráfica de crecimiento, cifras y mini mapa) cuenta solo
// la «Gran escala». Los componentes del inicio son de servidor (async): se resuelven a mano a
// partir del árbol de la página. Datos ficticios.
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import type { FilaPublica } from "@/lib/proyectos-mapa";

const fila = (f: Partial<FilaPublica>): FilaPublica => ({
  nombre: "X", operador: "Op", estado: "En operación", tecnologia: "Li-ion", fpo: "2024",
  tipo_uso_conexion: null, punto_de_conexion_kv: null, departamento: "Meta", municipio: "Villavicencio",
  latitud: 4.1, longitud: -73.6, potencia_nominal_mw: 10, capacidad_maxima_mwh: 20, ...f,
});

vi.mock("@/lib/datos-publicos", () => ({
  proyectosParaMapa: async () => [
    fila({ nombre: "Gran escala ficticio" }),
    fila({
      nombre: "Medidor ficticio", tipo_uso_conexion: "Maximización de autoconsumo PV y respaldo",
      potencia_nominal_mw: 0.015, capacidad_maxima_mwh: 0.04, latitud: 6.2, longitud: -75.6,
    }),
  ],
  noticiasPublicas: () => new Promise(() => {}),
}));

const { default: PaginaInicio } = await import("./page");

type Props = Record<string, unknown>;
/** Resuelve el componente async que va dentro del <Suspense> de una ranura del inicio. */
async function resolver(ranura: string): Promise<ReactElement<Props>> {
  const pagina = PaginaInicio() as ReactElement<Record<string, ReactElement<{ children: ReactElement }>>>;
  const conDatos = pagina.props[ranura].props.children;
  return (await (conDatos.type as () => Promise<ReactElement<Props>>)()) as ReactElement<Props>;
}

describe("Inicio solo con gran escala (008, CA-07.1)", () => {
  test("la gráfica de crecimiento no suma el proyecto detrás del medidor", async () => {
    const grafica = await resolver("grafica");
    const barras = grafica.props.barras as { anio: number; mw: number }[];
    expect(barras.reduce((t, b) => Math.max(t, b.mw), 0)).toBe(10);
  });

  test("el mini mapa no muestra el punto del segmento", async () => {
    const mapa = await resolver("miniMapa");
    expect((mapa.props.proyectos as { nombre: string }[]).map((p) => p.nombre)).toEqual(["Gran escala ficticio"]);
  });

  test("las cifras cuentan solo la gran escala", async () => {
    const panel = await resolver("panelKpi");
    expect(panel.props.kpi).toMatchObject({ total: 1, mwOperacion: 10, mwhOperacion: 20 });
  });
});
