"use client";

// Filtros de /vehiculos (spec 003, RF-02): Marca, Tipo de batería y Línea, con el desplegable
// de /mapa (T23) y el conteo de vehículos por opción. Spec 007 (RF-21): van en la barra
// recogida, con un chip por valor elegido y los créditos siempre visibles.
import { useState, type ReactNode } from "react";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { CAMPOS_VEHICULOS, opcionesDe, type CampoVehiculo, type FiltrosVehiculos, type LineaVehiculo } from "@/lib/vehiculos";
import { DesplegableFiltro } from "../mapa/desplegable-filtro";

const ETIQUETA: Record<CampoVehiculo, string> = { marca: "Marca", tipo: "Tipo de batería", linea: "Línea" };

export function FiltrosVehiculos({
  lineas,
  filtros,
  onCambiar,
  conteo,
  acciones,
  pie,
}: {
  lineas: LineaVehiculo[];
  filtros: FiltrosVehiculos;
  onCambiar: (filtros: FiltrosVehiculos) => void;
  conteo: ReactNode;
  acciones?: ReactNode;
  pie?: ReactNode;
}) {
  const [abierto, setAbierto] = useState<CampoVehiculo | null>(null);

  const activos = CAMPOS_VEHICULOS.flatMap((campo) => (filtros[campo] ?? []).map((valor) => ({ campo, valor, etiqueta: valor })));
  const cambiar = (campo: CampoVehiculo, nuevos: string[]) => {
    const siguiente: FiltrosVehiculos = { ...filtros, [campo]: nuevos };
    if (!nuevos.length) delete siguiente[campo];
    onCambiar(siguiente);
  };
  const quitar = (campo: string, valor: string) => {
    const c = campo as CampoVehiculo;
    cambiar(c, (filtros[c] ?? []).filter((v) => v !== valor));
  };
  // Los valores elegidos sin vehículos con los demás filtros se ven con (0) y se pueden quitar.
  const opciones = (campo: CampoVehiculo) => {
    const lista = opcionesDe(lineas, campo, filtros);
    const faltantes = (filtros[campo] ?? []).filter((v) => !lista.some((o) => o.valor === v));
    return [...lista, ...faltantes.map((valor) => ({ valor, cantidad: 0 }))];
  };

  return (
    <BarraFiltros activos={activos} onQuitar={quitar} conteo={conteo} acciones={acciones} pie={pie}>
      <div className="grid gap-4 sm:grid-cols-3">
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
            unidad="Vehículos"
          />
        ))}
      </div>
    </BarraFiltros>
  );
}
