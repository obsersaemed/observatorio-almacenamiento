"use client";

// Vista de /mapa (spec 002). Los filtros viven en la URL (RF-10) y un solo resultado filtrado
// alimenta la tabla, los KPI, el mapa y la descarga (RF-09).
// 008 (RF-04, RF-05, RF-06, RF-08): el segmento elegido con los botones de debajo del título
// (también en la URL) filtra las filas ANTES de todo: KPI, opciones de filtros, gráficas, mapa,
// conteo, tabla y descarga. «Detrás del medidor» va en kW/kWh y con la nota de ubicación.
import { useMemo, useState } from "react";
import { House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csvDe } from "@/lib/csv";
import { formatoNumero } from "@/lib/formato";
import { descargarTexto, useFiltrosUrl, useSegmentoUrl } from "@/lib/use-filtros-url";
import {
  aProyectoMapa,
  filtrar,
  kpiSeccion,
  PARAMETRO_SEGMENTO,
  SEGMENTO_POR_DEFECTO,
  soloSegmento,
  type CampoFiltro,
  type FilaPublica,
} from "@/lib/proyectos-mapa";
import { Filtros } from "./filtros";
import { KpiMapa } from "./kpi-mapa";
import { PanelMapa } from "./panel-mapa";
import { GraficasDiferidas } from "../graficas/graficas-diferidas";
import { TablaProyectos } from "./tabla-proyectos";

const CONSERVAR = [PARAMETRO_SEGMENTO];

function descargarCsv(filas: FilaPublica[]) {
  descargarTexto(csvDe("proyectos", filas), "observatorio-proyectos-filtrados.csv");
}

/** RF-08: el segmento elegido aún no tiene proyectos aprobados (texto de la 007, RF-18). */
function SeccionEnConstruccion() {
  return (
    <section
      aria-label="Sección en construcción"
      className="grid min-h-80 place-items-center rounded-[var(--radius-lg)] border border-border bg-[var(--surface-alt)] p-6"
    >
      <div className="grid max-w-md justify-items-center gap-3 text-center">
        <House aria-hidden className="size-10 text-[var(--text-heading)]" />
        <h2 className="text-lg font-bold text-[var(--text-heading)]">Sección en construcción</h2>
        <p className="text-sm">
          Aquí se publicarán los sistemas de baterías instalados en usuarios (industria, comercio y hogares), detrás
          del medidor. Los datos están en preparación.
        </p>
      </div>
    </section>
  );
}

export function VistaMapa({ filas }: { filas: FilaPublica[] }) {
  const { segmento } = useSegmentoUrl();
  const { filtros, escribir: escribirFiltros } = useFiltrosUrl<CampoFiltro>(undefined, CONSERVAR);
  // La selección es del segmento en que se hizo: al cambiar de segmento no queda una tarjeta abierta.
  const [eleccion, setEleccion] = useState<{ segmento: string; nombre: string | null }>({ segmento: segmento.id, nombre: null });
  const seleccionado = eleccion.segmento === segmento.id ? eleccion.nombre : null;
  const setSeleccionado = (nombre: string | null) => setEleccion({ segmento: segmento.id, nombre });

  const filasSegmento = useMemo(() => soloSegmento(filas, segmento.nombre), [filas, segmento.nombre]);
  const proyectos = useMemo(() => filasSegmento.map(aProyectoMapa), [filasSegmento]);
  const resultado = useMemo(() => filtrar(proyectos, filtros), [proyectos, filtros]);

  if (!filasSegmento.length) return <SeccionEnConstruccion />;

  const unidades = segmento.unidades;
  const kpi = kpiSeccion(proyectos, resultado);
  const hayFiltros = Object.keys(filtros).length > 0;
  const filasResultado = () => {
    const nombres = new Set(resultado.map((p) => p.nombre));
    return filasSegmento.filter((f) => nombres.has(String(f.nombre).trim()));
  };

  return (
    <div className="grid gap-6">
      <KpiMapa kpi={kpi} unidades={unidades} />
      <Filtros
        proyectos={proyectos}
        filtros={filtros}
        onCambiar={escribirFiltros}
        conteo={`${formatoNumero(resultado.length)} ${resultado.length === 1 ? "proyecto" : "proyectos"}`}
        acciones={
          <>
            <Button type="button" variant="outline" onClick={() => escribirFiltros({})} disabled={!hayFiltros}>
              Limpiar filtros
            </Button>
            <Button type="button" variant="outline" onClick={() => descargarCsv(filasResultado())}>
              Descargar CSV
            </Button>
          </>
        }
      />
      <GraficasDiferidas proyectos={resultado} unidades={unidades} />
      {segmento.nombre !== SEGMENTO_POR_DEFECTO && (
        <p className="text-sm text-muted-foreground">Ubicación aproximada: cabecera del municipio</p>
      )}
      <PanelMapa proyectos={resultado} seleccionado={seleccionado} onSeleccionar={setSeleccionado} unidades={unidades} />
      <TablaProyectos proyectos={resultado} seleccionado={seleccionado} onElegir={setSeleccionado} unidades={unidades} />
    </div>
  );
}
