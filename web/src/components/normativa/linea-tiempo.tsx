"use client";

// Línea de tiempo normativa (spec 004, RF-01, RF-02, RF-06): un separador por año y las
// normas de la más reciente a la más antigua. En escritorio las tarjetas se alternan a cada
// lado del eje; en móvil van en una columna (RNF-01).
import { useEffect, useState } from "react";
import { useMovimientoReducido } from "@/lib/movimiento";
import { agruparPorAnio, relacionadasDe, type Norma } from "@/lib/normativa";
import { TarjetaNorma } from "./tarjeta-norma";

export function LineaTiempo({
  normas,
  publicadas,
  onFuera,
  abrirAlCargar,
}: {
  /** Normas del resultado filtrado, sin estudios. */
  normas: Norma[];
  /** Todas las publicadas, para nombrar y enlazar las relacionadas. */
  publicadas: Norma[];
  /** Una relacionada publicada que los filtros ocultan: la vista quita los filtros. */
  onFuera?: (id: string) => void;
  /** Norma que hay que desplegar y mostrar apenas esté en la lista. */
  abrirAlCargar?: string | null;
}) {
  const reducido = useMovimientoReducido();
  const [abiertas, setAbiertas] = useState<Set<string>>(() => new Set(abrirAlCargar ? [abrirAlCargar] : []));
  // Cada salto es un objeto nuevo: así se puede volver a la misma norma sin reiniciar el estado.
  const [destino, setDestino] = useState<{ id: string } | null>(abrirAlCargar ? { id: abrirAlCargar } : null);

  // Cambio de estado mientras se renderiza (patrón de React): una norma por abrir que llega
  // después del primer render se despliega sin esperar a un efecto.
  const [pedida, setPedida] = useState(abrirAlCargar);
  if (abrirAlCargar !== pedida) {
    setPedida(abrirAlCargar);
    if (abrirAlCargar) {
      setAbiertas((a) => new Set(a).add(abrirAlCargar));
      setDestino({ id: abrirAlCargar });
    }
  }

  useEffect(() => {
    if (!destino) return;
    const tarjeta = document.getElementById(`norma-${destino.id}`);
    if (!tarjeta) return;
    tarjeta.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
    tarjeta.focus({ preventScroll: true });
    // Solo al cambiar el destino: un cambio de filtros o de movimiento no vuelve a desplazar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino]);

  const alternar = (id: string) =>
    setAbiertas((a) => {
      const nuevas = new Set(a);
      if (nuevas.has(id)) nuevas.delete(id);
      else nuevas.add(id);
      return nuevas;
    });

  const irA = (id: string) => {
    if (!normas.some((n) => n.id === id)) {
      onFuera?.(id);
      return;
    }
    setAbiertas((a) => new Set(a).add(id));
    setDestino({ id });
  };

  let posicion = 0;
  return (
    <div className="relative grid gap-8">
      <span aria-hidden="true" className="absolute inset-y-0 left-2 w-0.5 bg-[var(--line-300)] md:left-1/2 md:-translate-x-1/2" />
      {agruparPorAnio(normas).map(({ anio, normas: delAnio }) => (
        <section key={anio} aria-label={anio} className="relative grid gap-4">
          <h2
            id={`anio-${anio}`}
            className="relative z-10 ml-0 w-fit scroll-mt-24 rounded-full bg-[var(--teal-600)] px-4 py-1 text-lg font-extrabold text-white md:mx-auto"
          >
            {anio}
          </h2>
          {delAnio.map((n) => {
            const izquierda = posicion++ % 2 === 0;
            return (
              <div
                key={n.id}
                data-testid="fila-norma"
                className={`relative pl-6 md:w-1/2 md:pl-0 ${izquierda ? "md:pr-8" : "md:ml-auto md:pl-8"}`}
              >
                <TarjetaNorma
                  norma={n}
                  relacionadas={relacionadasDe(n, publicadas)}
                  abierta={abiertas.has(n.id)}
                  onAlternar={() => alternar(n.id)}
                  onIrA={irA}
                />
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
