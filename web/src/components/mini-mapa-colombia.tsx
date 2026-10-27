// Mapa pequeño de la tarjeta «Implementación» del inicio (spec 007, RF-12): el contorno de
// Colombia (public/fondo-colombia.png, 781 × 1040 px) con un punto por proyecto del color de su
// estado. La imagen es la del fondo del sitio y se ubica con una proyección lineal:
// x = (lon + 79,02) / 12,17 · 100 % y y = (12,46 − lat) / 16,69 · 100 %.
// Es decorativo: la información está en /mapa.
import Image from "next/image";
import { colorDe } from "@/components/mapa/leyenda";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";

type PuntoMapa = Pick<ProyectoMapa, "nombre" | "estado" | "latitud" | "longitud">;

const x = (lon: number) => ((lon + 79.02) / 12.17) * 100;
const y = (lat: number) => ((12.46 - lat) / 16.69) * 100;

export function MiniMapaColombia({ proyectos }: { proyectos: PuntoMapa[] }) {
  const ubicados = proyectos.filter((p) => p.latitud !== null && p.longitud !== null);
  return (
    <div className="relative h-full" style={{ aspectRatio: "781 / 1040" }}>
      <Image src="/fondo-colombia.png" alt="" width={781} height={1040} className="h-full w-full opacity-60" />
      {ubicados.map((p, i) => (
        <span
          key={`${p.nombre}-${i}`}
          data-testid="punto-proyecto"
          aria-hidden="true"
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-card"
          style={{ left: `${x(p.longitud as number)}%`, top: `${y(p.latitud as number)}%`, backgroundColor: colorDe(p.estado) }}
        />
      ))}
    </div>
  );
}
