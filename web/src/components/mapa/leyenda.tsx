// Colores de estado del mapa (tokens TEJ, RNF-05) y su leyenda en texto (RNF-03): el estado
// nunca se comunica solo con color.
import { ESTADOS } from "@/lib/kpi";

export const COLOR_ESTADO: Record<string, string> = {
  "En operación": "var(--status-op-marker)",
  "En construcción": "var(--status-con)",
  Anunciado: "var(--status-plan)",
  Inactivo: "var(--status-susp)",
};

export const colorDe = (estado: string) => COLOR_ESTADO[estado] ?? "var(--status-plan)";

export function Leyenda() {
  return (
    <ul aria-label="Estados" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {ESTADOS.map((e) => (
        <li key={e} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-full border border-card" style={{ backgroundColor: colorDe(e) }} />
          {e}
        </li>
      ))}
    </ul>
  );
}
