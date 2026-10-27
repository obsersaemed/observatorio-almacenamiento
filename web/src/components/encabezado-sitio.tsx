import Link from "next/link";
import { Suspense } from "react";
import { MenuLista, MenuPrincipal } from "./menu-principal";

// Encabezado común (RNF-03, RF-02): enlace para saltar al contenido, nombre con barra de acento
// y menú principal con la página actual marcada.
export function EncabezadoSitio() {
  return (
    <header className="bg-[var(--surface-header)] text-[var(--text-on-brand)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-card focus:px-3 focus:py-2 focus:text-[var(--text-heading)]"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex w-full max-w-[var(--page-max)] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 text-sm font-extrabold uppercase tracking-[var(--ls-caps)] sm:text-base">
          <span aria-hidden="true" className="block h-9 w-1.5 shrink-0 bg-accent" />
          Observatorio de Almacenamiento de Energía
        </Link>
        <Suspense fallback={<MenuLista actual={null} />}>
          <MenuPrincipal />
        </Suspense>
      </div>
    </header>
  );
}
