"use client";

// Las gráficas se cargan solo en el navegador y después del contenido principal (spec 006,
// RNF-02): Recharts pesa unos 100 kB.
import dynamic from "next/dynamic";

export const GraficasDiferidas = dynamic(() => import("./graficas").then((m) => m.Graficas), {
  ssr: false,
  loading: () => (
    <div aria-label="Gráficas" role="region" className="grid min-h-64 place-items-center rounded-[var(--radius-lg)] border border-border bg-card text-sm">
      Cargando las gráficas…
    </div>
  ),
});
