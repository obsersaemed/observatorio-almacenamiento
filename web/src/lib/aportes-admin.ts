// Datos y reglas para la revisión de aportes en /admin (RF-08, RF-12).
import { columnasDe, valorEsCo, type TablaPublicable } from "./columnas";

export type AporteFila = {
  id: number;
  tipo: string;
  registro_afectado: string | null;
  descripcion: string;
  datos: Record<string, unknown>;
  fuente: string;
  origen: "usuario" | "agente" | "editor";
  agente: string | null;
  publicacion: string;
  creado_en: string;
};

export type TablaDestino = TablaPublicable;

/** Columna que identifica un registro en cada tabla (la que se escribe en registro_afectado). */
export const CLAVE_TABLA: Record<TablaDestino, string> = { proyectos: "nombre", normas: "id", noticias: "enlace" };

export function etiquetaOrigen({ origen, agente }: Pick<AporteFila, "origen" | "agente">): string {
  if (origen === "agente") return `Agente: ${agente ?? "sin nombre"}`;
  return origen === "editor" ? "Editor" : "Usuario";
}

export function tablaDestino({ tipo, datos }: Pick<AporteFila, "tipo" | "datos">): TablaDestino {
  if (tipo === "Noticia") return "noticias";
  if (tipo === "Norma") return "normas";
  if (tipo === "Corrección" && (datos.tabla === "normas" || datos.tabla === "noticias")) return datos.tabla;
  return "proyectos";
}

export type FilaComparacion = { campo: string; etiqueta: string; actual: string; propuesto: string; cambia: boolean };

/** Campos propuestos frente a los valores actuales del registro, con su nombre legible y en
 *  formato es-CO (CA-08.1, RNF-04). */
export function compararCampos(
  tabla: TablaDestino,
  actual: Record<string, unknown> | null,
  propuesto: Record<string, unknown>,
): FilaComparacion[] {
  const columnas = new Map(columnasDe(tabla).map((c) => [c.sql, c]));
  return Object.entries(propuesto)
    .filter(([campo]) => campo !== "tabla")
    .map(([campo, valor]) => {
      const c = columnas.get(campo);
      const a = valorEsCo(c, actual?.[campo]) || "—";
      const p = valorEsCo(c, valor) || "—";
      return { campo, etiqueta: c?.nombre ?? campo, actual: a, propuesto: p, cambia: a !== p };
    });
}
