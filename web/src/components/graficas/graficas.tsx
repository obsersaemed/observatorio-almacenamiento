"use client";

// Fila de gráficas de /mapa (spec 006, RF-01): reciben el mismo resultado filtrado que el
// mapa, la tabla y los KPI (RF-02).
import type { Unidades } from "@/lib/formato";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { GraficaEstados } from "./grafica-estados";
import { GraficaEvolucion } from "./grafica-evolucion";
import { GraficaTecnologia } from "./grafica-tecnologia";

export function Graficas({ proyectos, unidades = "MW" }: { proyectos: ProyectoMapa[]; unidades?: Unidades }) {
  return (
    <section aria-label="Gráficas" className="grid gap-4 min-[860px]:grid-cols-3">
      <GraficaEstados proyectos={proyectos} unidades={unidades} />
      <GraficaEvolucion proyectos={proyectos} unidades={unidades} />
      <GraficaTecnologia proyectos={proyectos} unidades={unidades} />
    </section>
  );
}
