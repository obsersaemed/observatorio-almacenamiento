// Columnas de las tablas publicables según datos/esquemas.json: nombre legible (etiqueta),
// nombre SQL, tipo y valores permitidos. Y cómo mostrar un valor en es-CO (RNF-04).
import definicion from "@/generado/esquemas.json";
import { leerNumero, type NombreEsquema } from "./esquemas";

export type TablaPublicable = "proyectos" | "normas" | "noticias";

/** Igual que columna_sql() en scripts/validar_datos.py: 'Potencia nominal [MW]' → 'potencia_nominal_mw'. */
export function columnaSql(nombre: string): string {
  return nombre
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const ESQUEMA_DE_TABLA: Record<TablaPublicable, NombreEsquema> = {
  proyectos: "proyectos",
  normas: "normativa",
  noticias: "noticias",
};

export type Columna = {
  nombre: string;
  /** Nombre en la interfaz cuando difiere del de los datos (p. ej. «Servicios»). */
  etiqueta?: string;
  sql: string;
  tipo: string;
  obligatorio?: boolean;
  valores?: string[];
};

/** Columnas editables de una tabla (sin el estado de publicación). */
export function columnasDe(tabla: TablaPublicable): Columna[] {
  return (definicion[ESQUEMA_DE_TABLA[tabla]].columnas as Omit<Columna, "sql">[])
    .map((c) => ({ ...c, sql: columnaSql(c.nombre) }))
    .filter((c) => c.sql !== "publicacion");
}

// Sin separador de miles: el valor también prellena formularios y debe leerse de vuelta igual
// ("1.500" se confundiría con 1,5).
const numeroEsCo = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 6, useGrouping: false });

/** Valor de una columna para mostrarlo o prellenarlo en un formulario, en formato es-CO. */
export function valorEsCo(columna: Pick<Columna, "tipo"> | undefined, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "";
  if (columna?.tipo === "numero") {
    const n = leerNumero(valor);
    if (n !== null) return numeroEsCo.format(n);
  }
  return String(valor);
}
