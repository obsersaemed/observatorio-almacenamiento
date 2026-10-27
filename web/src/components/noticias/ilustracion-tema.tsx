// Ilustración de una noticia según su tema (spec 007, RF-27, RF-28): banda de 120 px con un
// ícono de trazo decorativo y la etiqueta del tema. Sin fotos de los medios (CA-27.2).
import { Building2, ChartLine, FileText, Gavel, Landmark, Leaf, Newspaper, type LucideIcon } from "lucide-react";
import { TEMAS, type Tema } from "@/lib/noticias";

const ICONO: Record<Tema, LucideIcon> = {
  Regulación: FileText,
  Subasta: Gavel,
  Mercado: ChartLine,
  Empresas: Building2,
  Ambiente: Leaf,
  "Política pública": Landmark,
  General: Newspaper,
};

/** Los temas alternan entre fondo gris claro y durazno claro, según su lugar en la lista. */
const fondoDe = (tema: Tema) => (TEMAS.indexOf(tema) % 2 === 0 ? "gris" : "durazno");

export function IlustracionTema({ tema }: { tema: Tema }) {
  const Icono = ICONO[tema];
  const fondo = fondoDe(tema);
  return (
    <div
      data-tema={tema}
      data-fondo={fondo}
      className={`relative flex h-[120px] items-center justify-center border-b-[3px] border-accent ${
        fondo === "gris" ? "bg-muted" : "bg-[color-mix(in_srgb,var(--accent-soft)_35%,var(--card))]"
      }`}
    >
      <Icono aria-hidden="true" size={64} strokeWidth={1.5} className="text-[var(--brand-ink)]" />
      <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-[var(--text-heading)] shadow-sm">
        {tema}
      </span>
    </div>
  );
}
