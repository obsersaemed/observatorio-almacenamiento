"use client";

// Dona de tecnología (spec 006, RF-07): participación en MW, MWh o número de proyectos. El
// centro muestra el total de la pestaña activa y la leyenda el porcentaje (aclaración 2).
import { useState } from "react";
import { formatoMW, formatoMWh, formatoNumero } from "@/lib/formato";
import { porTecnologia, type Medida } from "@/lib/graficas-mapa";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { cifra } from "./grafica-estados";
import { Dona } from "./dona";
import { TarjetaGrafica } from "./tarjeta-grafica";

type IdMedida = Medida | "proyectos";
const MEDIDAS: { id: IdMedida; texto: string }[] = [
  { id: "mw", texto: "Potencia [MW]" },
  { id: "mwh", texto: "Energía [MWh]" },
  { id: "proyectos", texto: "Proyectos" },
];
function total(medida: IdMedida, valor: number) {
  if (medida === "mw") return formatoMW(valor);
  if (medida === "mwh") return formatoMWh(valor);
  return `${valor} ${valor === 1 ? "proyecto" : "proyectos"}`;
}

export function GraficaTecnologia({ proyectos }: { proyectos: ProyectoMapa[] }) {
  const [medida, setMedida] = useState<IdMedida>("mw");
  const { filas, total: suma } = porTecnologia(proyectos, medida);
  const texto = MEDIDAS.find((m) => m.id === medida)!.texto;
  const valor = (v: number) => (medida === "proyectos" ? String(v) : cifra(v));

  return (
    <TarjetaGrafica
      titulo="Tecnología"
      pestanas={{ etiqueta: "Medida", opciones: MEDIDAS, activa: medida, onCambiar: (id) => setMedida(id as IdMedida) }}
      tabla={{
        encabezados: ["Tecnología", texto, "Participación [%]"],
        filas: filas.map((f) => [f.categoria, valor(f.valor), formatoNumero(f.porcentaje, 1)]),
      }}
      vacia={!proyectos.length}
    >
      <Dona filas={filas} centro={total(medida, suma)} etiquetaLista="Tecnologías" />
    </TarjetaGrafica>
  );
}
