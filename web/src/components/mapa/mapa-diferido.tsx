"use client";

// El mapa se carga solo en el navegador y después del contenido principal (RNF-02):
// MapLibre necesita WebGL y pesa unos cientos de kB.
import dynamic from "next/dynamic";

export const MapaDiferido = dynamic(() => import("./mapa-proyectos").then((m) => m.MapaProyectos), {
  ssr: false,
  loading: () => (
    <div className="grid h-[60vh] min-h-80 place-items-center rounded-[var(--radius-lg)] border border-border bg-[var(--surface-alt)] text-sm">
      Cargando el mapa…
    </div>
  ),
});
