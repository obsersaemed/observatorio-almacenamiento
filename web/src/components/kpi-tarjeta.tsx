import type { ReactNode } from "react";

// Tarjeta de un indicador. role="group" + aria-label permiten leerla como una unidad.
export function KpiTarjeta({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <section
      role="group"
      aria-label={etiqueta}
      className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-card)]"
    >
      {/* Sin mayúsculas forzadas: las unidades (MWh) deben conservar su forma. */}
      <h2 className="text-sm font-semibold text-muted-foreground">
        {etiqueta}
      </h2>
      <div className="mt-2 text-3xl font-extrabold text-[var(--text-heading)]">{children}</div>
    </section>
  );
}
