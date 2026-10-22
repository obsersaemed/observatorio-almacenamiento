"use client";

// Evolución acumulada por año de FPO (spec 006, RF-05, RF-06): áreas apiladas en orden de año,
// «En operación y en construcción» y «Anunciado (proyectado)». Inactivo no se suma.
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatoNumero } from "@/lib/formato";
import { evolucion, type Medida } from "@/lib/graficas-mapa";
import { useMovimientoReducido } from "@/lib/movimiento";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { colorDe } from "../mapa/leyenda";
import { cifra } from "./grafica-estados";
import { TarjetaGrafica } from "./tarjeta-grafica";

const MEDIDAS = [
  { id: "mw", texto: "Potencia [MW]", unidad: "MW" },
  { id: "mwh", texto: "Energía [MWh]", unidad: "MWh" },
] as const;

const SERIES = [
  { clave: "firme", nombre: "En operación y en construcción", color: colorDe("En operación") },
  { clave: "anunciado", nombre: "Anunciado (proyectado)", color: colorDe("Anunciado") },
] as const;

function avisoSinAnio(n: number) {
  if (!n) return undefined;
  return n === 1
    ? "1 proyecto sin año de FPO no aparece en esta gráfica"
    : `${n} proyectos sin año de FPO no aparecen en esta gráfica`;
}

export function GraficaEvolucion({ proyectos }: { proyectos: ProyectoMapa[] }) {
  const [medida, setMedida] = useState<Medida>("mw");
  const reducido = useMovimientoReducido();
  const { puntos, sinAnio } = evolucion(proyectos, medida);
  const m = MEDIDAS.find((x) => x.id === medida)!;
  const datos = puntos.map((p) => ({ ...p, anio: String(p.anio) }));

  return (
    <TarjetaGrafica
      titulo="Evolución por año de FPO"
      pestanas={{ etiqueta: "Medida", opciones: [...MEDIDAS], activa: medida, onCambiar: (id) => setMedida(id as Medida) }}
      tabla={{
        encabezados: ["Año de FPO", ...SERIES.map((s) => `${s.nombre} [${m.unidad}]`)],
        filas: puntos.map((p) => [String(p.anio), cifra(p.firme), cifra(p.anunciado)]),
      }}
      vacia={!puntos.length}
      nota={avisoSinAnio(sinAnio)}
    >
      <div data-animado={reducido ? "false" : "true"} className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--line-300)" />
            <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v: number) => formatoNumero(v, 0)}
              tick={{ fontSize: 12 }}
              label={{ value: m.texto, angle: -90, position: "insideLeft", fontSize: 12 }}
            />
            <Tooltip formatter={(v: number) => `${cifra(v)} ${m.unidad}`} />
            {SERIES.map((s) => (
              <Area
                key={s.clave}
                type="linear"
                dataKey={s.clave}
                name={s.nombre}
                stackId="acumulado"
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.35}
                isAnimationActive={!reducido}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul aria-label="Series" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {SERIES.map((s) => (
          <li key={s.clave} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.nombre}
          </li>
        ))}
      </ul>
    </TarjetaGrafica>
  );
}
