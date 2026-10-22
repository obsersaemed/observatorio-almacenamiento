"use client";

// Vista de /mapa (spec 002). Los filtros viven en la URL (RF-10) y un solo resultado filtrado
// alimenta la tabla, los KPI, el mapa y la descarga (RF-09).
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { csvDe } from "@/lib/csv";
import { consultaDeFiltros, filtrosDeConsulta } from "@/lib/filtros-url";
import { aProyectoMapa, filtrar, kpiSeccion, type FilaPublica, type Filtros as TipoFiltros } from "@/lib/proyectos-mapa";
import { Filtros } from "./filtros";
import { KpiMapa } from "./kpi-mapa";
import { MapaDiferido } from "./mapa-diferido";
import { GraficasDiferidas } from "../graficas/graficas-diferidas";
import { TablaProyectos } from "./tabla-proyectos";

// La consulta de la URL como almacén externo: en el servidor (y al hidratar) no hay filtros;
// en el navegador se lee window.location.search, así el HTML inicial coincide.
const CAMBIO_URL = "observatorio:filtros";
function suscribir(avisar: () => void) {
  window.addEventListener("popstate", avisar);
  window.addEventListener(CAMBIO_URL, avisar);
  return () => {
    window.removeEventListener("popstate", avisar);
    window.removeEventListener(CAMBIO_URL, avisar);
  };
}
const leerConsulta = () => window.location.search;

function escribirFiltros(filtros: TipoFiltros) {
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${consultaDeFiltros(filtros)}`);
  window.dispatchEvent(new Event(CAMBIO_URL));
}

function descargarCsv(filas: FilaPublica[]) {
  const url = URL.createObjectURL(new Blob([csvDe("proyectos", filas)], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "observatorio-proyectos-filtrados.csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

export function VistaMapa({ filas }: { filas: FilaPublica[] }) {
  const consulta = useSyncExternalStore(suscribir, leerConsulta, () => "");
  const filtros = useMemo(() => filtrosDeConsulta(new URLSearchParams(consulta)), [consulta]);
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
      <div className="grid gap-3">
        <Filtros proyectos={proyectos} filtros={filtros} onCambiar={escribirFiltros} />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => escribirFiltros({})} disabled={!consulta}>
            Limpiar filtros
          </Button>
          <Button type="button" variant="outline" onClick={() => descargarCsv(filasResultado())}>
            Descargar CSV ({resultado.length} {resultado.length === 1 ? "proyecto" : "proyectos"})
          </Button>
        </div>
      </div>
      <GraficasDiferidas proyectos={resultado} />
      <MapaDiferido proyectos={resultado} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />
      <TablaProyectos proyectos={resultado} seleccionado={seleccionado} onElegir={setSeleccionado} />
    </div>
  );
}
