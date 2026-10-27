// Dona de tecnología (spec 006, RF-07): participación de cada tecnología en la potencia [MW].
// Sin pestañas desde el ajuste del 2026-10-24. El centro muestra el total y la leyenda el
// porcentaje (aclaración 2).
import { factorDe, formatoNumero, formatoPotencia, type Unidades } from "@/lib/formato";
import { porTecnologia } from "@/lib/graficas-mapa";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { cifra } from "./grafica-estados";
import { Dona } from "./dona";
import { TarjetaGrafica } from "./tarjeta-grafica";

// 008: en «Detrás del medidor» (unidades="kW") la potencia va en kW.
export function GraficaTecnologia({ proyectos, unidades = "MW" }: { proyectos: ProyectoMapa[]; unidades?: Unidades }) {
  const { filas, total } = porTecnologia(proyectos, "mw");
  const factor = factorDe(unidades);

  return (
    <TarjetaGrafica
      titulo="Tecnología"
      tabla={{
        encabezados: ["Tecnología", `Potencia [${unidades}]`, "Participación [%]"],
        filas: filas.map((f) => [f.categoria, cifra(f.valor * factor), formatoNumero(f.porcentaje, 1)]),
      }}
      vacia={!proyectos.length}
    >
      <Dona filas={filas} centro={formatoPotencia(total, unidades)} etiquetaLista="Tecnologías" />
    </TarjetaGrafica>
  );
}
