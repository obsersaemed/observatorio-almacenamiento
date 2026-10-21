"use client";

// Panel de filtros de /mapa (spec 002, RF-08). Casillas con el conteo de cada opción, según
// los demás filtros. En móvil empieza plegado (RNF-01).
import { useEffect, useRef } from "react";
import { CAMPOS_FILTRO, opcionesDe, type CampoFiltro, type Filtros as TipoFiltros, type ProyectoMapa } from "@/lib/proyectos-mapa";

const ETIQUETA: Record<CampoFiltro, string> = {
  estado: "Estado",
  departamento: "Departamento",
  municipio: "Municipio",
  servicios: "Servicios",
  operador: "Operador",
  tecnologia: "Tecnología",
  fpo: "Año de FPO",
};

/** Las opciones con su conteo, más los valores elegidos (p. ej. desde una URL) que hoy no
 *  tienen proyectos: se muestran con (0) para que se vean y se puedan quitar (O-2). */
function opcionesConElegidos(proyectos: ProyectoMapa[], campo: CampoFiltro, filtros: TipoFiltros) {
  const opciones = opcionesDe(proyectos, campo, filtros);
  const faltantes = (filtros[campo] ?? []).filter((v) => !opciones.some((o) => o.valor === v));
  return [...opciones, ...faltantes.map((valor) => ({ valor, cantidad: 0 }))];
}

export function Filtros({
  proyectos,
  filtros,
  onCambiar,
}: {
  proyectos: ProyectoMapa[];
  filtros: TipoFiltros;
  onCambiar: (filtros: TipoFiltros) => void;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (panel.current && window.matchMedia?.("(max-width: 639px)").matches) panel.current.open = false;
  }, []);

  const activos = CAMPOS_FILTRO.reduce((n, c) => n + (filtros[c]?.length ?? 0), 0);
  const alternar = (campo: CampoFiltro, valor: string, marcado: boolean) => {
    const actuales = filtros[campo] ?? [];
    const nuevos = marcado ? [...actuales, valor] : actuales.filter((v) => v !== valor);
    const siguiente: TipoFiltros = { ...filtros, [campo]: nuevos };
    if (!nuevos.length) delete siguiente[campo];
    onCambiar(siguiente);
  };

  return (
    <details
      ref={panel}
      open
      className="rounded-[var(--radius-lg)] border border-border bg-card p-4"
    >
      <summary className="cursor-pointer font-bold text-[var(--text-heading)]">
        Filtros{activos ? ` (${activos} ${activos === 1 ? "activo" : "activos"})` : ""}
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAMPOS_FILTRO.map((campo) => (
          <fieldset key={campo} className="min-w-0 text-sm">
            <legend className="font-semibold text-[var(--text-heading)]">{ETIQUETA[campo]}</legend>
            <div className="mt-1 grid max-h-44 gap-1 overflow-y-auto">
              {opcionesConElegidos(proyectos, campo, filtros).map(({ valor, cantidad }) => (
                <label key={valor} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={filtros[campo]?.includes(valor) ?? false}
                    onChange={(e) => alternar(campo, valor, e.target.checked)}
                  />
                  <span className="break-words">{`${valor} (${cantidad})`}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </details>
  );
}
