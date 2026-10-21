import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TablaHistorial } from "@/components/aportes/historial";
import { clienteConSesion } from "@/lib/acceso-supabase";
import type { FilaHistorial } from "@/lib/historial";

export const metadata: Metadata = { title: "Historial de cambios", robots: { index: false } };

type Filtros = Promise<{ registro?: string; aporte?: string }>;

async function Historial({ searchParams }: { searchParams: Filtros }) {
  const { registro, aporte } = await searchParams;
  const supabase = await clienteConSesion();
  let consulta = supabase
    .from("historial")
    .select("id, tabla, registro, operacion, antes, despues, fuente, editor, aporte_id, creado_en")
    .order("creado_en", { ascending: false })
    .limit(200);
  if (registro) consulta = consulta.eq("registro", registro);
  if (aporte && /^\d+$/.test(aporte)) consulta = consulta.eq("aporte_id", Number(aporte));
  const { data, error } = await consulta;
  if (error) return <p role="alert">No se pudo leer el historial: {error.message}</p>;
  return (
    <>
      {(registro || aporte) && (
        <p className="mt-2 text-sm">
          Filtrado por {registro ? `registro «${registro}»` : `aporte N.º ${aporte}`}.{" "}
          <Link href="/admin/historial" className="text-[var(--text-link)] underline">
            Ver todo
          </Link>
        </p>
      )}
      <TablaHistorial filas={(data ?? []) as FilaHistorial[]} />
    </>
  );
}

export default function PaginaHistorial({ searchParams }: { searchParams: Filtros }) {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">Historial de cambios</h1>
      <p className="mt-2 max-w-2xl">Últimos cambios en los datos publicados, con su editor, aporte de origen y fuente.</p>
      <Suspense fallback={<p className="mt-4">Cargando historial…</p>}>
        <Historial searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
