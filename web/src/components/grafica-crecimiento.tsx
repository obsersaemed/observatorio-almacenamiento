"use client";

// Gráfica de crecimiento del inicio (spec 007, RF-10 y RF-11): MW acumulados por año de FPO.
// Gris para lo que solo está en operación y acento para la proyección. Es la única animación del
// sitio: las barras crecen una sola vez con una transición CSS; con movimiento reducido aparecen
// en su altura final. Una tabla oculta visualmente repite las cifras para lectores de pantalla.
import { useEffect, useState } from "react";
import type { BarraCrecimiento } from "@/lib/crecimiento";
import { formatoNumero } from "@/lib/formato";
import { useMovimientoReducido } from "@/lib/movimiento";

const TITULO = "Crecimiento del almacenamiento [MW acumulados]";
const NOTA = "Las barras naranja son proyección: suman proyectos en construcción y anunciados según su año de FPO.";

export function GraficaCrecimiento({ barras, sinAnio }: { barras: BarraCrecimiento[]; sinAnio: number }) {
  const reducido = useMovimientoReducido();
  const [crecido, setCrecido] = useState(false);

  useEffect(() => {
    if (reducido) return;
    // Se pinta primero en altura 0 y en el siguiente ciclo se pasa a la final con la transición.
    const id = window.setTimeout(() => setCrecido(true), 30);
    return () => window.clearTimeout(id);
  }, [reducido]);

  const maximo = Math.max(0, ...barras.map((b) => b.mw));
  const final = (mw: number) => `${maximo ? (mw / maximo) * 100 : 0}%`;

  return (
    <section className="rounded-[var(--radius-lg)] border border-border border-t-4 border-t-accent bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-bold text-[var(--text-heading)]">{TITULO}</h2>

      <div aria-hidden="true" className="mt-4 flex h-52 items-end gap-2 sm:gap-3">
        {barras.map((b) => (
          <div key={b.anio} data-testid="barra-crecimiento" className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="text-xs font-bold text-[var(--text-heading)] sm:text-sm">{formatoNumero(b.mw, 1)}</span>
            <div className="flex w-full flex-1 items-end justify-center pt-1">
              <div
                data-testid="columna"
                className="w-full max-w-12 rounded-t-sm"
                style={{
                  backgroundColor: b.proyeccion ? "var(--accent)" : "var(--brand-ink)",
                  height: reducido || crecido ? final(b.mw) : "0%",
                  transition: reducido || !crecido ? "none" : "height 900ms ease-out",
                }}
              />
            </div>
            <span className="mt-1 text-xs text-muted-foreground sm:text-sm">{b.anio}</span>
          </div>
        ))}
      </div>

      {/* La tabla va dentro del contenedor sr-only: con sr-only en la <table> su ancho mínimo
          ensanchaba la página a 375 px (RNF-01). */}
      <div className="sr-only">
        <table>
          <caption>{TITULO}</caption>
          <thead>
            <tr>
              <th scope="col">Año de FPO</th>
              <th scope="col">Potencia acumulada [MW]</th>
              <th scope="col">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {barras.map((b) => (
              <tr key={b.anio}>
                <th scope="row">{b.anio}</th>
                <td>{formatoNumero(b.mw, 1)}</td>
                <td>{b.proyeccion ? "Proyección" : "En operación"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{NOTA}</p>
      {sinAnio > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {sinAnio === 1 ? "1 proyecto sin año de FPO no se incluye." : `${sinAnio} proyectos sin año de FPO no se incluyen.`}
        </p>
      )}
    </section>
  );
}
