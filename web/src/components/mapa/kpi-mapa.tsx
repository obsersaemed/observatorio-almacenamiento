// KPI de /mapa (spec 002, RF-11). «Instalado» cuenta solo En operación y no cambia con los
// filtros; «según filtros» suma todos los estados del resultado. MW y MWh nunca se suman.
import { KpiTarjeta } from "@/components/kpi-tarjeta";
import { KpiValor } from "@/components/kpi-valor";
import type { kpiSeccion } from "@/lib/proyectos-mapa";

type Kpi = ReturnType<typeof kpiSeccion>;

// «Instalado» tiene dos tarjetas: van en dos columnas para que quepa el título (ajuste del 2026-10-24).
function Grupo({ titulo, columnas = "lg:grid-cols-3", children }: { titulo: string; columnas?: string; children: React.ReactNode }) {
  return (
    <section aria-label={titulo} className="grid gap-2">
      <h2 className="text-sm font-bold text-[var(--text-heading)]">{titulo}</h2>
      <div className={`grid gap-3 sm:grid-cols-2 ${columnas}`}>{children}</div>
    </section>
  );
}

export function KpiMapa({ kpi }: { kpi: Kpi }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_3fr]">
      <Grupo titulo="Instalado (en operación)" columnas="lg:grid-cols-2">
        <KpiTarjeta etiqueta="Potencia instalada [MW]">
          <KpiValor valor={kpi.instalado.mw} unidad="MW" />
        </KpiTarjeta>
        <KpiTarjeta etiqueta="Energía instalada [MWh]">
          <KpiValor valor={kpi.instalado.mwh} unidad="MWh" />
        </KpiTarjeta>
      </Grupo>
      <Grupo titulo="Según filtros (todos los estados)">
        <KpiTarjeta etiqueta="Proyectos identificados">
          <KpiValor valor={kpi.filtrado.total} unidad={null} />
        </KpiTarjeta>
        <KpiTarjeta etiqueta="Potencia total proyectada">
          <KpiValor valor={kpi.filtrado.mw} unidad="MW" />
        </KpiTarjeta>
        <KpiTarjeta etiqueta="Capacidad energética total proyectada">
          <KpiValor valor={kpi.filtrado.mwh} unidad="MWh" />
        </KpiTarjeta>
      </Grupo>
    </div>
  );
}
