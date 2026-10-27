// Inicio (spec 007, RF-10 a RF-14). Orden: título e intro, gráfica de crecimiento, «Secciones
// principales», cifras, últimas noticias y llamado a aportar. Lo que lee datos llega como ranura
// para envolverlo en <Suspense> en la página: el resto se muestra al instante.
import Link from "next/link";
import type { ReactNode } from "react";
import { IconoVehiculo } from "@/components/icono-vehiculo";
import { KpiTarjeta } from "@/components/kpi-tarjeta";
import { KpiValor } from "@/components/kpi-valor";
import { MiniLineaNormas } from "@/components/mini-linea-normas";
import { buttonVariants } from "@/components/ui/button";
import { formatoFecha } from "@/lib/formato";
import type { Kpi } from "@/lib/kpi";
import { ordenarNoticias, type Noticia } from "@/lib/noticias";
import { SECCIONES_INICIO, TEXTOS } from "@/lib/textos";

const MAX_NOTICIAS = 3;
const TARJETA = "rounded-[var(--radius-lg)] border border-border border-t-4 border-t-accent bg-card shadow-[var(--shadow-card)]";
const TITULO_H2 = "text-xl font-extrabold text-[var(--text-heading)]";

type Ranuras = { grafica: ReactNode; miniMapa: ReactNode; panelKpi: ReactNode; noticias: ReactNode };

export function Inicio({ grafica, miniMapa, panelKpi, noticias }: Ranuras) {
  const imagenes = [miniMapa, <IconoVehiculo key="v" className="h-24 w-auto" />, <MiniLineaNormas key="n" />];
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold uppercase tracking-[var(--ls-caps)] text-[var(--text-heading)] sm:text-3xl">
        {TEXTOS.inicio.titulo}
      </h1>
      <p className="mt-2 max-w-3xl">{TEXTOS.inicio.intro}</p>

      <div className="mt-6">{grafica}</div>

      <section aria-labelledby="secciones-principales" className="mt-10">
        <h2 id="secciones-principales" className={TITULO_H2}>
          Secciones principales
        </h2>
        <div className="mt-4 grid gap-4 min-[860px]:grid-cols-3">
          {SECCIONES_INICIO.map((s, i) => (
            <article key={s.ruta} className={`${TARJETA} flex flex-col overflow-hidden`}>
              <div className="flex h-[150px] items-center justify-center bg-muted p-3">{imagenes[i]}</div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-bold text-[var(--text-heading)]">{s.titulo}</h3>
                <p className="mt-1 flex-1 text-sm">{s.texto}</p>
                <Link href={s.ruta} className={`${buttonVariants({ size: "lg" })} mt-4 self-start px-4`}>
                  {s.boton}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {panelKpi}

      <section aria-labelledby="ultimas-noticias" className="mt-10">
        <h2 id="ultimas-noticias" className={TITULO_H2}>
          Últimas noticias
        </h2>
        {noticias}
      </section>

      <section aria-label="Aportar al observatorio" className={`${TARJETA} mt-10 flex flex-wrap items-center justify-between gap-4 p-5`}>
        <p className="font-semibold text-[var(--text-heading)]">¿Tienes datos de un proyecto, una norma o una noticia?</p>
        <Link href="/aportar" className={`${buttonVariants({ variant: "acento", size: "lg" })} px-4`}>
          Aportar
        </Link>
      </section>
    </main>
  );
}

/** Cifras del inicio (RF-13): potencia y energía en operación por separado y proyectos identificados. */
export function PanelKpi({ kpi }: { kpi: Kpi }) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <KpiTarjeta etiqueta="Potencia en operación [MW]">
        <KpiValor valor={kpi.mwOperacion} unidad="MW" />
      </KpiTarjeta>
      <KpiTarjeta etiqueta="Energía en operación [MWh]">
        <KpiValor valor={kpi.mwhOperacion} unidad="MWh" />
      </KpiTarjeta>
      <KpiTarjeta etiqueta="Proyectos identificados">
        <KpiValor valor={kpi.total} unidad={null} />
      </KpiTarjeta>
    </div>
  );
}

export function PanelKpiCargando() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Cargando cifras">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 rounded-[var(--radius-lg)] border border-border bg-card" />
      ))}
    </div>
  );
}

export function GraficaCargando() {
  return <div aria-busy="true" aria-label="Cargando la gráfica de crecimiento" className={`${TARJETA} h-80`} />;
}

export function NoticiasCargando() {
  return <div aria-busy="true" aria-label="Cargando las últimas noticias" className="mt-4 h-24" />;
}

/** Últimas noticias aprobadas (RF-14): las 3 más recientes, con fecha; enlazan a /noticias. */
export function UltimasNoticias({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) return <p className="mt-3 text-sm text-muted-foreground">Aún no hay noticias publicadas.</p>;
  return (
    <ul aria-label="Últimas noticias" className="mt-4 grid gap-3 min-[860px]:grid-cols-3">
      {ordenarNoticias(noticias)
        .slice(0, MAX_NOTICIAS)
        .map((n) => (
          <li key={`${n.fecha}-${n.titulo}`} className={TARJETA}>
            <Link href="/noticias" className="block h-full p-4 hover:bg-muted">
              <time dateTime={n.fecha} className="text-sm text-muted-foreground">
                {formatoFecha(n.fecha)}
              </time>
              <span className="mt-1 block font-semibold text-[var(--text-heading)]">{n.titulo}</span>
            </Link>
          </li>
        ))}
    </ul>
  );
}
