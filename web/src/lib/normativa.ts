// Línea de tiempo normativa (spec 004): orden, años, filtros, conteo, estudios aparte y normas
// relacionadas. Lógica pura: los componentes de /normativa solo la presentan.
import definicion from "@/generado/esquemas.json";
import { formatoFecha, formatoNumero } from "./formato";

export type Norma = {
  id: string;
  fecha: string;
  /** Vacío o «Día»: fecha completa. «Mes» o «Año»: el documento no trae el día (CA-04.3). */
  precision_fecha?: string | null;
  emisor: string;
  tipo: string;
  numero: string;
  titulo: string;
  estado: string;
  resumen: string | null;
  explicacion: string | null;
  aplica_a: string | null;
  relacionada_con: string | null;
  enlace: string;
};

export const CAMPOS_NORMATIVA = ["entidad", "tipo", "estado", "anio"] as const;
export type CampoNormativa = (typeof CAMPOS_NORMATIVA)[number];
export type FiltrosNormativa = Partial<Record<CampoNormativa, string[]>>;
export type Opcion = { valor: string; cantidad: number };

/** Los estudios académicos van en «Documentos de referencia», fuera de la línea (aclaración 1). */
export const TIPO_ESTUDIO = "Estudio";

const valoresDe = (columna: string): string[] =>
  definicion.normativa.columnas.find((c) => c.nombre === columna)?.valores ?? [];
const ESTADOS = valoresDe("estado");

export const anioDe = (n: Norma) => n.fecha.slice(0, 4);

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «19/06/2026», «septiembre de 2026» o «2025», según lo que trae el documento (CA-04.3). */
export function fechaDeNorma(n: Pick<Norma, "fecha" | "precision_fecha">): string {
  if (n.precision_fecha === "Año") return n.fecha.slice(0, 4);
  if (n.precision_fecha === "Mes") return `${MESES[Number(n.fecha.slice(5, 7)) - 1]} de ${n.fecha.slice(0, 4)}`;
  return formatoFecha(n.fecha);
}

function valorDe(n: Norma, campo: CampoNormativa): string {
  if (campo === "entidad") return n.emisor;
  if (campo === "anio") return anioDe(n);
  return n[campo];
}

/** De la más reciente a la más antigua; con la misma fecha, por entidad y luego por número
 *  (aclaración 5). */
export function ordenar(normas: Norma[]): Norma[] {
  return [...normas].sort(
    (a, b) =>
      b.fecha.localeCompare(a.fecha) ||
      a.emisor.localeCompare(b.emisor, "es") ||
      a.numero.localeCompare(b.numero, "es", { numeric: true }),
  );
}

export function agruparPorAnio(normas: Norma[]): { anio: string; normas: Norma[] }[] {
  const grupos = new Map<string, Norma[]>();
  for (const n of ordenar(normas)) grupos.set(anioDe(n), [...(grupos.get(anioDe(n)) ?? []), n]);
  return [...grupos].map(([anio, lista]) => ({ anio, normas: lista }));
}

export const aniosDe = (normas: Norma[]) => agruparPorAnio(normas).map((g) => g.anio);

export function separar(normas: Norma[]) {
  return {
    linea: normas.filter((n) => n.tipo !== TIPO_ESTUDIO),
    referencia: ordenar(normas.filter((n) => n.tipo === TIPO_ESTUDIO)),
  };
}

export function filtrar(normas: Norma[], filtros: FiltrosNormativa): Norma[] {
  return normas.filter((n) => CAMPOS_NORMATIVA.every((c) => !filtros[c]?.length || filtros[c]!.includes(valorDe(n, c))));
}

/** Opciones de un filtro con su conteo de normas, según los demás filtros. Los años van de
 *  mayor a menor, los estados en el orden del esquema y lo demás en orden alfabético. */
export function opcionesDe(normas: Norma[], campo: CampoNormativa, filtros: FiltrosNormativa): Opcion[] {
  const conteo = new Map<string, number>();
  for (const n of filtrar(normas, { ...filtros, [campo]: [] })) conteo.set(valorDe(n, campo), (conteo.get(valorDe(n, campo)) ?? 0) + 1);
  const orden = (a: string, b: string) => {
    if (campo === "anio") return b.localeCompare(a);
    if (campo === "estado") return ESTADOS.indexOf(a) - ESTADOS.indexOf(b);
    return a.localeCompare(b, "es");
  };
  return [...conteo].map(([valor, cantidad]) => ({ valor, cantidad })).sort((a, b) => orden(a.valor, b.valor));
}

export const textoConteo = (total: number) => `${formatoNumero(total)} ${total === 1 ? "norma" : "normas"}`;

/** «Resolución CREG 098 de 2019»; una ley no repite al Congreso. */
export function textoNorma(n: Pick<Norma, "tipo" | "emisor" | "numero" | "fecha">): string {
  const emisor = n.tipo === "Ley" ? "" : ` ${n.emisor}`;
  return `${n.tipo}${emisor} ${n.numero} de ${n.fecha.slice(0, 4)}`;
}

// Códigos de tipo en el id (`EMISOR-TIPO-NÚMERO-AÑO`), para nombrar una relacionada sin publicar.
const TIPO_DE_CODIGO: Record<string, string> = {
  LEY: "Ley", DEC: "Decreto", RES: "Resolución", PRY: "Proyecto de resolución", ACU: "Acuerdo",
  CIR: "Circular", DOC: "Documento", EST: "Estudio",
};

function textoDeId(id: string): string {
  const partes = id.split("-");
  if (partes.length < 4) return id;
  const [emisor, codigo] = partes;
  const anio = partes[partes.length - 1];
  const numero = partes.slice(2, -1).join("-");
  const tipo = TIPO_DE_CODIGO[codigo];
  return tipo ? textoNorma({ tipo, emisor, numero, fecha: anio }) : id;
}

export type Relacionada = { id: string; norma: Norma | null; texto: string };

/** Normas citadas en `relacionada_con` (ids separados por «;»). Si está publicada se puede
 *  enlazar; si no, solo se nombra (RF-06). */
export function relacionadasDe(norma: Norma, publicadas: Norma[]): Relacionada[] {
  return (norma.relacionada_con ?? "")
    .split(";")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => {
      const encontrada = publicadas.find((n) => n.id === id) ?? null;
      return { id, norma: encontrada, texto: encontrada ? textoNorma(encontrada) : textoDeId(id) };
    });
}
