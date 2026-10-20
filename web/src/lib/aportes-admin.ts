// Datos y reglas para la revisión de aportes en /admin (RF-08, RF-12).
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

export type TablaDestino = "proyectos" | "normas" | "noticias";

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

const mostrar = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

export type FilaComparacion = { campo: string; actual: string; propuesto: string; cambia: boolean };

/** Campos propuestos frente a los valores actuales del registro (CA-08.1). */
export function compararCampos(actual: Record<string, unknown> | null, propuesto: Record<string, unknown>): FilaComparacion[] {
  return Object.entries(propuesto)
    .filter(([campo]) => campo !== "tabla")
    .map(([campo, valor]) => {
      const a = mostrar(actual?.[campo]);
      const p = mostrar(valor);
      return { campo, actual: a, propuesto: p, cambia: a !== p };
    });
}
