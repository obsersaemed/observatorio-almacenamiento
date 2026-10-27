"use client";

// Panel del mapa de /mapa. Desde la spec 008 no tiene pestañas internas: los botones de segmento
// debajo del título (BotonesSegmento) eligen qué proyectos llegan aquí, y `unidades` dice cómo
// muestra las cifras la tarjeta del proyecto (kW/kWh en «Detrás del medidor»).
import type { Unidades } from "@/lib/formato";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { MapaDiferido } from "./mapa-diferido";

export function PanelMapa({
  proyectos,
  seleccionado,
  onSeleccionar,
  unidades = "MW",
}: {
  proyectos: ProyectoMapa[];
  seleccionado: string | null;
  onSeleccionar: (nombre: string | null) => void;
  unidades?: Unidades;
}) {
  return (
    <section aria-label="Mapa" className="grid gap-3">
      <MapaDiferido proyectos={proyectos} seleccionado={seleccionado} onSeleccionar={onSeleccionar} unidades={unidades} />
    </section>
  );
}
