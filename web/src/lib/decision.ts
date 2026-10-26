// Aprobación y rechazo de aportes (RF-09, RF-10, RF-16). La aplicación real ocurre en la
// función aplicar_aporte de la base (transacción, historial); aquí se valida con las reglas
// compartidas y se decide qué campos enviar.
import { tablaDestino, type AporteFila, type TablaDestino } from "./aportes-admin";
import { columnasDe, ESQUEMA_DE_TABLA, valorEsCo } from "./columnas";
import { separarLista, validar } from "./esquemas";

export { columnaSql, columnasDe, ESQUEMA_DE_TABLA } from "./columnas";

export type ResultadoDecision = { ok: true } | { ok: false; errores: string[] };

export type DependenciasDecision = {
  aplicar: (aporteId: number, datos: Record<string, unknown>) => Promise<void>;
  rechazar: (aporteId: number, motivo: string) => Promise<void>;
  revalidar: (etiqueta: TablaDestino) => void;
};

const vacio = (v: unknown) => v === null || v === undefined || String(v).trim() === "";
const igual = (a: unknown, b: unknown) =>
  (vacio(a) && vacio(b)) || (!vacio(a) && !vacio(b) && String(a).trim() === String(b).trim());

/** Los campos de lista llegan como varias casillas con la misma clave (más una vacía, para
 *  poder quitarlas todas): se unen con «, », igual que se guardan en la base. */
export function datosDesdeFormulario(formulario: FormData): Record<string, string> {
  const datos: Record<string, string> = {};
  for (const clave of new Set(formulario.keys())) {
    if (!clave.startsWith("campo:")) continue;
    const valores = formulario.getAll(clave).map((v) => String(v).trim());
    datos[clave.slice("campo:".length)] = valores.length > 1 ? valores.filter(Boolean).join(", ") : valores[0];
  }
  return datos;
}

export type CampoDecision = {
  sql: string;
  etiqueta: string;
  obligatorio: boolean;
  valor: string;
  valores?: string[];
  multiple?: boolean;
  /** Valores propuestos que no están en la lista: no se pueden marcar y no se guardan (O-3). */
  aviso?: string;
};

/** Campos del formulario de aprobación: lo propuesto sobre lo actual, en es-CO, con listas
 *  para los campos de valores permitidos (CA-16.1, RNF-04). */
export function camposDecision(aporte: AporteFila, actual: Record<string, unknown> | null): CampoDecision[] {
  return columnasDe(tablaDestino(aporte)).map((c) => {
    let valor = valorEsCo(c, (aporte.datos ?? {})[c.sql] ?? actual?.[c.sql]);
    // CA-11.1: la cifra publicada debe citar la fuente que la respalda. La del aporte se suma
    // a la del registro (sin duplicar); en un registro nuevo sin fuente, se usa la del aporte.
    if (c.sql === "fuente") valor = unirFuentes(valor, aporte.fuente);
    const fuera = c.tipo === "lista" && c.valores ? separarLista(valor).filter((v) => !c.valores!.includes(v)) : [];
    return {
      sql: c.sql,
      etiqueta: c.etiqueta ?? c.nombre,
      obligatorio: Boolean(c.obligatorio),
      valor,
      ...(c.tipo === "enum" && c.valores ? { valores: c.valores } : {}),
      ...(c.tipo === "lista" && c.valores ? { valores: c.valores, multiple: true } : {}),
      ...(fuera.length
        ? {
            aviso: `El aporte propone ${fuera.map((v) => `«${v}»`).join(", ")}, que no está en la lista. Elige los servicios que correspondan; ese valor no se guardará.`,
          }
        : {}),
    };
  });
}

function unirFuentes(...fuentes: string[]): string {
  const enlaces = fuentes.flatMap((f) => (f ?? "").split(/\s+/)).filter(Boolean);
  return [...new Set(enlaces)].join(" ");
}

export async function rechazarAporte(id: number, motivo: string, deps: DependenciasDecision): Promise<ResultadoDecision> {
  if (!motivo.trim()) return { ok: false, errores: ["El motivo es obligatorio para rechazar un aporte."] };
  try {
    await deps.rechazar(id, motivo.trim());
    return { ok: true };
  } catch (e) {
    return { ok: false, errores: [(e as Error).message] };
  }
}

export async function aprobarAporte(
  aporte: AporteFila,
  actual: Record<string, unknown> | null,
  ajustado: Record<string, unknown>,
  deps: DependenciasDecision,
): Promise<ResultadoDecision> {
  const tabla = tablaDestino(aporte);
  const columnas = columnasDe(tabla);

  // El registro resultante debe cumplir las mismas reglas que el formulario y la importación.
  // Se valida como «Aprobado», que es el estado que tendrá: el esquema de noticias exige
  // `publicacion` y el formulario no la ofrece (la pone la base al aprobar; 005 · T11).
  const resultante = { ...(actual ?? {}), ...ajustado };
  const { datos: validado, errores } = validar(ESQUEMA_DE_TABLA[tabla], {
    ...Object.fromEntries(columnas.map((c) => [c.nombre, resultante[c.sql] ?? ""])),
    publicacion: "Aprobado",
  });
  if (errores.length || !validado) return { ok: false, errores };

  const cambios: Record<string, unknown> = {};
  for (const c of columnas) {
    const valor = validado[c.nombre];
    if (actual ? !igual(valor, actual[c.sql]) : !vacio(valor)) cambios[c.sql] = valor ?? null;
  }
  if (!Object.keys(cambios).length) return { ok: false, errores: ["No hay cambios para aprobar."] };

  try {
    await deps.aplicar(aporte.id, cambios);
  } catch (e) {
    return { ok: false, errores: [(e as Error).message] };
  }
  deps.revalidar(tabla);
  return { ok: true };
}
