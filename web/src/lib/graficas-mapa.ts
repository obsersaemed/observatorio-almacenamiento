// Cifras de las gráficas de /mapa (spec 006). Funciones puras sobre el mismo resultado filtrado
// que el mapa, la tabla y los KPI (RF-02); el dibujo y su «Ver como tabla» usan estas cifras.
// Reglas del proyecto: MW y MWh nunca se suman entre sí; las duraciones no se suman (RF-04).
import { ESTADOS } from "./kpi";
import { SIN_DATO, type ProyectoMapa } from "./proyectos-mapa";

export type Medida = "mw" | "mwh";
export type Fila = { categoria: string; valor: number | null };

const sumar = (valores: (number | null)[]) => valores.reduce<number>((t, v) => t + (v ?? 0), 0);
const medidaDe = (p: ProyectoMapa, medida: Medida) => (medida === "mw" ? p.mw : p.mwh);

/** Duración de un grupo: energía total ÷ potencia total de los proyectos con ambos datos. */
function duracion(proyectos: ProyectoMapa[]): number | null {
  const completos = proyectos.filter((p) => p.mw && p.mwh !== null);
  return completos.length ? sumar(completos.map((p) => p.mwh)) / sumar(completos.map((p) => p.mw)) : null;
}

/** Los 4 estados en orden fijo (RF-03), con potencia, energía o duración. */
export function porEstado(proyectos: ProyectoMapa[], medida: Medida | "h"): Fila[] {
  return ESTADOS.map((estado) => {
    const grupo = proyectos.filter((p) => p.estado === estado);
    return { categoria: estado, valor: medida === "h" ? duracion(grupo) : sumar(grupo.map((p) => medidaDe(p, medida))) };
  });
}

export type PuntoEvolucion = { anio: number; firme: number; anunciado: number };

const FIRMES = ["En operación", "En construcción"];
const AÑO = /^\d{4}$/;

/** Acumulado por año de FPO (RF-05): «firme» = En operación y en construcción; «anunciado»
 *  aparte. Inactivo no se suma. Los proyectos sin año se cuentan aparte (RF-06). */
export function evolucion(proyectos: ProyectoMapa[], medida: Medida) {
  const vigentes = proyectos.filter((p) => p.estado !== "Inactivo");
  const conAnio = vigentes.filter((p) => AÑO.test(p.fpo));
  const anios = [...new Set(conAnio.map((p) => Number(p.fpo)))].sort((a, b) => a - b);
  let firme = 0;
  let anunciado = 0;
  const puntos: PuntoEvolucion[] = anios.map((anio) => {
    for (const p of conAnio.filter((x) => Number(x.fpo) === anio)) {
      if (FIRMES.includes(p.estado)) firme += medidaDe(p, medida) ?? 0;
      else if (p.estado === "Anunciado") anunciado += medidaDe(p, medida) ?? 0;
    }
    return { anio, firme, anunciado };
  });
  return { puntos, sinAnio: vigentes.length - conAnio.length };
}

export type FilaTecnologia = { categoria: string; valor: number; porcentaje: number };

/** Participación por tecnología (RF-07) en MW, MWh o número de proyectos. «Sin dato» al final. */
export function porTecnologia(proyectos: ProyectoMapa[], medida: Medida | "proyectos") {
  const grupos = new Map<string, number>();
  for (const p of proyectos) {
    const clave = p.tecnologia || SIN_DATO;
    grupos.set(clave, (grupos.get(clave) ?? 0) + (medida === "proyectos" ? 1 : (medidaDe(p, medida) ?? 0)));
  }
  const total = sumar([...grupos.values()]);
  const filas: FilaTecnologia[] = [...grupos]
    .map(([categoria, valor]) => ({ categoria, valor, porcentaje: total ? (valor * 100) / total : 0 }))
    .sort((a, b) => Number(a.categoria === SIN_DATO) - Number(b.categoria === SIN_DATO) || b.valor - a.valor);
  return { filas, total };
}
