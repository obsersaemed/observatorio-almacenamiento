// Aprobación y rechazo de aportes (RF-09, RF-10, RF-16). La aplicación real ocurre en la
// función aplicar_aporte de la base (transacción, historial); aquí se valida con las reglas
// compartidas y se decide qué campos enviar.
import { tablaDestino, type AporteFila, type TablaDestino } from "./aportes-admin";
import { columnasDe, ESQUEMA_DE_TABLA, valorEsCo } from "./columnas";
import { validar } from "./esquemas";

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

export function datosDesdeFormulario(formulario: FormData): Record<string, string> {
  const datos: Record<string, string> = {};
  for (const [clave, valor] of formulario.entries()) {
    if (clave.startsWith("campo:")) datos[clave.slice("campo:".length)] = String(valor).trim();
  }
  return datos;
}

export type CampoDecision = { sql: string; etiqueta: string; obligatorio: boolean; valor: string; valores?: string[] };

/** Campos del formulario de aprobación: lo propuesto sobre lo actual, en es-CO, con listas
 *  para los campos de valores permitidos (CA-16.1, RNF-04). */
export function camposDecision(aporte: AporteFila, actual: Record<string, unknown> | null): CampoDecision[] {
  return columnasDe(tablaDestino(aporte)).map((c) => {
    let valor = valorEsCo(c, (aporte.datos ?? {})[c.sql] ?? actual?.[c.sql]);
    // CA-11.1: la cifra publicada debe citar la fuente que la respalda. La del aporte se suma
    // a la del registro (sin duplicar); en un registro nuevo sin fuente, se usa la del aporte.
    if (c.sql === "fuente") valor = unirFuentes(valor, aporte.fuente);
    return {
      sql: c.sql,
      etiqueta: c.nombre,
      obligatorio: Boolean(c.obligatorio),
      valor,
      ...(c.tipo === "enum" && c.valores ? { valores: c.valores } : {}),
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
  const resultante = { ...(actual ?? {}), ...ajustado };
  const { datos: validado, errores } = validar(
    ESQUEMA_DE_TABLA[tabla],
    Object.fromEntries(columnas.map((c) => [c.nombre, resultante[c.sql] ?? ""])),
  );
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
