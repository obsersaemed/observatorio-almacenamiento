"use client";

// Fila de gráficas de /mapa (spec 006, RF-01): reciben el mismo resultado filtrado que el
// mapa, la tabla y los KPI (RF-02).
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { GraficaEstados } from "./grafica-estados";
import { GraficaEvolucion } from "./grafica-evolucion";
import { GraficaTecnologia } from "./grafica-tecnologia";

export function Graficas({ proyectos }: { proyectos: ProyectoMapa[] }) {
  return (
    <section aria-label="Gráficas" className="grid gap-4 lg:grid-cols-3">
      <GraficaEstados proyectos={proyectos} />
      <GraficaEvolucion proyectos={proyectos} />
      <GraficaTecnologia proyectos={proyectos} />
    </section>
  );
}
