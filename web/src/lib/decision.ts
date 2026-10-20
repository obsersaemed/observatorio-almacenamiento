// Aprobación y rechazo de aportes (RF-09, RF-10, RF-16). La aplicación real ocurre en la
// función aplicar_aporte de la base (transacción, historial); aquí se valida con las reglas
// compartidas y se decide qué campos enviar.
import definicion from "@/generado/esquemas.json";
import { tablaDestino, type AporteFila, type TablaDestino } from "./aportes-admin";
import { validar, type NombreEsquema } from "./esquemas";

export type ResultadoDecision = { ok: true } | { ok: false; errores: string[] };

export type DependenciasDecision = {
  aplicar: (aporteId: number, datos: Record<string, unknown>) => Promise<void>;
  rechazar: (aporteId: number, motivo: string) => Promise<void>;
  revalidar: (etiqueta: TablaDestino) => void;
};

/** Igual que columna_sql() en scripts/validar_datos.py: 'Potencia nominal [MW]' → 'potencia_nominal_mw'. */
export function columnaSql(nombre: string): string {
  return nombre
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const ESQUEMA_DE_TABLA: Record<TablaDestino, NombreEsquema> = {
  proyectos: "proyectos",
  normas: "normativa",
  noticias: "noticias",
};

/** Columnas editables de una tabla: nombre original (etiqueta) y nombre SQL. */
export function columnasDe(tabla: TablaDestino) {
  return definicion[ESQUEMA_DE_TABLA[tabla]].columnas
    .map((c) => ({ ...c, sql: columnaSql(c.nombre) }))
    .filter((c) => c.sql !== "publicacion");
}

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
