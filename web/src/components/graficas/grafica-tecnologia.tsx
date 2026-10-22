"use client";

// Dona de tecnología (spec 006, RF-07): participación en MW, MWh o número de proyectos. El
// centro muestra el total de la pestaña activa y la leyenda el porcentaje (aclaración 2).
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatoMW, formatoMWh, formatoNumero } from "@/lib/formato";
import { porTecnologia, type Medida } from "@/lib/graficas-mapa";
import { useMovimientoReducido } from "@/lib/movimiento";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { cifra } from "./grafica-estados";
import { TarjetaGrafica } from "./tarjeta-grafica";

type IdMedida = Medida | "proyectos";
const MEDIDAS: { id: IdMedida; texto: string }[] = [
  { id: "mw", texto: "Potencia [MW]" },
  { id: "mwh", texto: "Energía [MWh]" },
  { id: "proyectos", texto: "Proyectos" },
];
// Colores categóricos del design system TEJ, en orden.
const COLORES = ["var(--primary)", "var(--peach-400)", "var(--purple-400)", "var(--ink-500)", "var(--status-con)"];

function total(medida: IdMedida, valor: number) {
  if (medida === "mw") return formatoMW(valor);
  if (medida === "mwh") return formatoMWh(valor);
  return `${valor} ${valor === 1 ? "proyecto" : "proyectos"}`;
}

export function GraficaTecnologia({ proyectos }: { proyectos: ProyectoMapa[] }) {
  const [medida, setMedida] = useState<IdMedida>("mw");
  const reducido = useMovimientoReducido();
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
      <div data-animado={reducido ? "false" : "true"} className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={filas} dataKey="valor" nameKey="categoria" innerRadius="60%" outerRadius="85%" isAnimationActive={!reducido} stroke="var(--surface-card)">
              {filas.map((f, i) => (
                <Cell key={f.categoria} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p data-testid="total-dona" className="pointer-events-none absolute inset-0 grid place-items-center text-lg font-bold text-[var(--text-heading)]">
          {total(medida, suma)}
        </p>
      </div>
      <ul aria-label="Tecnologías" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {filas.map((f, i) => (
          <li key={f.categoria} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            {f.categoria}
            <span className="font-semibold">{`${formatoNumero(f.porcentaje, 0)} %`}</span>
          </li>
        ))}
      </ul>
    </TarjetaGrafica>
  );
}
