"use client";

// Filtros de /normativa (spec 004, RF-07): entidad, tipo, estado y año, con el desplegable de
// /mapa y el conteo de normas por opción. En móvil el panel empieza plegado (RNF-01).
import { useEffect, useRef, useState } from "react";
import {
  CAMPOS_NORMATIVA,
  opcionesDe,
  type CampoNormativa,
  type FiltrosNormativa as Filtros,
  type Norma,
} from "@/lib/normativa";
import { DesplegableFiltro } from "../mapa/desplegable-filtro";

const ETIQUETA: Record<CampoNormativa, string> = { entidad: "Entidad", tipo: "Tipo", estado: "Estado", anio: "Año" };

export function FiltrosNormativa({
  normas,
  filtros,
  onCambiar,
}: {
  normas: Norma[];
  filtros: Filtros;
  onCambiar: (filtros: Filtros) => void;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  const [abierto, setAbierto] = useState<CampoNormativa | null>(null);
  useEffect(() => {
    if (panel.current && window.matchMedia?.("(max-width: 639px)").matches) panel.current.open = false;
  }, []);

  const activos = CAMPOS_NORMATIVA.reduce((n, c) => n + (filtros[c]?.length ?? 0), 0);
  const cambiar = (campo: CampoNormativa, nuevos: string[]) => {
    const siguiente: Filtros = { ...filtros, [campo]: nuevos };
    if (!nuevos.length) delete siguiente[campo];
    onCambiar(siguiente);
  };
  // Los valores elegidos sin normas con los demás filtros se ven con (0) y se pueden quitar.
  const opciones = (campo: CampoNormativa) => {
    const lista = opcionesDe(normas, campo, filtros);
    const faltantes = (filtros[campo] ?? []).filter((v) => !lista.some((o) => o.valor === v));
    return [...lista, ...faltantes.map((valor) => ({ valor, cantidad: 0 }))];
  };

  return (
    <details ref={panel} open className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
      <summary className="cursor-pointer font-bold text-[var(--text-heading)]">
        Filtros{activos ? ` (${activos} ${activos === 1 ? "activo" : "activos"})` : ""}
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAMPOS_NORMATIVA.map((campo) => (
          <DesplegableFiltro
            key={campo}
            titulo={ETIQUETA[campo]}
            opciones={opciones(campo)}
            elegidos={filtros[campo] ?? []}
            abierto={abierto === campo}
            onAbrir={() => setAbierto(campo)}
            onCerrar={() => setAbierto((a) => (a === campo ? null : a))}
            onCambiar={(nuevos) => cambiar(campo, nuevos)}
            unidad="Normas"
          />
        ))}
      </div>
    </details>
  );
}
