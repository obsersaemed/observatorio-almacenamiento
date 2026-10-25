import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { VistaNormativa } from "@/components/normativa/vista-normativa";
import { normasPublicas } from "@/lib/datos-publicos";
import { TEXTOS } from "@/lib/textos";

export const metadata: Metadata = {
  title: TEXTOS.normativa.titulo,
  description: TEXTOS.normativa.intro,
};

async function VistaConDatos() {
  return <VistaNormativa normas={await normasPublicas()} />;
}

export default function Normativa() {
  return (
    <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-6 px-4 py-8">
      <header className="grid gap-2">
        <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">{TEXTOS.normativa.titulo}</h1>
        <p className="max-w-3xl">{TEXTOS.normativa.intro}</p>
        <p className="text-sm">
          <Link href="/datos/normativa.csv" className="font-semibold text-[var(--text-link)] underline">
            Descargar datos completos (CSV)
          </Link>
        </p>
      </header>
      <Suspense fallback={<p role="status">Cargando las normas…</p>}>
        <VistaConDatos />
      </Suspense>
    </main>
  );
}
