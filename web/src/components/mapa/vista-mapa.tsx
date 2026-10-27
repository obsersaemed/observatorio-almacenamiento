"use client";

// Vista de /mapa (spec 002). Los filtros viven en la URL (RF-10) y un solo resultado filtrado
// alimenta la tabla, los KPI, el mapa y la descarga (RF-09).
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { csvDe } from "@/lib/csv";
import { formatoNumero } from "@/lib/formato";
import { descargarTexto, useFiltrosUrl } from "@/lib/use-filtros-url";
import { aProyectoMapa, filtrar, kpiSeccion, type CampoFiltro, type FilaPublica } from "@/lib/proyectos-mapa";
import { Filtros } from "./filtros";
import { KpiMapa } from "./kpi-mapa";
import { PanelMapa } from "./panel-mapa";
import { GraficasDiferidas } from "../graficas/graficas-diferidas";
import { TablaProyectos } from "./tabla-proyectos";

function descargarCsv(filas: FilaPublica[]) {
  descargarTexto(csvDe("proyectos", filas), "observatorio-proyectos-filtrados.csv");
}

export function VistaMapa({ filas }: { filas: FilaPublica[] }) {
  const { consulta, filtros, escribir: escribirFiltros } = useFiltrosUrl<CampoFiltro>();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const proyectos = useMemo(() => filas.map(aProyectoMapa), [filas]);
  const resultado = useMemo(() => filtrar(proyectos, filtros), [proyectos, filtros]);
  const kpi = kpiSeccion(proyectos, resultado);
  const filasResultado = () => {
    const nombres = new Set(resultado.map((p) => p.nombre));
    return filas.filter((f) => nombres.has(String(f.nombre).trim()));
  };

  return (
    <div className="grid gap-6">
      <KpiMapa kpi={kpi} />
      <Filtros
        proyectos={proyectos}
        filtros={filtros}
        onCambiar={escribirFiltros}
        conteo={`${formatoNumero(resultado.length)} ${resultado.length === 1 ? "proyecto" : "proyectos"}`}
        acciones={
          <>
            <Button type="button" variant="outline" onClick={() => escribirFiltros({})} disabled={!consulta}>
              Limpiar filtros
            </Button>
            <Button type="button" variant="outline" onClick={() => descargarCsv(filasResultado())}>
              Descargar CSV
            </Button>
          </>
        }
      />
      <GraficasDiferidas proyectos={resultado} />
      <PanelMapa proyectos={resultado} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />
      <TablaProyectos proyectos={resultado} seleccionado={seleccionado} onElegir={setSeleccionado} />
    </div>
  );
}
