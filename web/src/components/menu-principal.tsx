"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MENU = [
  { ruta: "/", nombre: "Inicio" },
  { ruta: "/mapa", nombre: "Implementación" },
  { ruta: "/vehiculos", nombre: "Vehículos" },
  { ruta: "/normativa", nombre: "Normativa" },
  { ruta: "/noticias", nombre: "Noticias" },
  { ruta: "/aportar", nombre: "Aportar" },
];

// Una entrada es la actual si la ruta coincide o es una subruta (el inicio solo con "/").
function esActual(ruta: string, actual: string | null) {
  if (!actual) return false;
  return ruta === "/" ? actual === "/" : actual === ruta || actual.startsWith(`${ruta}/`);
}

// Menú principal (RF-02): la página actual lleva aria-current y un subrayado de acento de 3 px.
export function MenuPrincipal() {
  return <MenuLista actual={usePathname()} />;
}

// Lista del menú sin leer la ruta: es también el respaldo del <Suspense> del encabezado, porque
// con Cache Components `usePathname()` no puede prerenderizarse fuera de un <Suspense>.
export function MenuLista({ actual }: { actual: string | null }) {
  return (
    <nav aria-label="Principal">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
        {MENU.map((m) => {
          const es = esActual(m.ruta, actual);
          return (
            <li key={m.ruta}>
              <Link
                href={m.ruta}
                aria-current={es ? "page" : undefined}
                className={`inline-block border-b-[3px] pb-1 text-[var(--text-on-brand)] hover:border-[var(--accent-soft)] focus-visible:border-[var(--accent-soft)] ${
                  es ? "border-accent" : "border-transparent"
                }`}
              >
                {m.nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
