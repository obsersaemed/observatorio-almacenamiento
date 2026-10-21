import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioAporte } from "@/components/formulario-aporte";
import { enviarAporte } from "./acciones";

export const metadata: Metadata = {
  title: "Aportar al observatorio",
  description:
    "Propón un proyecto de almacenamiento, una corrección, una norma o una noticia. Cada aporte se revisa antes de publicarse.",
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
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">Aportar al observatorio</h1>
      <p className="mt-2 max-w-2xl">
        ¿Conoces un proyecto de almacenamiento con baterías, una norma o una noticia que falte, o
        un dato que deba corregirse? Cuéntanos con su fuente. Un editor revisa cada aporte antes
        de publicarlo.
      </p>
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
