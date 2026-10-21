import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Comparacion } from "@/components/aportes/comparacion";
import { Decision } from "@/components/aportes/decision";
import { clienteConSesion } from "@/lib/acceso-supabase";
import { CLAVE_TABLA, compararCampos, etiquetaOrigen, tablaDestino, type AporteFila } from "@/lib/aportes-admin";
import { camposDecision } from "@/lib/decision";
import { formatoFecha } from "@/lib/formato";
import { aprobar, rechazar } from "./acciones";

export const metadata: Metadata = { title: "Revisar aporte", robots: { index: false } };

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const supabase = await clienteConSesion();
  const { data } = await supabase.from("aportes").select("*").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const aporte = data as AporteFila;

  const tabla = tablaDestino(aporte);
  let actual: Record<string, unknown> | null = null;
  if (aporte.tipo === "Corrección" && aporte.registro_afectado) {
    const r = await supabase.from(tabla).select("*").eq(CLAVE_TABLA[tabla], aporte.registro_afectado).maybeSingle();
    actual = r.data;
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">
        Aporte N.º {aporte.id} · {aporte.tipo}
      </h1>
      <dl className="mt-4 grid max-w-3xl grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="font-semibold">Estado</dt>
        <dd>{aporte.publicacion}</dd>
        <dt className="font-semibold">Origen</dt>
        <dd>{etiquetaOrigen(aporte)}</dd>
        <dt className="font-semibold">Fecha</dt>
        <dd>{formatoFecha(aporte.creado_en.slice(0, 10))}</dd>
        <dt className="font-semibold">Destino</dt>
        <dd>
          {tabla}
          {aporte.registro_afectado ? ` · ${aporte.registro_afectado}` : ""}
          {aporte.tipo === "Corrección" && !actual ? " (no se encontró el registro)" : ""}
        </dd>
        <dt className="font-semibold">Fuente</dt>
        <dd className="break-all">
          {aporte.fuente.split(/\s+/).map((u) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="mr-2 text-[var(--text-link)] underline">
              {u}
            </a>
          ))}
        </dd>
        <dt className="font-semibold">Descripción</dt>
        <dd className="whitespace-pre-wrap">{aporte.descripcion}</dd>
      </dl>

      <h2 className="mt-8 text-lg font-bold text-[var(--text-heading)]">
        {actual ? "Valor actual frente al propuesto" : "Datos propuestos"}
      </h2>
      <Comparacion filas={compararCampos(tabla, actual, aporte.datos ?? {})} />

      {aporte.publicacion === "Pendiente" ? (
        <Decision
          campos={camposDecision(aporte, actual)}
          aprobar={aprobar.bind(null, aporte.id)}
          rechazar={rechazar.bind(null, aporte.id)}
        />
      ) : (
        <p className="mt-8 rounded-[var(--radius-md)] border border-border bg-card p-4">
          Este aporte ya fue revisado ({aporte.publicacion}).
        </p>
      )}
    </>
  );
}

export default function PaginaDetalle({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <p className="mb-4">
        <Link href="/admin" className="text-[var(--text-link)] underline">
          ← Volver a la lista
        </Link>
      </p>
      <Suspense fallback={<p>Cargando aporte…</p>}>
        <Detalle params={params} />
      </Suspense>
    </main>
  );
}
