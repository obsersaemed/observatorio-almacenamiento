"use client";

// Filtros de /vehiculos (spec 003, RF-02): Marca, Tipo de batería y Línea, con el desplegable
// de /mapa (T23) y el conteo de vehículos por opción. En móvil el panel empieza plegado.
import { useEffect, useRef, useState } from "react";
import { CAMPOS_VEHICULOS, opcionesDe, type CampoVehiculo, type FiltrosVehiculos, type LineaVehiculo } from "@/lib/vehiculos";
import { DesplegableFiltro } from "../mapa/desplegable-filtro";

const ETIQUETA: Record<CampoVehiculo, string> = { marca: "Marca", tipo: "Tipo de batería", linea: "Línea" };

export function FiltrosVehiculos({
  lineas,
  filtros,
  onCambiar,
}: {
  lineas: LineaVehiculo[];
  filtros: FiltrosVehiculos;
  onCambiar: (filtros: FiltrosVehiculos) => void;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  const [abierto, setAbierto] = useState<CampoVehiculo | null>(null);
  useEffect(() => {
    if (panel.current && window.matchMedia?.("(max-width: 639px)").matches) panel.current.open = false;
  }, []);

  const activos = CAMPOS_VEHICULOS.reduce((n, c) => n + (filtros[c]?.length ?? 0), 0);
  const cambiar = (campo: CampoVehiculo, nuevos: string[]) => {
    const siguiente: FiltrosVehiculos = { ...filtros, [campo]: nuevos };
    if (!nuevos.length) delete siguiente[campo];
    onCambiar(siguiente);
  };
  // Los valores elegidos sin vehículos con los demás filtros se ven con (0) y se pueden quitar.
  const opciones = (campo: CampoVehiculo) => {
    const lista = opcionesDe(lineas, campo, filtros);
    const faltantes = (filtros[campo] ?? []).filter((v) => !lista.some((o) => o.valor === v));
    return [...lista, ...faltantes.map((valor) => ({ valor, cantidad: 0 }))];
  };

  return (
    <details ref={panel} open className="rounded-[var(--radius-lg)] border border-border bg-card p-4">
      <summary className="cursor-pointer font-bold text-[var(--text-heading)]">
        Filtros{activos ? ` (${activos} ${activos === 1 ? "activo" : "activos"})` : ""}
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {CAMPOS_VEHICULOS.map((campo) => (
          <DesplegableFiltro
            key={campo}
            titulo={ETIQUETA[campo]}
            opciones={opciones(campo)}
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
