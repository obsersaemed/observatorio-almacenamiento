import { Inicio } from "@/components/inicio";
import { proyectosParaKpi } from "@/lib/datos-publicos";
import { calcularKpi } from "@/lib/kpi";

export default async function PaginaInicio() {
  const kpi = calcularKpi(await proyectosParaKpi());
  return <Inicio kpi={kpi} />;
}
