"use client";

// Dona genérica (spec 006 y 003): un sector por fila con colores de los tokens TEJ, el total en
// el centro y la leyenda con el porcentaje en texto (RNF-03: no solo color).
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatoNumero } from "@/lib/formato";
import { useMovimientoReducido } from "@/lib/movimiento";

// Colores categóricos de los tokens TEJ, elegidos para que se distingan entre sí y alternen
// grises con colores (una paleta solo de grises no deja leer las categorías vecinas).
export const COLORES = [
  "var(--teal-600)",
  "var(--peach-400)",
  "var(--purple-200)",
  "var(--status-op-marker)",
  "var(--peach-200)",
  "var(--teal-300)",
  "var(--status-con)",
  "var(--line-300)",
  "var(--ink-900)",
  "var(--purple-300)",
];

export type FilaDona = { categoria: string; valor: number; porcentaje: number };

export function Dona({ filas, centro, etiquetaLista }: { filas: FilaDona[]; centro: string; etiquetaLista: string }) {
  const reducido = useMovimientoReducido();
  return (
    <>
      <div data-animado={reducido ? "false" : "true"} className="relative h-56">
        {/* Los sectores de Recharts llevan role="img" sin nombre (axe svg-img-alt): el dibujo se
            oculta a lectores de pantalla porque la leyenda y la tabla dicen lo mismo (007, T23). */}
        <div aria-hidden="true" className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={filas} dataKey="valor" nameKey="categoria" innerRadius="60%" outerRadius="85%" isAnimationActive={!reducido} rootTabIndex={-1} stroke="var(--surface-card)">
                {filas.map((f, i) => (
                  <Cell key={f.categoria} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* El total cabe dentro del anillo: la cifra arriba y la unidad debajo, más pequeña. */}
        <p data-testid="total-dona" className="pointer-events-none absolute inset-0 grid place-content-center text-center leading-tight text-[var(--text-heading)]">
          <span className="text-lg font-bold">{centro.split(" ")[0]}</span>{" "}
          <span className="block text-xs">{centro.split(" ").slice(1).join(" ")}</span>
        </p>
      </div>
      <ul aria-label={etiquetaLista} className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {filas.map((f, i) => (
          <li key={f.categoria} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            {f.categoria}
            <span className="font-semibold">{`${formatoNumero(f.porcentaje, 1)} %`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
