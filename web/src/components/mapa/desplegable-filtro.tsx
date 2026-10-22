"use client";

// Un filtro de /mapa como desplegable de selección múltiple (spec 002, RF-08, T23): el botón
// dice «Todas», el valor elegido o cuántos hay; al abrirse ofrece «Todas», un buscador y las
// opciones con su conteo. Escape o un clic afuera lo cierran.
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { formatoNumero } from "@/lib/formato";
import type { Opcion } from "@/lib/proyectos-mapa";

const casilla = "size-4 shrink-0 accent-[var(--primary)]";

export function DesplegableFiltro({
  titulo,
  opciones,
  elegidos,
  abierto,
  onAbrir,
  onCerrar,
  onCambiar,
}: {
  titulo: string;
  opciones: Opcion[];
  elegidos: string[];
  abierto: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  onCambiar: (elegidos: string[]) => void;
}) {
  const id = useId();
  const caja = useRef<HTMLFieldSetElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [busqueda, setBusqueda] = useState("");

  // Un clic fuera del filtro lo cierra.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: MouseEvent) => !caja.current?.contains(e.target as Node) && onCerrar();
    document.addEventListener("mousedown", alPulsar);
    return () => document.removeEventListener("mousedown", alPulsar);
  }, [abierto, onCerrar]);

  const resumen = elegidos.length === 0 ? "Todas" : elegidos.length === 1 ? elegidos[0] : `${elegidos.length} seleccionados`;
  const termino = busqueda.trim().toLocaleLowerCase("es");
  const visibles = termino ? opciones.filter((o) => o.valor.toLocaleLowerCase("es").includes(termino)) : opciones;
  const alternar = (valor: string, marcado: boolean) =>
    onCambiar(marcado ? [...elegidos, valor] : elegidos.filter((v) => v !== valor));
  const cerrarConFoco = () => {
    setBusqueda("");
    onCerrar();
    boton.current?.focus();
  };

  return (
    <fieldset ref={caja} className="relative min-w-0 text-sm" onKeyDown={(e) => e.key === "Escape" && abierto && cerrarConFoco()}>
      <legend id={`${id}-titulo`} className="mb-1 text-xs font-bold tracking-wide text-[var(--text-heading)] uppercase">
        {titulo}
      </legend>
      <button
        ref={boton}
        type="button"
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-controls={`${id}-panel`}
        aria-labelledby={`${id}-titulo ${id}-valor`}
        onClick={() => (abierto ? cerrarConFoco() : onAbrir())}
        className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-input bg-card px-3 py-2 text-left"
      >
        <span id={`${id}-valor`} className="truncate">
          {resumen}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </button>
      {abierto && (
        <div
          id={`${id}-panel`}
          className="absolute top-full left-0 z-20 mt-1 w-full min-w-64 rounded-[var(--radius-md)] border border-border bg-card p-2 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between border-b border-border px-1 pb-2">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" className={casilla} checked={elegidos.length === 0} onChange={() => onCambiar([])} />
              Todas
            </label>
            <span className="text-xs text-muted-foreground">Proyectos</span>
          </div>
          <input
            type="search"
            aria-label={`Buscar en ${titulo}`}
            placeholder="Escriba el término de búsqueda"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="my-2 block w-full rounded-[var(--radius-md)] border border-input bg-card px-2 py-1"
          />
          <div role="group" aria-label={`Opciones de ${titulo}`} className="grid max-h-56 gap-1 overflow-y-auto px-1">
            {visibles.map(({ valor, cantidad }) => (
              <label key={valor} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className={`${casilla} mt-0.5`}
                  aria-label={`${valor} (${formatoNumero(cantidad)})`}
                  checked={elegidos.includes(valor)}
                  onChange={(e) => alternar(valor, e.target.checked)}
                />
                <span className="flex-1 break-words">{valor}</span>
                <span className="text-muted-foreground">{formatoNumero(cantidad)}</span>
              </label>
            ))}
            {!visibles.length && <p className="text-muted-foreground">Sin coincidencias</p>}
          </div>
        </div>
      )}
    </fieldset>
  );
}
