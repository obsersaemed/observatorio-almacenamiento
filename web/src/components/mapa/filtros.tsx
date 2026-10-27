"use client";

// Panel de filtros de /mapa (spec 002, RF-08). Un desplegable de selección múltiple por
// filtro (T23), con el conteo de cada opción según los demás filtros. Solo uno abierto a la
// vez. Spec 007 (RF-08, RF-09): va dentro de la barra recogida, con un chip por valor elegido.
import { useState, type ReactNode } from "react";
import { BarraFiltros } from "@/components/filtros/barra-filtros";
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
  conteo,
  acciones,
}: {
  proyectos: ProyectoMapa[];
  filtros: TipoFiltros;
  onCambiar: (filtros: TipoFiltros) => void;
  conteo: ReactNode;
  acciones?: ReactNode;
}) {
  const [abierto, setAbierto] = useState<CampoFiltro | null>(null);
  const activos = CAMPOS_FILTRO.flatMap((campo) =>
    (filtros[campo] ?? []).map((valor) => ({ campo, valor, etiqueta: valor })),
  );
  const cambiar = (campo: CampoFiltro, nuevos: string[]) => {
    const siguiente: TipoFiltros = { ...filtros, [campo]: nuevos };
    if (!nuevos.length) delete siguiente[campo];
    onCambiar(siguiente);
  };

  const quitar = (campo: string, valor: string) => {
    const c = campo as CampoFiltro;
    cambiar(c, (filtros[c] ?? []).filter((v) => v !== valor));
  };

  return (
    <BarraFiltros activos={activos} onQuitar={quitar} conteo={conteo} acciones={acciones}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </BarraFiltros>
  );
}
