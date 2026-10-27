// Tarjeta de un proyecto en /mapa (spec 002, RF-05, RF-06). Los campos vacíos no se muestran,
// salvo Servicios («Sin dato»). Sin enlaces de fuente (aclaración 6): la fuente va en el CSV.
import Link from "next/link";
import { valorEsCo } from "@/lib/columnas";
import { formatoEnergia, formatoNumero, formatoPotencia, type Unidades } from "@/lib/formato";
import { SIN_DATO, type ProyectoMapa } from "@/lib/proyectos-mapa";

const NUMERO = { tipo: "numero" } as const;

export function enlaceCorreccion(nombre: string): string {
  return `/aportar?tipo=${encodeURIComponent("Corrección")}&registro=${encodeURIComponent(nombre)}`;
}

// 008: en «Detrás del medidor» (unidades="kW") las cifras van en kW/kWh y no se muestra el nivel
// de tensión (aclaración 2).
export function TarjetaProyecto({
  proyecto: p,
  onCerrar,
  unidades = "MW",
}: {
  proyecto: ProyectoMapa;
  onCerrar?: () => void;
  unidades?: Unidades;
}) {
  const datos: [string, string | null][] = [
    ["Operador", p.operador || null],
    ["Estado", p.estado],
    ["Tecnología", p.tecnologia || null],
    ["Año de FPO", p.fpo || null],
    ["Servicios", p.servicios.length ? p.servicios.join(", ") : SIN_DATO],
    ["Ubicación", [p.municipio, p.departamento].filter(Boolean).join(", ") || null],
    ["Punto de conexión", p.kv === null || unidades === "kW" ? null : `${valorEsCo(NUMERO, p.kv)} kV`],
    ["Potencia", p.mw === null ? null : formatoPotencia(p.mw, unidades)],
    ["Energía", p.mwh === null ? null : formatoEnergia(p.mwh, unidades)],
    ["Duración", p.duracion === null ? null : `${formatoNumero(p.duracion, 1)} h`],
  ];

  return (
    <section
      role="dialog"
      aria-label={p.nombre}
      tabIndex={-1}
      className="w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-border bg-card p-4 text-sm shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[var(--text-heading)]">{p.nombre}</h3>
        {onCerrar && (
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="px-1 text-muted-foreground">
            ×
          </button>
        )}
      </div>
      <ul className="mt-2 grid gap-1">
        {datos
          .filter(([, valor]) => valor !== null)
          .map(([etiqueta, valor]) => (
            <li key={etiqueta}>
              <span className="font-semibold text-[var(--text-heading)]">{etiqueta}:</span> {valor}
            </li>
          ))}
      </ul>
      <Link href={enlaceCorreccion(p.nombre)} className="mt-3 inline-block font-semibold text-[var(--text-link)] underline">
        Proponer corrección
      </Link>
    </section>
  );
}
