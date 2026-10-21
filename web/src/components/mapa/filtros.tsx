"use client";

// Panel de filtros de /mapa (spec 002, RF-08). Un desplegable de selección múltiple por
// filtro (T23), con el conteo de cada opción según los demás filtros. Solo uno abierto a la
// vez. En móvil el panel empieza plegado (RNF-01).
import { useEffect, useRef, useState } from "react";
import { DesplegableFiltro } from "./desplegable-filtro";
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
  const [abierto, setAbierto] = useState<CampoFiltro | null>(null);
  useEffect(() => {
    if (panel.current && window.matchMedia?.("(max-width: 639px)").matches) panel.current.open = false;
  }, []);

  const activos = CAMPOS_FILTRO.reduce((n, c) => n + (filtros[c]?.length ?? 0), 0);
  const cambiar = (campo: CampoFiltro, nuevos: string[]) => {
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
          <DesplegableFiltro
            key={campo}
            titulo={ETIQUETA[campo]}
            opciones={opcionesConElegidos(proyectos, campo, filtros)}
            elegidos={filtros[campo] ?? []}
            abierto={abierto === campo}
            onAbrir={() => setAbierto(campo)}
            onCerrar={() => setAbierto((a) => (a === campo ? null : a))}
            onCambiar={(nuevos) => cambiar(campo, nuevos)}
          />
        ))}
      </div>
    </details>
  );
}
