// Lista de /noticias (spec 005): de la más reciente a la más antigua, sin filtros. Cada
// tarjeta lleva fecha, medio, título, un resumen propio y el enlace a la nota original
// (RF-01 a RF-04). Componente de servidor: no necesita JavaScript en el navegador.
import { formatoFecha } from "@/lib/formato";
import { enlacePrincipal, ordenarNoticias, type Noticia } from "@/lib/noticias";

export function ListaNoticias({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) {
    return <p className="rounded-[var(--radius-lg)] border border-border bg-card p-4">Todavía no hay noticias publicadas</p>;
  }
  return (
    <ul className="grid gap-4">
      {ordenarNoticias(noticias).map((n) => (
        <li key={`${n.fecha}-${n.titulo}`}>
          <article aria-label={n.titulo} className="grid gap-2 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm">
            <p className="flex flex-wrap gap-x-3 text-sm">
              <time dateTime={n.fecha}>{formatoFecha(n.fecha)}</time>
              <span className="font-bold text-[var(--text-heading)]">{n.medio}</span>
            </p>
            <h2 className="text-lg font-bold text-[var(--text-heading)]">{n.titulo}</h2>
            {n.resumen && <p>{n.resumen}</p>}
            <p className="text-sm">
              Si quieres saber más sobre esta noticia, haz clic en el enlace:{" "}
              <a href={enlacePrincipal(n)} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--text-link)] underline underline-offset-4">
                Leer la noticia en {n.medio}
                <span className="sr-only">: «{n.titulo}» (abre en una pestaña nueva)</span>
              </a>
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
