"use client";

// Barras horizontales por estado (spec 006, RF-03, RF-04), con pestañas como el tablero del
// JRC: una medida a la vez, así MW y MWh nunca comparten eje (RNF-07).
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { factorDe, formatoNumero, unidadEnergia, type Unidades } from "@/lib/formato";
import { porEstado } from "@/lib/graficas-mapa";
import { useMovimientoReducido } from "@/lib/movimiento";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { colorDe } from "../mapa/leyenda";
import { TarjetaGrafica } from "./tarjeta-grafica";

// 008: en «Detrás del medidor» potencia y energía van en kW y kWh; la duración no cambia.
const medidasDe = (unidades: Unidades) =>
  [
    { id: "mw", texto: `Potencia [${unidades}]` },
    { id: "mwh", texto: `Energía [${unidadEnergia(unidades)}]` },
    { id: "h", texto: "Duración [h]" },
  ] as const;
type IdMedida = ReturnType<typeof medidasDe>[number]["id"];

export const cifra = (v: number | null | undefined) => (v === null || v === undefined ? "—" : formatoNumero(v, 1));

export function GraficaEstados({ proyectos, unidades = "MW" }: { proyectos: ProyectoMapa[]; unidades?: Unidades }) {
  const [medida, setMedida] = useState<IdMedida>("mw");
  const reducido = useMovimientoReducido();
  const MEDIDAS = medidasDe(unidades);
  const factor = medida === "h" ? 1 : factorDe(unidades);
  const filas = porEstado(proyectos, medida).map((f) => ({ ...f, valor: f.valor === null ? null : f.valor * factor }));
  // Recharts no dibuja la etiqueta de un valor nulo: la barra va en 0 y la etiqueta dice «—»
  // (RF-04). La duración lleva su unidad en la etiqueta (CA-04.1).
  const datos = filas.map((f) => ({
    ...f,
    barra: f.valor ?? 0,
    etiqueta: f.valor === null ? "—" : medida === "h" ? `${cifra(f.valor)} h` : cifra(f.valor),
  }));
  const unidad = MEDIDAS.find((m) => m.id === medida)!.texto;

  return (
    <TarjetaGrafica
      titulo="Capacidad por estado"
      pestanas={{ etiqueta: "Medida", opciones: [...MEDIDAS], activa: medida, onCambiar: (id) => setMedida(id as IdMedida) }}
      tabla={{ encabezados: ["Estado", unidad], filas: filas.map((f) => [f.categoria, cifra(f.valor)]) }}
      vacia={!proyectos.length}
    >
      <div data-animado={reducido ? "false" : "true"} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 48, bottom: 24, left: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--line-300)" />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatoNumero(v, medida === "h" ? 1 : 0)}
              tick={{ fontSize: 12 }}
              label={{ value: unidad, position: "insideBottom", offset: -16, fontSize: 12 }}
            />
            <YAxis type="category" dataKey="categoria" width={110} tick={{ fontSize: 12 }} />
            <Bar dataKey="barra" isAnimationActive={!reducido}>
              {filas.map((f) => (
                <Cell key={f.categoria} fill={colorDe(f.categoria)} />
              ))}
              <LabelList dataKey="etiqueta" position="right" fontSize={12} fill="var(--text-body)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </TarjetaGrafica>
  );
}
