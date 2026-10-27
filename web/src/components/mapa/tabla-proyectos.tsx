"use client";

// Tabla de proyectos de /mapa (spec 002, RF-02, RF-03, RF-12). Es también el equivalente
// accesible del mapa (RNF-03): cada nombre es un botón que lleva al proyecto en el mapa.
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatoNumero } from "@/lib/formato";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";

const col = createColumnHelper<ProyectoMapa>();
const numero = (v: number | null) => (v === null ? undefined : v);
const cifra = (v: number | undefined) => (v === undefined ? "" : formatoNumero(v, 1));

export function TablaProyectos({
  proyectos,
  seleccionado,
  onElegir,
}: {
  proyectos: ProyectoMapa[];
  seleccionado?: string | null;
  onElegir: (nombre: string) => void;
}) {
  const [orden, setOrden] = useState<SortingState>([]);

  const columnas = [
    col.accessor("nombre", {
      header: "Nombre",
      cell: ({ row }) => (
        <>
          <button
            type="button"
            aria-label={`Ver ${row.original.nombre} en el mapa`}
            onClick={() => onElegir(row.original.nombre)}
            className="text-left font-semibold text-[var(--text-link)] underline"
          >
            {row.original.nombre}
          </button>
          {!row.original.ubicado && (
            <span className="ml-2 text-xs text-muted-foreground">sin ubicación en el mapa</span>
          )}
        </>
      ),
    }),
    col.accessor("operador", { header: "Operador" }),
    col.accessor("estado", { header: "Estado" }),
    col.accessor((p) => p.servicios.join(", "), { id: "servicios", header: "Servicios" }),
    col.accessor("departamento", { header: "Departamento" }),
    col.accessor("municipio", { header: "Municipio" }),
    col.accessor((p) => numero(p.mw), { id: "mw", header: "Potencia [MW]", sortUndefined: "last", cell: (c) => cifra(c.getValue()) }),
    col.accessor((p) => numero(p.mwh), { id: "mwh", header: "Energía [MWh]", sortUndefined: "last", cell: (c) => cifra(c.getValue()) }),
    col.accessor("fpo", { header: "Año de FPO" }),
  ];

  const tabla = useReactTable({
    data: proyectos,
    columns: columnas,
    state: { sorting: orden },
    onSortingChange: setOrden,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    sortDescFirst: false,
  });

  if (!proyectos.length) {
    return <p className="rounded-[var(--radius-md)] border border-border bg-card p-4">Ningún proyecto cumple estos filtros</p>;
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Proyectos de almacenamiento con baterías según los filtros</caption>
        <thead className="bg-[var(--surface-selected)] text-[var(--text-on-selected)]">
          {tabla.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id}>
              {grupo.headers.map((h) => {
                const sentido = h.column.getIsSorted();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    aria-sort={sentido === "asc" ? "ascending" : sentido === "desc" ? "descending" : "none"}
                    className="px-3 py-2 font-semibold whitespace-nowrap"
                  >
                    <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 font-semibold">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {sentido === "asc" && <ChevronUp aria-hidden="true" className="size-3.5" />}
                      {sentido === "desc" && <ChevronDown aria-hidden="true" className="size-3.5" />}
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {tabla.getRowModel().rows.map((r) => (
            <tr
              key={r.id}
              aria-selected={r.original.nombre === seleccionado}
              className="border-t border-border aria-selected:bg-[var(--surface-tint)]"
            >
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-3 py-2 align-top">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
