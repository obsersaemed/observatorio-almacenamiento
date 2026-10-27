"use client";

// Tarjeta de una norma en la línea de tiempo (spec 004, RF-04 a RF-06 y RF-15). Plegada muestra
// lo esencial; desplegada, la explicación, a quién aplica, las relacionadas y el documento
// oficial. La entidad se distingue por color (decorativo) y por su nombre escrito (RNF-04).
import { useId } from "react";
import { fechaDeNorma, textoNorma, type Norma, type Relacionada } from "@/lib/normativa";
import { enlaceCorreccion } from "../mapa/tarjeta-proyecto";

/** Un color de token por entidad (RNF-07). */
export const COLOR_ENTIDAD: Record<string, string> = {
  CREG: "var(--teal-600)",
  MME: "var(--peach-400)",
  Congreso: "var(--status-susp)",
  CNO: "var(--status-op)",
  XM: "var(--status-con)",
  UPME: "var(--purple-300)",
  Academia: "var(--peach-200)",
};

const enlaces = (texto: string) => texto.split(/\s+/).filter(Boolean);

export function TarjetaNorma({
  norma,
  relacionadas,
  abierta,
  onAlternar,
  onIrA,
  resaltada = false,
}: {
  norma: Norma;
  relacionadas: Relacionada[];
  abierta: boolean;
  onAlternar: () => void;
  onIrA: (id: string) => void;
  /** Elegida en la línea de puntos (spec 007, RF-25): contorno de acento. */
  resaltada?: boolean;
}) {
  const idPanel = useId();
  const [oficial, ...otros] = enlaces(norma.enlace);

  return (
    <article
      id={`norma-${norma.id}`}
      aria-label={textoNorma(norma)}
      tabIndex={-1}
      data-resaltada={resaltada ? "true" : undefined}
      className="relative scroll-mt-24 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-4 pl-5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 data-[resaltada=true]:outline-3 data-[resaltada=true]:outline-offset-2 data-[resaltada=true]:outline-[var(--accent)]"
    >
      <span
        data-testid="color-entidad"
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: COLOR_ENTIDAD[norma.emisor] ?? "var(--line-300)" }}
      />
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <time dateTime={norma.precision_fecha === "Año" ? norma.fecha.slice(0, 4) : norma.precision_fecha === "Mes" ? norma.fecha.slice(0, 7) : norma.fecha} className="text-[var(--text-body)]">{fechaDeNorma(norma)}</time>
        <span className="font-bold text-[var(--text-heading)]">{norma.emisor}</span>
        <span>{`${norma.tipo} ${norma.numero}`}</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">{norma.estado}</span>
      </p>
      <h3 className="mt-2 text-base font-bold text-[var(--text-heading)]">{norma.titulo}</h3>
      {norma.resumen && <p className="mt-1">{norma.resumen}</p>}

      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={idPanel}
        onClick={onAlternar}
        className="mt-3 text-sm font-semibold underline underline-offset-4"
      >
        Ver explicación
      </button>

      <div id={idPanel} hidden={!abierta} className="mt-3 grid gap-3 text-sm">
        {norma.explicacion && <p className="whitespace-pre-line">{norma.explicacion}</p>}
        {norma.aplica_a && (
          <div>
            <p className="font-bold text-[var(--text-heading)]">Aplica a</p>
            <p>{norma.aplica_a}</p>
          </div>
        )}
        {relacionadas.length > 0 && (
          <div>
            <p className="font-bold text-[var(--text-heading)]">Normas relacionadas</p>
            <ul className="list-disc pl-5">
              {relacionadas.map((r) => (
                <li key={r.id}>
                  {r.norma ? (
                    <a
                      href={`#norma-${r.id}`}
                      className="underline underline-offset-4"
                      onClick={(e) => {
                        e.preventDefault();
                        onIrA(r.id);
                      }}
                    >
                      {r.texto}
                    </a>
                  ) : (
                    <span>{r.texto}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          {oficial && (
            <a href={oficial} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
              Ver documento oficial<span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          )}
          {otros.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {`Enlace ${i + 2}`}<span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          ))}
          <a href={enlaceCorreccion(norma.id)} className="underline underline-offset-4">
            Proponer corrección
          </a>
        </p>
      </div>
    </article>
  );
}
