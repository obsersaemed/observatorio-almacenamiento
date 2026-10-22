"use client";

// Las cuatro gráficas de /vehiculos (spec 003, RF-06 a RF-09), sobre las líneas filtradas.
import type { LineaVehiculo } from "@/lib/vehiculos";
import { DonaMarcas, DonaTecnologia } from "./donas-vehiculos";
import { GraficaEnergiaTipo } from "./grafica-energia-tipo";
import { GraficaMarcas } from "./grafica-marcas";

export function GraficasVehiculos({ lineas, corte }: { lineas: LineaVehiculo[]; corte: string | null }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <GraficaMarcas lineas={lineas} corte={corte} />
        <DonaMarcas lineas={lineas} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <DonaTecnologia lineas={lineas} />
        <GraficaEnergiaTipo lineas={lineas} />
      </div>
    </div>
  );
}
