"use client";

// Pestañas de las gráficas (spec 006, RNF-03): patrón tablist de WAI-ARIA. Solo la activa
// está en el orden de Tab; las flechas cambian de pestaña y mueven el foco, en ciclo.
import { useRef } from "react";

export type OpcionPestana = { id: string; texto: string };

export function Pestanas({
  etiqueta,
  opciones,
  activa,
  onCambiar,
  idPanel,
}: {
  etiqueta: string;
  opciones: OpcionPestana[];
  activa: string;
  onCambiar: (id: string) => void;
  idPanel: string;
}) {
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const mover = (desde: number, paso: number) => {
    const i = (desde + paso + opciones.length) % opciones.length;
    onCambiar(opciones[i].id);
    botones.current[i]?.focus();
  };

  return (
    <div role="tablist" aria-label={etiqueta} className="inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-[var(--surface-alt)] p-1">
      {opciones.map((o, i) => {
        const elegida = o.id === activa;
        return (
          <button
            key={o.id}
            ref={(b) => {
              botones.current[i] = b;
            }}
            type="button"
            role="tab"
            aria-selected={elegida}
            aria-controls={idPanel}
            tabIndex={elegida ? 0 : -1}
            onClick={() => onCambiar(o.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") mover(i, 1);
              else if (e.key === "ArrowLeft") mover(i, -1);
            }}
            className={`rounded-[var(--radius-sm)] px-3 py-1 text-xs font-semibold ${
              elegida ? "bg-[var(--surface-header)] text-[var(--text-heading)] shadow-[var(--shadow-card)]" : "text-[var(--text-heading)]"
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
