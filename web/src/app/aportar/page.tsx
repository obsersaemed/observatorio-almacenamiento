import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TEXTOS } from "@/lib/textos";
import { ContactoAportar } from "@/components/contacto-aportar";
import { FormularioAporte } from "@/components/formulario-aporte";
import { enviarAporte } from "./acciones";

export const metadata: Metadata = {
  title: TEXTOS.aportar.titulo,
  description: TEXTOS.aportar.intro,
};

const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
type Parametros = Promise<Record<string, string | string[] | undefined>>;
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// Prellenado desde «Proponer corrección» del mapa (spec 002, RF-06). Leer la URL va dentro de
// <Suspense> para que la página se siga prerenderizando (cacheComponents); mientras tanto se
// muestra el formulario sin prellenar.
async function FormularioPrellenado({ searchParams }: { searchParams: Parametros }) {
  const p = await searchParams;
  return <FormularioAporte accion={enviarAporte} siteKey={SITE_KEY} inicial={{ tipo: primero(p.tipo), registro: primero(p.registro) }} />;
}

export default function PaginaAportar({ searchParams }: { searchParams: Parametros }) {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">{TEXTOS.aportar.titulo}</h1>
      <p className="mt-2 max-w-3xl">{TEXTOS.aportar.intro}</p>
      <ContactoAportar />
      <div className="mt-6">
        <Suspense fallback={<FormularioAporte accion={enviarAporte} siteKey={SITE_KEY} />}>
          <FormularioPrellenado searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-8">
        <Link href="/" className="font-semibold text-[var(--text-link)] underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
