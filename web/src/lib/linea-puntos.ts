// Línea de puntos de /normativa (spec 007, RF-23): posición de cada norma (%) en una escala
// lineal de fechas, del primer al último año con medio año de margen a cada lado, y marcas de
// año cada 2 años. Lógica pura: el componente solo la presenta.
import type { Norma } from "./normativa";

type NormaConFecha = Pick<Norma, "id" | "fecha" | "precision_fecha">;
export type PuntoLinea = { id: string; posicion: number; arriba: boolean };
export type MarcaAnio = { anio: number; posicion: number };

const MARGEN = 0.5;
const PASO_MARCAS = 2;

const diasDelAnio = (anio: number) => (Date.UTC(anio + 1, 0, 1) - Date.UTC(anio, 0, 1)) / 86_400_000;
const diaDelAnio = (anio: number, mes: number, dia: number) => (Date.UTC(anio, mes, dia) - Date.UTC(anio, 0, 1)) / 86_400_000;

/** Año con decimales. Con precisión de año va a mitad del año; de mes, a mitad del mes. */
export function anioDecimal({ fecha, precision_fecha }: Pick<Norma, "fecha" | "precision_fecha">): number {
  const anio = Number(fecha.slice(0, 4));
  if (precision_fecha === "Año") return anio + 0.5;
  const mes = Number(fecha.slice(5, 7)) - 1;
  if (precision_fecha === "Mes") {
    const medio = (diaDelAnio(anio, mes, 1) + diaDelAnio(anio, mes + 1, 1)) / 2;
    return anio + medio / diasDelAnio(anio);
  }
  return anio + diaDelAnio(anio, mes, Number(fecha.slice(8, 10))) / diasDelAnio(anio);
}

export function lineaPuntos(normas: NormaConFecha[]): { puntos: PuntoLinea[]; marcas: MarcaAnio[] } {
  if (!normas.length) return { puntos: [], marcas: [] };
  const fechas = normas.map((n) => ({ id: n.id, anio: anioDecimal(n) })).sort((a, b) => a.anio - b.anio);
  const primero = Math.floor(fechas[0].anio);
  const ultimo = Math.floor(fechas.at(-1)!.anio);
  const inicio = primero - MARGEN;
  const fin = ultimo + 1 + MARGEN;
  const posicion = (anio: number) => ((anio - inicio) / (fin - inicio)) * 100;

  const marcas: MarcaAnio[] = [];
  for (let anio = primero; anio <= ultimo + 1; anio += PASO_MARCAS) marcas.push({ anio, posicion: posicion(anio) });

  // Ordenados por fecha, alternan arriba y abajo para que los cercanos no se tapen.
  const puntos = fechas.map((f, i) => ({ id: f.id, posicion: posicion(f.anio), arriba: i % 2 === 0 }));
  return { puntos, marcas };
}
