import { Suspense } from "react";
import { Inicio, PanelKpi, PanelKpiCargando } from "@/components/inicio";
import { proyectosParaKpi } from "@/lib/datos-publicos";
import { calcularKpi } from "@/lib/kpi";

async function PanelKpiConDatos() {
  const kpi = calcularKpi(await proyectosParaKpi());
  return <PanelKpi kpi={kpi} />;
}

export default function PaginaInicio() {
  return (
    <Inicio
      panelKpi={
        <Suspense fallback={<PanelKpiCargando />}>
          <PanelKpiConDatos />
        </Suspense>
      }
    />
  );
}
