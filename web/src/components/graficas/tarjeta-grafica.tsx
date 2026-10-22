"use client";

// Tarjeta común de las gráficas de /mapa (spec 006): título, pestañas de medida, dibujo o su
// tabla equivalente (RF-08) y el aviso de vacío (RF-09).
import { useId, useState, type ReactNode } from "react";
import { Pestanas, type OpcionPestana } from "./pestanas";

export type TablaEquivalente = { encabezados: string[]; filas: string[][] };

export function TarjetaGrafica({
  titulo,
  pestanas,
  tabla,
  vacia,
  nota,
  children,
}: {
  titulo: string;
  /** Opcional: una gráfica de una sola medida no lleva pestañas (003). */
  pestanas?: { etiqueta: string; opciones: OpcionPestana[]; activa: string; onCambiar: (id: string) => void };
  tabla: TablaEquivalente;
  vacia: boolean;
  nota?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [comoTabla, setComoTabla] = useState(false);

  return (
    <section aria-labelledby={`${id}-titulo`} className="grid min-w-0 content-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 id={`${id}-titulo`} className="text-base font-bold text-[var(--text-heading)]">
        {titulo}
      </h2>
      {pestanas && <Pestanas {...pestanas} idPanel={`${id}-panel`} />}
      <div id={`${id}-panel`} role={pestanas ? "tabpanel" : undefined} aria-labelledby={pestanas ? `${id}-titulo` : undefined} className="min-w-0">
        {vacia ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para estos filtros</p>
        ) : comoTabla ? (
          // Con desplazamiento propio: a 375 px una tabla ancha no mueve la página (RNF-01).
          // Región con nombre y en el orden de Tab: así el desplazamiento también se usa con teclado (RNF-03).
          <div className="overflow-x-auto" role="region" aria-label={`Tabla de ${titulo}`} tabIndex={0}>
          <table aria-labelledby={`${id}-titulo`} className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {tabla.encabezados.map((e) => (
                  <th key={e} scope="col" className="py-1 pr-2 font-semibold text-[var(--text-heading)]">
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabla.filas.map((fila) => (
                <tr key={fila[0]} className="border-b border-border last:border-0">
                  {fila.map((celda, i) => (
                    <td key={i} className={`py-1 pr-2 ${i ? "text-right tabular-nums" : ""}`}>
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          children
        )}
      </div>
      {!vacia && nota && <p className="text-xs text-muted-foreground">{nota}</p>}
      {!vacia && (
        <button type="button" onClick={() => setComoTabla((v) => !v)} className="justify-self-start text-sm font-semibold text-[var(--text-link)] underline">
          {comoTabla ? "Ver como gráfica" : "Ver como tabla"}
        </button>
      )}
    </section>
  );
}
