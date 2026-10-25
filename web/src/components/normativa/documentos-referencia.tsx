// Documentos de referencia (spec 004, RF-12): estudios académicos aprobados, fuera de la línea
// de tiempo y sin filtros.
import type { Norma } from "@/lib/normativa";

export function DocumentosReferencia({ documentos }: { documentos: Norma[] }) {
  if (!documentos.length) return null;
  return (
    <section aria-labelledby="documentos-referencia" className="grid gap-3">
      <h2 id="documentos-referencia" className="text-xl font-extrabold text-[var(--text-heading)]">
        Documentos de referencia
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {documentos.map((d) => (
          <li key={d.id} className="grid gap-1 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm">
            <h3 className="font-bold text-[var(--text-heading)]">{d.titulo}</h3>
            <p className="text-sm">{[d.aplica_a, d.fecha.slice(0, 4)].filter(Boolean).join(" · ")}</p>
            {d.resumen && <p>{d.resumen}</p>}
            <a href={d.enlace.split(/\s+/)[0]} target="_blank" rel="noopener noreferrer" className="w-fit text-sm font-semibold underline underline-offset-4">
              Ver documento<span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
