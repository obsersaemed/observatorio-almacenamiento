// KPI del inicio. Reglas del proyecto: MW (potencia) y MWh (energía) se calculan por
// separado y "en operación" cuenta solo proyectos con estado En operación.
import definicion from "@/generado/esquemas.json";
import { leerNumero } from "./esquemas";

export type ProyectoKpi = {
  estado: string;
  potencia_nominal_mw: number | null;
  capacidad_maxima_mwh: number | null;
};

export type Kpi = {
  total: number;
  porEstado: Record<string, number>;
  mwOperacion: number;
  mwhOperacion: number;
};

export const ESTADOS: string[] =
  definicion.proyectos.columnas.find((c) => c.nombre === "Estado")?.valores ?? [];

const EN_OPERACION = "En operación";
const sumar = (valores: unknown[]) => valores.reduce<number>((t, v) => t + (leerNumero(v) ?? 0), 0);

export function calcularKpi(proyectos: ProyectoKpi[]): Kpi {
  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  for (const p of proyectos) porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
  const operacion = proyectos.filter((p) => p.estado === EN_OPERACION);
  return {
    total: proyectos.length,
    porEstado,
    mwOperacion: sumar(operacion.map((p) => p.potencia_nominal_mw)),
    mwhOperacion: sumar(operacion.map((p) => p.capacidad_maxima_mwh)),
  };
}
