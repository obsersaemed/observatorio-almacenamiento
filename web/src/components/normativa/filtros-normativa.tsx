"use client";

// Filtros de /normativa (spec 004, RF-07): entidad, tipo, estado y año, con el desplegable de
// /mapa y el conteo de normas por opción. Spec 007 (RF-08): van en la barra recogida, con un
// chip por valor elegido y el conteo de normas.
import { useState, type ReactNode } from "react";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
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
  conteo,
  acciones,
}: {
  normas: Norma[];
  filtros: Filtros;
  onCambiar: (filtros: Filtros) => void;
  conteo: ReactNode;
  acciones?: ReactNode;
}) {
  const [abierto, setAbierto] = useState<CampoNormativa | null>(null);

  const activos = CAMPOS_NORMATIVA.flatMap((campo) => (filtros[campo] ?? []).map((valor) => ({ campo, valor, etiqueta: valor })));
  const cambiar = (campo: CampoNormativa, nuevos: string[]) => {
    const siguiente: Filtros = { ...filtros, [campo]: nuevos };
    if (!nuevos.length) delete siguiente[campo];
    onCambiar(siguiente);
  };
  const quitar = (campo: string, valor: string) => {
    const c = campo as CampoNormativa;
    cambiar(c, (filtros[c] ?? []).filter((v) => v !== valor));
  };
  // Los valores elegidos sin normas con los demás filtros se ven con (0) y se pueden quitar.
  const opciones = (campo: CampoNormativa) => {
    const lista = opcionesDe(normas, campo, filtros);
    const faltantes = (filtros[campo] ?? []).filter((v) => !lista.some((o) => o.valor === v));
    return [...lista, ...faltantes.map((valor) => ({ valor, cantidad: 0 }))];
  };

  return (
    <BarraFiltros activos={activos} onQuitar={quitar} conteo={conteo} acciones={acciones}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </BarraFiltros>
  );
}
