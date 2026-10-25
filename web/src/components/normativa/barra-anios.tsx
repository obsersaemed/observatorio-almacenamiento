"use client";

// Barra de años (spec 004, RF-03): lleva al separador del año, con desplazamiento suave salvo
// con movimiento reducido (RNF-03). Solo muestra los años del resultado filtrado.
import { useMovimientoReducido } from "@/lib/movimiento";

export function BarraAnios({ anios }: { anios: string[] }) {
  const reducido = useMovimientoReducido();
  return (
    <nav aria-label="Ir al año" className="flex flex-wrap gap-2">
      {anios.map((anio) => (
        <a
          key={anio}
          href={`#anio-${anio}`}
          onClick={(e) => {
            const destino = document.getElementById(`anio-${anio}`);
            if (!destino) return;
            e.preventDefault();
            destino.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
          }}
          className="rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold hover:bg-[var(--surface-tint)]"
        >
          {anio}
        </a>
      ))}
    </nav>
  );
}
