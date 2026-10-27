import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaNoticias } from "@/components/noticias/lista-noticias";
import { noticiasPublicas } from "@/lib/datos-publicos";
import { TEXTOS } from "@/lib/textos";

export const metadata: Metadata = {
  title: TEXTOS.noticias.titulo,
  description: TEXTOS.noticias.intro,
};

async function ListaConDatos() {
  return <ListaNoticias noticias={await noticiasPublicas()} />;
}

export default function Noticias() {
  return (
    <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">{TEXTOS.noticias.titulo}</h1>
      <Suspense fallback={<p role="status">Cargando las noticias…</p>}>
        <ListaConDatos />
      </Suspense>
      {/* RF-03: la introducción va al final, antes del pie. */}
      <p className="max-w-3xl">{TEXTOS.noticias.intro}</p>
    </main>
  );
}
