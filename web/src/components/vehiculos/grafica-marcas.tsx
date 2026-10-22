"use client";

// «Vehículos eléctricos vendidos por marca y año de registro» (spec 003, RF-06): barras
// horizontales apiladas por año; las 9 marcas con más ventas y «Otros». El último año se
// rotula «(parcial)» si el corte es anterior al 31 de diciembre.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { formatoNumero } from "@/lib/formato";
import { useMovimientoReducido } from "@/lib/movimiento";
import { anios, esParcial, porMarca, type LineaVehiculo } from "@/lib/vehiculos";
import { COLORES } from "../graficas/dona";
import { TarjetaGrafica } from "../graficas/tarjeta-grafica";

// Como el tablero de Looker: 2024 gris claro, 2025 gris oscuro, 2026 durazno; luego la paleta.
const COLORES_ANIOS = ["var(--purple-200)", "var(--teal-600)", "var(--peach-400)", ...COLORES.slice(3)];

const entero = (v: number) => formatoNumero(v, 0);

export function GraficaMarcas({ lineas, corte }: { lineas: LineaVehiculo[]; corte: string | null }) {
  const reducido = useMovimientoReducido();
  const marcas = porMarca(lineas);
  const años = anios(lineas);
  const rotulo = (a: number) => (esParcial(a, corte) ? `${a} (parcial)` : String(a));
  const datos = marcas.map((m) => ({ marca: m.marca, ...Object.fromEntries(años.map((a) => [`a${a}`, m.porAnio[a] ?? 0])) }));

  return (
    <TarjetaGrafica
      titulo="Vehículos eléctricos vendidos por marca y año de registro"
      tabla={{
        encabezados: ["Marca", ...años.map((a) => `${rotulo(a)} [vehículos]`), "Total [vehículos]"],
        filas: marcas.map((m) => [m.marca, ...años.map((a) => entero(m.porAnio[a] ?? 0)), entero(m.total)]),
      }}
      vacia={!lineas.length}
    >
      <div data-animado={reducido ? "false" : "true"} className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--line-300)" />
            <XAxis type="number" tickFormatter={entero} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="marca" width={90} interval={0} tick={{ fontSize: 12 }} />
            {años.map((a, i) => (
              <Bar key={a} dataKey={`a${a}`} name={rotulo(a)} stackId="anios" fill={COLORES_ANIOS[i % COLORES_ANIOS.length]} isAnimationActive={!reducido} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul aria-label="Años" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {años.map((a, i) => (
          <li key={a} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ backgroundColor: COLORES_ANIOS[i % COLORES_ANIOS.length] }} />
            {rotulo(a)}
          </li>
        ))}
      </ul>
    </TarjetaGrafica>
  );
}
