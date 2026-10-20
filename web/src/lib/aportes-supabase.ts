// Dependencias reales de registrarAporte sobre Supabase. Usa la llave de servicio, así
// que solo se importa desde código de servidor (la server action de /aportar).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DependenciasAporte } from "./aportes";

const UNA_HORA_MS = 60 * 60 * 1000;

export function clienteServicio(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function dependenciasSupabase(
  supabase: SupabaseClient,
  verificarHumano: DependenciasAporte["verificarHumano"],
): DependenciasAporte {
  return {
    verificarHumano,
    async contarRecientes(origenHash) {
      const desde = new Date(Date.now() - UNA_HORA_MS).toISOString();
      const { count, error } = await supabase
        .from("aportes")
        .select("id", { count: "exact", head: true })
        .eq("origen_hash", origenHash)
        .gte("creado_en", desde);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async insertarAporte(fila) {
      const { data, error } = await supabase.from("aportes").insert(fila).select("id").single();
      if (error) throw new Error(error.message);
      return data.id as number;
    },
    async insertarAportante(aporteId, correo) {
      const { error } = await supabase.from("aportantes").insert({ aporte_id: aporteId, correo });
      if (error) throw new Error(error.message);
    },
    async borrarAporte(aporteId) {
      await supabase.from("aportes").delete().eq("id", aporteId);
    },
  };
}
