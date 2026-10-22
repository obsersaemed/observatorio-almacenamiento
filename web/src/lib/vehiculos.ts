// Cifras de /vehiculos (spec 003). Funciones puras sobre las líneas filtradas: los KPI, la
// tabla de tecnología, las gráficas y la descarga usan el mismo resultado (RF-02).
// Energía = unidades × capacidad promedio de la línea (RF-04); se publica en MWh (RNF-04).
import definicion from "@/generado/esquemas.json";
import { leerNumero } from "./esquemas";

/** Filas públicas de la base (nombres SQL). */
export type FilaLinea = {
  marca: string;
  linea: string;
  tipo_de_bateria: string;
  capacidad_minima_kwh: number | string;
  capacidad_maxima_kwh: number | string;
  potencia_kw: number | string | null;
};
export type FilaVenta = { linea: string; ano: number | string; unidades: number | string };
export type Importacion = { actualizado_en: string; corte: string } | null;

export type LineaVehiculo = {
  marca: string;
  linea: string;
  tipo: string;
  capMin: number;
  capMax: number;
  capProm: number;
  potencia: number | null;
  porAnio: Record<number, number>;
  unidades: number;
  kwh: number;
};

export const CAMPOS_VEHICULOS = ["marca", "tipo", "linea"] as const;
export type CampoVehiculo = (typeof CAMPOS_VEHICULOS)[number];
export type FiltrosVehiculos = Partial<Record<CampoVehiculo, string[]>>;
export type Opcion = { valor: string; cantidad: number };

/** «Otros» agrupa las marcas que no están entre las 9 con más ventas (RF-06, RF-07). */
export const OTROS = "Otros";
const MARCAS_VISIBLES = 9;

export const TIPOS_BATERIA: string[] =
  definicion.vehiculos_lineas.columnas.find((c) => c.nombre === "Tipo de batería")?.valores ?? [];

const sumar = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

export function armarLineas(lineas: FilaLinea[], ventas: FilaVenta[]): LineaVehiculo[] {
  return lineas.map((l) => {
    const porAnio: Record<number, number> = {};
    for (const v of ventas.filter((x) => x.linea === l.linea)) porAnio[Number(v.ano)] = leerNumero(v.unidades) ?? 0;
    const capMin = leerNumero(l.capacidad_minima_kwh) ?? 0;
    const capMax = leerNumero(l.capacidad_maxima_kwh) ?? 0;
    const capProm = (capMin + capMax) / 2;
    const unidades = sumar(Object.values(porAnio));
    return {
      marca: l.marca,
      linea: l.linea,
      tipo: l.tipo_de_bateria,
      capMin,
      capMax,
      capProm,
      potencia: leerNumero(l.potencia_kw),
      porAnio,
      unidades,
      kwh: unidades * capProm,
    };
  });
}

/** Dentro de un filtro basta con un valor; entre filtros deben cumplirse todos. */
export function filtrar(lineas: LineaVehiculo[], filtros: FiltrosVehiculos): LineaVehiculo[] {
  return lineas.filter((l) => CAMPOS_VEHICULOS.every((c) => !filtros[c]?.length || filtros[c]!.includes(l[c])));
}

/** Opciones de un filtro con su conteo de vehículos, según los demás filtros (así la línea
 *  depende de la marca). */
export function opcionesDe(lineas: LineaVehiculo[], campo: CampoVehiculo, filtros: FiltrosVehiculos): Opcion[] {
  const conteo = new Map<string, number>();
  for (const l of filtrar(lineas, { ...filtros, [campo]: [] })) conteo.set(l[campo], (conteo.get(l[campo]) ?? 0) + l.unidades);
  return [...conteo].map(([valor, cantidad]) => ({ valor, cantidad })).sort((a, b) => a.valor.localeCompare(b.valor, "es"));
}

export function kpiVehiculos(lineas: LineaVehiculo[]) {
  return { vehiculos: sumar(lineas.map((l) => l.unidades)), mwh: sumar(lineas.map((l) => l.kwh)) / 1000 };
}

/** Participación en vehículos y energía por tipo de batería, en el orden del esquema. */
export function porTipo(lineas: LineaVehiculo[]) {
  const total = sumar(lineas.map((l) => l.unidades));
  return TIPOS_BATERIA.map((tipo) => {
    const grupo = lineas.filter((l) => l.tipo === tipo);
    const vehiculos = sumar(grupo.map((l) => l.unidades));
    return { tipo, vehiculos, porcentaje: total ? (vehiculos * 100) / total : 0, mwh: sumar(grupo.map((l) => l.kwh)) / 1000 };
  }).filter((t) => t.vehiculos > 0);
}

export type FilaMarca = { marca: string; total: number; porAnio: Record<number, number>; porcentaje: number };

/** Las 9 marcas con más ventas, de mayor a menor, y «Otros» con el resto (RF-06, RF-07). */
export function porMarca(lineas: LineaVehiculo[]): FilaMarca[] {
  const marcas = new Map<string, { total: number; porAnio: Record<number, number> }>();
  for (const l of lineas) {
    const m = marcas.get(l.marca) ?? { total: 0, porAnio: {} };
    m.total += l.unidades;
    for (const [anio, u] of Object.entries(l.porAnio)) m.porAnio[Number(anio)] = (m.porAnio[Number(anio)] ?? 0) + u;
    marcas.set(l.marca, m);
  }
  const total = sumar([...marcas.values()].map((m) => m.total));
  const ordenadas = [...marcas].map(([marca, m]) => ({ marca, ...m })).sort((a, b) => b.total - a.total || a.marca.localeCompare(b.marca, "es"));
  const visibles = ordenadas.length > MARCAS_VISIBLES ? ordenadas.slice(0, MARCAS_VISIBLES) : ordenadas;
  const resto = ordenadas.slice(visibles.length);
  const filas = [...visibles];
  if (resto.length) {
    const porAnio: Record<number, number> = {};
    for (const m of resto) for (const [anio, u] of Object.entries(m.porAnio)) porAnio[Number(anio)] = (porAnio[Number(anio)] ?? 0) + u;
    filas.push({ marca: OTROS, total: sumar(resto.map((m) => m.total)), porAnio });
  }
  return filas.map((f) => ({ ...f, porcentaje: total ? (f.total * 100) / total : 0 }));
}

/** Años con ventas, en orden. */
export function anios(lineas: LineaVehiculo[]): number[] {
  return [...new Set(lineas.flatMap((l) => Object.keys(l.porAnio).map(Number)))].sort((a, b) => a - b);
}

/** Un año es parcial si el corte de los datos es anterior al 31 de diciembre de ese año. */
export function esParcial(anio: number, corte: string | null): boolean {
  return Boolean(corte) && corte!.startsWith(String(anio)) && corte! < `${anio}-12-31`;
}
