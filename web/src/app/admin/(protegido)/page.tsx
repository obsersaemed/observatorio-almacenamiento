import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaAportes } from "@/components/aportes/lista";
import { clienteConSesion } from "@/lib/acceso-supabase";
import type { AporteFila } from "@/lib/aportes-admin";

export const metadata: Metadata = {
  title: "Revisión de aportes",
  description: "Aportes pendientes de revisión.",
  robots: { index: false },
};

async function Pendientes() {
  const supabase = await clienteConSesion();
  const { data, error } = await supabase
    .from("aportes")
    .select("id, tipo, registro_afectado, descripcion, datos, fuente, origen, agente, publicacion, creado_en")
    .eq("publicacion", "Pendiente")
    .order("creado_en", { ascending: true });
  if (error) return <p role="alert">No se pudieron leer los aportes: {error.message}</p>;
  return <ListaAportes aportes={(data ?? []) as AporteFila[]} />;
}

export default function PaginaAdmin() {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">Aportes pendientes</h1>
      <p className="mt-2 max-w-2xl">Los más antiguos primero. Nada se publica sin tu aprobación.</p>
      <Suspense fallback={<p className="mt-4">Cargando aportes…</p>}>
        <Pendientes />
      </Suspense>
    </main>
  );
}
