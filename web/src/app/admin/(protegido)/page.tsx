import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revisión de aportes",
  description: "Aportes pendientes de revisión.",
  robots: { index: false },
};

// La lista de aportes llega en T11.
export default function PaginaAdmin() {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)]">Aportes pendientes</h1>
    </main>
  );
}
