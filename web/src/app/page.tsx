// Inicio (spec 007). Lo que lee datos va en <Suspense>: el título, la intro y las tarjetas se
// muestran al instante. Gráfica, mini mapa y cifras comparten la lectura cacheada de proyectos.
import { Suspense } from "react";
import { GraficaCrecimiento } from "@/components/grafica-crecimiento";
import {
  GraficaCargando,
  Inicio,
  NoticiasCargando,
  PanelKpi,
  PanelKpiCargando,
  UltimasNoticias,
} from "@/components/inicio";
import { MiniMapaColombia } from "@/components/mini-mapa-colombia";
import { crecimiento } from "@/lib/crecimiento";
import { noticiasPublicas, proyectosParaMapa } from "@/lib/datos-publicos";
import { calcularKpi } from "@/lib/kpi";
import { aProyectoMapa, SEGMENTO_POR_DEFECTO, soloSegmento } from "@/lib/proyectos-mapa";

// 008 · RF-07: el inicio cuenta solo la «Gran escala».
async function proyectos() {
  return soloSegmento((await proyectosParaMapa()).map(aProyectoMapa), SEGMENTO_POR_DEFECTO);
}

async function GraficaConDatos() {
  const { barras, sinAnio } = crecimiento(await proyectos());
  return <GraficaCrecimiento barras={barras} sinAnio={sinAnio} />;
}

async function MiniMapaConDatos() {
  return <MiniMapaColombia proyectos={await proyectos()} />;
}

async function PanelKpiConDatos() {
  const kpi = calcularKpi(
    (await proyectos()).map((p) => ({ estado: p.estado, potencia_nominal_mw: p.mw, capacidad_maxima_mwh: p.mwh })),
  );
  return <PanelKpi kpi={kpi} />;
}

async function NoticiasConDatos() {
  return <UltimasNoticias noticias={await noticiasPublicas()} />;
}

export default function PaginaInicio() {
  return (
    <Inicio
      grafica={
        <Suspense fallback={<GraficaCargando />}>
          <GraficaConDatos />
        </Suspense>
      }
      miniMapa={
        <Suspense fallback={<MiniMapaColombia proyectos={[]} />}>
          <MiniMapaConDatos />
        </Suspense>
      }
      panelKpi={
        <Suspense fallback={<PanelKpiCargando />}>
          <PanelKpiConDatos />
        </Suspense>
      }
      noticias={
        <Suspense fallback={<NoticiasCargando />}>
          <NoticiasConDatos />
        </Suspense>
      }
    />
  );
}
