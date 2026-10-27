import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { VistaMapa } from "@/components/mapa/vista-mapa";
import { proyectosParaMapa } from "@/lib/datos-publicos";
import { TEXTOS } from "@/lib/textos";

export const metadata: Metadata = {
  title: TEXTOS.mapa.titulo,
  description: TEXTOS.mapa.intro,
};

async function VistaConDatos() {
  return <VistaMapa filas={await proyectosParaMapa()} />;
}

export default function Mapa() {
  return (
    <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">{TEXTOS.mapa.titulo}</h1>
      <Suspense fallback={<p role="status">Cargando los proyectos…</p>}>
        <VistaConDatos />
      </Suspense>
      <p className="text-sm">
        <Link href="/datos/proyectos.csv" className="font-semibold text-[var(--text-link)] underline">
          Descargar datos completos (CSV)
        </Link>
      </p>
      {/* RF-03: la introducción va al final, antes del pie. */}
      <p className="max-w-3xl">{TEXTOS.mapa.intro}</p>
    </main>
  );
}
