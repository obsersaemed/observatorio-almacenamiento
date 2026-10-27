"use client";

// Barra de filtros recogida (spec 007, RF-08, RF-09): botón «Filtros» que despliega el panel,
// búsqueda (si la página la tiene), los filtros activos como chips que se quitan con un clic,
// el conteo de resultados y acciones. La comparten /mapa y /normativa.
import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export type FiltroActivo = { campo: string; valor: string; etiqueta: string };

export function BarraFiltros({
  activos,
  onQuitar,
  conteo,
  busqueda,
  acciones,
  pie,
  children,
}: {
  activos: FiltroActivo[];
  onQuitar: (campo: string, valor: string) => void;
  conteo: ReactNode;
  busqueda?: ReactNode;
  acciones?: ReactNode;
  /** Nota que se ve siempre, aunque el panel esté recogido (p. ej. fuentes y fechas). */
  pie?: ReactNode;
  children: ReactNode;
}) {
  const idPanel = useId();
  const [abierto, setAbierto] = useState(false);
  const texto = abierto ? "Ocultar filtros" : activos.length ? `Filtros (${activos.length})` : "Filtros";

  return (
    <div className="grid gap-3 rounded-[10px] border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={idPanel}
          onClick={() => setAbierto((a) => !a)}
          className="inline-flex h-9 items-center gap-2 rounded-sm bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-[var(--teal-700)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          {texto}
        </button>
        {busqueda}
        {activos.length > 0 && (
          <ul aria-label="Filtros activos" className="flex flex-wrap gap-2">
            {activos.map((a) => (
              <li key={`${a.campo}:${a.valor}`}>
                <button
                  type="button"
                  aria-label={`Quitar filtro ${a.etiqueta}`}
                  onClick={() => onQuitar(a.campo, a.valor)}
                  className="inline-flex items-center gap-1 rounded-full border border-accent bg-[color-mix(in_srgb,var(--accent-soft)_35%,var(--card))] px-3 py-1 text-xs font-semibold text-[var(--text-heading)] hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {a.etiqueta}
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p role="status" className="ml-auto text-sm font-semibold text-[var(--text-heading)]">
          {conteo}
        </p>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </div>
      {pie}
      <div id={idPanel} hidden={!abierto} className="border-t border-border pt-3">
        {children}
      </div>
    </div>
  );
}
