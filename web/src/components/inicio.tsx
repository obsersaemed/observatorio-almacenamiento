import Link from "next/link";
import { Aparecer } from "@/components/aparecer";
import { KpiTarjeta } from "@/components/kpi-tarjeta";
import { KpiValor } from "@/components/kpi-valor";
import type { ReactNode } from "react";
import type { Kpi } from "@/lib/kpi";

export const SECCIONES = [
  { ruta: "/mapa", titulo: "Implementación en el país", texto: "Mapa e inventario de los SAEB en Colombia." },
  { ruta: "/vehiculos", titulo: "Vehículos eléctricos", texto: "Almacenamiento en la flota eléctrica." },
  { ruta: "/normativa", titulo: "Evolución normativa", texto: "CREG, MME y CNO, condensado y explicado." },
  { ruta: "/noticias", titulo: "Noticias", texto: "Novedades relevantes del almacenamiento." },
];

// El panel de KPI llega como ranura para poder envolverlo en <Suspense> en la página:
// el resto del inicio se muestra al instante y las cifras llegan cuando están listas.
export function Inicio({ panelKpi }: { panelKpi: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold uppercase tracking-[var(--ls-caps)] text-[var(--text-heading)] sm:text-3xl">
        Observatorio de Almacenamiento de Energía
      </h1>
      <p className="mt-2 max-w-2xl">
        Sistemas de almacenamiento de energía con baterías (SAEB) en Colombia: proyectos,
        regulación y noticias, con fuente en cada dato.
      </p>

      {panelKpi}

      <nav aria-label="Secciones" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECCIONES.map((s) => (
          <Link
            key={s.ruta}
            href={s.ruta}
            className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]"
          >
            <span className="block font-bold text-[var(--text-heading)]">{s.titulo}</span>
            <span className="mt-1 block text-sm">{s.texto}</span>
          </Link>
        ))}
      </nav>

      <p className="mt-8">
        ¿Tienes datos de un proyecto, una norma o una noticia?{" "}
        <Link href="/aportar" className="font-semibold text-[var(--text-link)] underline">
          Aportar al observatorio
        </Link>
      </p>
    </main>
  );
}

export function PanelKpi({ kpi }: { kpi: Kpi }) {
  return (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Aparecer>
            <KpiTarjeta etiqueta="Potencia en operación [MW]">
              <KpiValor valor={kpi.mwOperacion} unidad="MW" />
            </KpiTarjeta>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <KpiTarjeta etiqueta="Energía en operación [MWh]">
              <KpiValor valor={kpi.mwhOperacion} unidad="MWh" />
            </KpiTarjeta>
          </Aparecer>
          <Aparecer retraso={0.2}>
            <KpiTarjeta etiqueta="Proyectos por estado">
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-base font-medium">
                {Object.entries(kpi.porEstado).map(([estado, n]) => (
                  <div key={estado} className="contents">
                    <dt>{estado}</dt>
                    <dd className="text-right font-bold">
                      <KpiValor valor={n} unidad={null} />
                    </dd>
                  </div>
                ))}
              </dl>
            </KpiTarjeta>
          </Aparecer>
        </div>
  );
}

export function PanelKpiCargando() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Cargando cifras">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-[var(--radius-lg)] border border-border bg-card" />
      ))}
    </div>
  );
}
