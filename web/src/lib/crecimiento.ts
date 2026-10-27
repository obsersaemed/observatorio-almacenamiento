// Crecimiento del almacenamiento para la gráfica del inicio (spec 007, RF-10). Función pura,
// aparte de evolucion() de graficas-mapa, que separa los estados de otra forma.
// Solo potencia [MW]: MW y MWh nunca se suman ni comparten eje.
import type { ProyectoMapa } from "./proyectos-mapa";

export type BarraCrecimiento = { anio: number; mw: number; proyeccion: boolean };

const SUMAN = ["En operación", "En construcción", "Anunciado"];
const PROYECCION = ["En construcción", "Anunciado"];
const AÑO = /^\d{4}$/;

/** MW acumulados por año de FPO de los proyectos En operación, En construcción y Anunciado
 *  (Inactivo no suma). Desde el primer año con algún proyecto En construcción o Anunciado, las
 *  barras son proyección. Los proyectos sin año quedan fuera y se cuentan en `sinAnio`. */
export function crecimiento(proyectos: Pick<ProyectoMapa, "estado" | "mw" | "fpo">[]) {
  const vigentes = proyectos.filter((p) => SUMAN.includes(p.estado));
  const conAnio = vigentes.filter((p) => AÑO.test(p.fpo));
  const anios = [...new Set(conAnio.map((p) => Number(p.fpo)))].sort((a, b) => a - b);
  let mw = 0;
  let proyeccion = false;
  const barras: BarraCrecimiento[] = anios.map((anio) => {
    for (const p of conAnio.filter((x) => Number(x.fpo) === anio)) {
      mw += p.mw ?? 0;
      if (PROYECCION.includes(p.estado)) proyeccion = true;
    }
    return { anio, mw, proyeccion };
  });
  return { barras, sinAnio: vigentes.length - conAnio.length };
}
