import type { Metadata } from "next";
import { Suspense } from "react";
import { pedirAcceso } from "./acciones";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = {
  title: "Acceso de editores",
  description: "Entrada al área de revisión de aportes del observatorio. Solo para editores autorizados.",
  robots: { index: false },
};

async function AvisoNoAutorizado({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (error !== "no-autorizado") return null;
  return (
    <p role="alert" className="mb-4 text-destructive">
      Tu sesión no corresponde a un editor autorizado.
    </p>
  );
}

export default function PaginaEntrar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">Acceso de editores</h1>
      <p className="mt-2 mb-6 max-w-xl">
        Escribe tu correo de editor y te enviaremos un enlace para entrar. Ábrelo en este mismo
        navegador.
      </p>
      <Suspense fallback={null}>
        <AvisoNoAutorizado searchParams={searchParams} />
      </Suspense>
      <FormularioEntrar accion={pedirAcceso} />
    </main>
  );
}
