// Dona de tecnología (spec 006, RF-07): participación de cada tecnología en la potencia [MW].
// Sin pestañas desde el ajuste del 2026-10-24. El centro muestra el total y la leyenda el
// porcentaje (aclaración 2).
import { formatoMW, formatoNumero } from "@/lib/formato";
import { porTecnologia } from "@/lib/graficas-mapa";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { cifra } from "./grafica-estados";
import { Dona } from "./dona";
import { TarjetaGrafica } from "./tarjeta-grafica";

export function GraficaTecnologia({ proyectos }: { proyectos: ProyectoMapa[] }) {
  const { filas, total } = porTecnologia(proyectos, "mw");

  return (
    <TarjetaGrafica
      titulo="Tecnología"
      tabla={{
        encabezados: ["Tecnología", "Potencia [MW]", "Participación [%]"],
        filas: filas.map((f) => [f.categoria, cifra(f.valor), formatoNumero(f.porcentaje, 1)]),
      }}
      vacia={!proyectos.length}
    >
      <Dona filas={filas} centro={formatoMW(total)} etiquetaLista="Tecnologías" />
    </TarjetaGrafica>
  );
}
