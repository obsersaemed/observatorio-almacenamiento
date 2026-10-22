"use client";

// Las gráficas se cargan solo en el navegador y después del contenido principal (RNF-02).
import dynamic from "next/dynamic";

export const GraficasVehiculosDiferidas = dynamic(() => import("./graficas-vehiculos").then((m) => m.GraficasVehiculos), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-64 place-items-center rounded-[var(--radius-lg)] border border-border bg-card text-sm">
      Cargando las gráficas…
    </div>
  ),
});
