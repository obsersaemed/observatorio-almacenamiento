import Link from "next/link";

// Marcador de sección mientras se construye su propia spec (002–005).
export function SeccionEnConstruccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <main className="mx-auto w-full max-w-[var(--page-max)] px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">{titulo}</h1>
      <p className="mt-2 max-w-2xl">{descripcion}</p>
      <p className="mt-6 rounded-[var(--radius-md)] border border-border bg-card p-4">
        Sección en construcción.{" "}
        <Link href="/" className="font-semibold text-[var(--text-link)] underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
