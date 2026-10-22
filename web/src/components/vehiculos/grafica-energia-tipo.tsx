"use client";

// «Energía en circulación por tipo de batería [MWh]» (spec 003, RF-09): energía = unidades ×
// capacidad promedio de cada línea. Solo MWh en el eje (RNF-07).
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { formatoNumero } from "@/lib/formato";
import { useMovimientoReducido } from "@/lib/movimiento";
import { porTipo, type LineaVehiculo } from "@/lib/vehiculos";
import { TarjetaGrafica } from "../graficas/tarjeta-grafica";

const mwh = (v: number) => formatoNumero(v, 1);

export function GraficaEnergiaTipo({ lineas }: { lineas: LineaVehiculo[] }) {
  const reducido = useMovimientoReducido();
  const tipos = porTipo(lineas).map((t) => ({ ...t, etiqueta: mwh(t.mwh) }));

  return (
    <TarjetaGrafica
      titulo="Energía en circulación por tipo de batería [MWh]"
      tabla={{ encabezados: ["Tipo de batería", "Energía [MWh]"], filas: tipos.map((t) => [t.tipo, t.etiqueta]) }}
      vacia={!lineas.length}
    >
      <div data-animado={reducido ? "false" : "true"} className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tipos} margin={{ top: 20, right: 8, bottom: 4, left: 16 }}>
            <CartesianGrid vertical={false} stroke="var(--line-300)" />
            <XAxis dataKey="tipo" interval={0} tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v: number) => formatoNumero(v, 0)}
              tick={{ fontSize: 12 }}
              label={{ value: "Energía [MWh]", angle: -90, position: "insideLeft", fontSize: 12 }}
            />
            <Bar dataKey="mwh" fill="var(--primary)" isAnimationActive={!reducido}>
              <LabelList dataKey="etiqueta" position="top" fontSize={12} fill="var(--text-body)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </TarjetaGrafica>
  );
}
