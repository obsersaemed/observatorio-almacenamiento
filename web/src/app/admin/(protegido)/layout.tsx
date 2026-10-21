// Segunda barrera del área de editores (RF-07): el proxy decide el acceso antes de renderizar;
// aquí se vuelve a comprobar, y todos los datos de /admin se leen con la sesión del usuario (RLS).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { salir } from "@/app/admin/entrar/acciones";
import { Button } from "@/components/ui/button";
import { decidirAcceso } from "@/lib/acceso";
import { sesionEditor } from "@/lib/acceso-supabase";

async function Guardian({ children }: { children: ReactNode }) {
  const sesion = await sesionEditor();
  // El proxy ya redirige; si aun así llega alguien sin permiso, no se muestra nada.
  if (decidirAcceso(sesion) !== "permitido") {
    return (
      <p role="alert" className="px-4 py-8">
        Acceso solo para editores. <Link href="/admin/entrar" className="underline">Entrar</Link>
      </p>
    );
  }

  async function cerrarSesion() {
    "use server";
    await salir();
    redirect("/admin/entrar");
  }

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[var(--page-max)] flex-wrap items-center justify-between gap-2 px-4 py-3">
          <nav aria-label="Editores" className="flex flex-wrap items-center gap-4">
            <Link href="/admin" className="font-bold text-[var(--text-heading)]">
              Revisión de aportes
            </Link>
            <Link href="/admin/historial" className="text-sm font-semibold text-[var(--text-link)] underline">
              Historial
            </Link>
          </nav>
          <form action={cerrarSesion} className="flex items-center gap-3 text-sm">
            <span>{sesion.correo}</span>
            <Button type="submit" variant="outline" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-4 py-8">Verificando acceso…</p>}>
      <Guardian>{children}</Guardian>
    </Suspense>
  );
}
