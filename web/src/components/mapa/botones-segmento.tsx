"use client";

// Botones de segmento de /mapa (spec 008, RF-03): van debajo del título y cambian toda la página
// (KPI, filtros, gráficas, mapa y tabla). El segmento vive en la URL, así el enlace se comparte;
// cambiarlo limpia los filtros (RF-04). Botones nativos con aria-pressed: se usan con Tab y Enter.
import { OPCIONES_SEGMENTO } from "@/lib/proyectos-mapa";
import { useSegmentoUrl } from "@/lib/use-filtros-url";

export function BotonesSegmento() {
  const { segmento, elegir } = useSegmentoUrl();
  return (
    <div
      role="group"
      aria-label="Tipo de almacenamiento"
      className="inline-flex flex-wrap gap-1 justify-self-start rounded-[var(--radius-md)] bg-[var(--surface-alt)] p-1"
    >
      {OPCIONES_SEGMENTO.map((o) => {
        const elegido = o.id === segmento.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={elegido}
            onClick={() => elegir(o.id)}
            className={`rounded-[var(--radius-sm)] px-4 py-1.5 text-sm font-semibold ${
              elegido ? "bg-[var(--surface-selected)] text-[var(--text-on-selected)] shadow-[var(--shadow-card)]" : "text-[var(--text-heading)]"
            }`}
          >
            {o.nombre}
          </button>
        );
      })}
    </div>
  );
}
