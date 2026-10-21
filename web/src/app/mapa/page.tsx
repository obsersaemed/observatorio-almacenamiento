import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { VistaMapa } from "@/components/mapa/vista-mapa";
import { proyectosParaMapa } from "@/lib/datos-publicos";

export const metadata: Metadata = {
  title: "Implementación en el país",
  description: "Mapa e inventario de los sistemas de almacenamiento con baterías (SAEB) en Colombia, con filtros por estado, ubicación, servicios, operador, tecnología y año.",
};

async function VistaConDatos() {
  return <VistaMapa filas={await proyectosParaMapa()} />;
}

export default function Mapa() {
  return (
    <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-6 px-4 py-8">
      <header className="grid gap-2">
        <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">Implementación en el país</h1>
        <p className="max-w-3xl">
          Los sistemas de almacenamiento de energía con baterías (SAEB) de Colombia publicados en el
          observatorio. Filtra por estado, ubicación, servicios, operador, tecnología o año; pasa el
          mouse, toca o enfoca un punto para ver su tarjeta. La fuente de cada proyecto está en la
          descarga CSV.
        </p>
        <p className="text-sm">
          <Link href="/datos/proyectos.csv" className="font-semibold text-[var(--text-link)] underline">
            Descargar datos completos (CSV)
          </Link>
        </p>
      </header>
      <Suspense fallback={<p role="status">Cargando los proyectos…</p>}>
        <VistaConDatos />
      </Suspense>
    </main>
  );
}
