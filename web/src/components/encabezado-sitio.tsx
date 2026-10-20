import Link from "next/link";

const MENU = [
  { ruta: "/", nombre: "Inicio" },
  { ruta: "/mapa", nombre: "Implementación" },
  { ruta: "/vehiculos", nombre: "Vehículos" },
  { ruta: "/normativa", nombre: "Normativa" },
  { ruta: "/noticias", nombre: "Noticias" },
  { ruta: "/aportar", nombre: "Aportar" },
];

// Encabezado común (RNF-03): enlace para saltar al contenido con el teclado y menú principal.
export function EncabezadoSitio() {
  return (
    <header className="bg-[var(--surface-header)] text-[var(--brand-contrast)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-card focus:px-3 focus:py-2 focus:text-[var(--text-heading)]"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex w-full max-w-[var(--page-max)] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-sm font-extrabold uppercase tracking-[var(--ls-caps)] sm:text-base">
          Observatorio de Almacenamiento de Energía
        </Link>
        <nav aria-label="Principal">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            {MENU.map((m) => (
              <li key={m.ruta}>
                <Link href={m.ruta} className="underline-offset-4 hover:underline focus-visible:underline">
                  {m.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
