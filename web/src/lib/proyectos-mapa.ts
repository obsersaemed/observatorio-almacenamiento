// Lógica de la sección Implementación en el país (spec 002). Funciones puras: el mapa, la
// tabla, los KPI «según filtros» y la descarga usan el mismo resultado de filtrar() (RF-09).
// Reglas del proyecto: MW y MWh se suman por separado; «Instalado» cuenta solo En operación.
import definicion from "@/generado/esquemas.json";
import { leerNumero, separarLista } from "./esquemas";

/** Fila pública de `proyectos` (nombres SQL) que lee /mapa. */
export type FilaProyecto = {
  nombre: string;
  operador: string | null;
  estado: string;
  tecnologia: string | null;
  fpo: string | null;
  tipo_uso_conexion: string | null;
  punto_de_conexion_kv: number | string | null;
  departamento: string;
  municipio: string;
  latitud: number | string | null;
  longitud: number | string | null;
  potencia_nominal_mw: number | string | null;
  capacidad_maxima_mwh: number | string | null;
};

/** Fila con todas las columnas públicas (las del CSV); /mapa usa las de FilaProyecto. */
export type FilaPublica = FilaProyecto & Record<string, unknown>;

export const COLUMNAS_MAPA = [
  "nombre", "operador", "estado", "tecnologia", "fpo", "tipo_uso_conexion", "punto_de_conexion_kv",
  "departamento", "municipio", "latitud", "longitud", "potencia_nominal_mw", "capacidad_maxima_mwh",
] as const satisfies readonly (keyof FilaProyecto)[];

export type ProyectoMapa = {
  nombre: string;
  operador: string;
  estado: string;
  tecnologia: string;
  fpo: string;
  servicios: string[];
  departamento: string;
  municipio: string;
  kv: number | null;
  latitud: number | null;
  longitud: number | null;
  ubicado: boolean;
  mw: number | null;
  mwh: number | null;
  duracion: number | null;
};

/** Filtros de la sección (RF-08). Cada uno admite varios valores. */
export const CAMPOS_FILTRO = ["estado", "departamento", "municipio", "servicios", "operador", "tecnologia", "fpo"] as const;
export type CampoFiltro = (typeof CAMPOS_FILTRO)[number];
export type Filtros = Partial<Record<CampoFiltro, string[]>>;
export type Opcion = { valor: string; cantidad: number };

/** Valor de Servicios para los proyectos que no lo tienen (spec 002, aclaración 4). */
export const SIN_DATO = "Sin dato";

const SEPARADOR =
  definicion.proyectos.columnas.find((c) => c.nombre === "Tipo uso/conexión")?.separador ?? ",";
const texto = (v: unknown) => String(v ?? "").trim();

export function duracionHoras(mw: number | null, mwh: number | null): number | null {
  return mw && mwh !== null ? mwh / mw : null;
}

export function aProyectoMapa(f: FilaProyecto): ProyectoMapa {
  const latitud = leerNumero(f.latitud);
  const longitud = leerNumero(f.longitud);
  const mw = leerNumero(f.potencia_nominal_mw);
  const mwh = leerNumero(f.capacidad_maxima_mwh);
  return {
    nombre: texto(f.nombre),
    operador: texto(f.operador),
    estado: texto(f.estado),
    tecnologia: texto(f.tecnologia),
    fpo: texto(f.fpo),
    servicios: separarLista(texto(f.tipo_uso_conexion), SEPARADOR),
    departamento: texto(f.departamento),
    municipio: texto(f.municipio),
    kv: leerNumero(f.punto_de_conexion_kv),
    latitud,
    longitud,
    ubicado: latitud !== null && longitud !== null,
    mw,
    mwh,
    duracion: duracionHoras(mw, mwh),
  };
}

/** Valores de un proyecto para un filtro (Servicios puede tener varios, o «Sin dato»). */
function valoresDe(p: ProyectoMapa, campo: CampoFiltro): string[] {
  if (campo === "servicios") return p.servicios.length ? p.servicios : [SIN_DATO];
  return p[campo] ? [p[campo]] : [];
}

const cumple = (p: ProyectoMapa, campo: CampoFiltro, elegidos: string[] | undefined) =>
  !elegidos?.length || valoresDe(p, campo).some((v) => elegidos.includes(v));

/** Dentro de un filtro basta con un valor; entre filtros deben cumplirse todos (RF-08). */
export function filtrar(proyectos: ProyectoMapa[], filtros: Filtros): ProyectoMapa[] {
  return proyectos.filter((p) => CAMPOS_FILTRO.every((c) => cumple(p, c, filtros[c])));
}

/** Opciones de un filtro con su conteo, según los demás filtros. Así el municipio solo ofrece
 *  municipios de los departamentos elegidos (CA-08.2). «Sin dato» va al final. */
export function opcionesDe(proyectos: ProyectoMapa[], campo: CampoFiltro, filtros: Filtros): Opcion[] {
  const conteo = new Map<string, number>();
  for (const p of filtrar(proyectos, { ...filtros, [campo]: [] })) {
    for (const v of valoresDe(p, campo)) conteo.set(v, (conteo.get(v) ?? 0) + 1);
  }
  return [...conteo]
    .map(([valor, cantidad]) => ({ valor, cantidad }))
    .sort((a, b) => Number(a.valor === SIN_DATO) - Number(b.valor === SIN_DATO) || a.valor.localeCompare(b.valor, "es"));
}

const sumar = (valores: (number | null)[]) => valores.reduce<number>((t, v) => t + (v ?? 0), 0);

/** KPI de la sección (RF-11): «Instalado» (En operación, sin filtros) y «según filtros»
 *  (todos los estados del resultado). MW y MWh siempre por separado. */
export function kpiSeccion(todos: ProyectoMapa[], resultado: ProyectoMapa[]) {
  const operacion = todos.filter((p) => p.estado === "En operación");
  return {
    instalado: { mw: sumar(operacion.map((p) => p.mw)), mwh: sumar(operacion.map((p) => p.mwh)) },
    filtrado: { total: resultado.length, mw: sumar(resultado.map((p) => p.mw)), mwh: sumar(resultado.map((p) => p.mwh)) },
  };
}
