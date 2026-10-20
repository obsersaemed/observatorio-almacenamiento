"use server";

// Decisiones del editor sobre un aporte (RF-09, RF-10). Se releen aporte y registro actual
// desde la base con la sesión del editor; la aplicación real la hace aplicar_aporte (0002).
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { clienteConSesion } from "@/lib/acceso-supabase";
import { CLAVE_TABLA, tablaDestino, type AporteFila } from "@/lib/aportes-admin";
import { aprobarAporte, datosDesdeFormulario, rechazarAporte, type DependenciasDecision, type ResultadoDecision } from "@/lib/decision";

async function contexto(id: number) {
  const supabase = await clienteConSesion();
  const { data } = await supabase.from("aportes").select("*").eq("id", id).maybeSingle();
  const aporte = data as AporteFila | null;
  const deps: DependenciasDecision = {
    async aplicar(aporteId, datos) {
      const { error } = await supabase.rpc("aplicar_aporte", { p_aporte_id: aporteId, p_datos: datos });
      if (error) throw new Error(error.message);
    },
    async rechazar(aporteId, motivo) {
      const { error } = await supabase.rpc("rechazar_aporte", { p_aporte_id: aporteId, p_motivo: motivo });
      if (error) throw new Error(error.message);
    },
    revalidar: (etiqueta) => updateTag(etiqueta),
  };
  return { supabase, aporte, deps };
}

export async function aprobar(id: number, _anterior: ResultadoDecision | null, formulario: FormData): Promise<ResultadoDecision> {
  const { supabase, aporte, deps } = await contexto(id);
  if (!aporte) return { ok: false, errores: ["El aporte no existe o no tienes permiso para verlo."] };
  let actual: Record<string, unknown> | null = null;
  if (aporte.tipo === "Corrección" && aporte.registro_afectado) {
    const tabla = tablaDestino(aporte);
    actual = (await supabase.from(tabla).select("*").eq(CLAVE_TABLA[tabla], aporte.registro_afectado).maybeSingle()).data;
    if (!actual) return { ok: false, errores: [`No se encontró "${aporte.registro_afectado}" en ${tabla}.`] };
  }
  const r = await aprobarAporte(aporte, actual, datosDesdeFormulario(formulario), deps);
  if (r.ok) redirect("/admin");
  return r;
}

export async function rechazar(id: number, _anterior: ResultadoDecision | null, formulario: FormData): Promise<ResultadoDecision> {
  const { deps } = await contexto(id);
  const r = await rechazarAporte(id, String(formulario.get("motivo") ?? ""), deps);
  if (r.ok) redirect("/admin");
  return r;
}
