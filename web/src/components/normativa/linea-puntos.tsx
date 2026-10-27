"use client";

// Línea de puntos de /normativa (spec 007, RF-23 a RF-25): una línea horizontal de fechas con
// un punto por norma, coloreado por emisor y con leyenda. Al pasar el mouse o enfocar un punto
// se ve un recuadro con la norma; al hacer clic (o Enter) se salta a su ficha, que queda
// resaltada y con el foco. Con movimiento reducido el salto es instantáneo (RNF-03).
import { useId, useMemo, useState } from "react";
import { lineaPuntos } from "@/lib/linea-puntos";
import { useMovimientoReducido } from "@/lib/movimiento";
import { fechaDeNorma, type Norma } from "@/lib/normativa";
import { COLOR_ENTIDAD } from "./tarjeta-norma";

const colorDe = (emisor: string) => COLOR_ENTIDAD[emisor] ?? "var(--line-300)";

export function LineaPuntos({ normas, onElegir }: { normas: Norma[]; onElegir?: (id: string) => void }) {
  const reducido = useMovimientoReducido();
  const idBase = useId();
  const [activo, setActivo] = useState<string | null>(null);
  const { puntos, marcas } = useMemo(() => lineaPuntos(normas), [normas]);
  const porId = useMemo(() => new Map(normas.map((n) => [n.id, n])), [normas]);
  const emisores = useMemo(() => [...new Set(normas.map((n) => n.emisor))].sort((a, b) => a.localeCompare(b, "es")), [normas]);

  if (!normas.length) return null;

  const ir = (id: string) => {
    const ficha = document.getElementById(`norma-${id}`);
    onElegir?.(id);
    if (!ficha) return;
    ficha.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
    ficha.focus({ preventScroll: true });
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
      <div className="relative mx-2 h-32">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--line-300)]" />
        {marcas.map((m) => (
          <span
            key={m.anio}
            aria-hidden="true"
            className="absolute top-1/2 -translate-x-1/2 pt-3 text-xs font-semibold text-[var(--text-body)]"
            style={{ left: `${m.posicion}%` }}
          >
            <span className="absolute left-1/2 top-0 h-2 w-px -translate-y-1/2 bg-[var(--line-300)]" />
            {m.anio}
          </span>
        ))}
        <ul aria-label="Normas en el tiempo">
          {puntos.map((p) => {
            const n = porId.get(p.id)!;
            const fecha = fechaDeNorma(n);
            const idRecuadro = `${idBase}-${p.id}`;
            const visible = activo === p.id;
            const alinear = p.posicion < 20 ? "left-0" : p.posicion > 80 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <li
                key={p.id}
                className="absolute -translate-x-1/2"
                style={{ left: `${p.posicion}%`, top: p.arriba ? "calc(50% - 30px)" : "calc(50% + 14px)" }}
              >
                <span aria-hidden="true" className={`absolute left-1/2 w-px bg-[var(--line-300)] ${p.arriba ? "top-4 h-[14px]" : "bottom-4 h-[14px]"}`} />
                <button
                  type="button"
                  aria-label={`${n.emisor} ${n.tipo} ${n.numero}, ${fecha}: ir a su ficha`}
                  aria-describedby={visible ? idRecuadro : undefined}
                  onClick={() => ir(p.id)}
                  onMouseEnter={() => setActivo(p.id)}
                  onMouseLeave={() => setActivo((a) => (a === p.id ? null : a))}
                  onFocus={() => setActivo(p.id)}
                  onBlur={() => setActivo((a) => (a === p.id ? null : a))}
                  className="relative block size-4 rounded-full border-2 border-[var(--card)] shadow-[0_0_0_1px_var(--line-300)] hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-ink)] motion-reduce:hover:scale-100"
                  style={{ backgroundColor: colorDe(n.emisor) }}
                />
                {visible && (
                  <div
                    id={idRecuadro}
                    role="tooltip"
                    className={`absolute z-20 w-64 rounded-[var(--radius-md)] border border-border bg-card p-3 text-left text-xs shadow-[var(--shadow-card)] ${alinear} ${p.arriba ? "bottom-6" : "top-6"}`}
                  >
                    <p className="font-bold text-[var(--text-heading)]">{n.emisor}</p>
                    <p>{`${n.tipo} ${n.numero}`}</p>
                    <p>{fecha}</p>
                    <p className="mt-1 font-semibold text-[var(--text-heading)]">{n.titulo}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <ul aria-label="Emisores" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {emisores.map((e) => (
          <li key={e} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: colorDe(e) }} />
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}
