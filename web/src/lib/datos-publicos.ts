// Lecturas públicas (solo lo aprobado) para las páginas del sitio. Se cachean y se
// revalidan cada 5 minutos (RF-10); al aprobar un aporte se invalida la etiqueta.
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { ProyectoKpi } from "./kpi";
import { fetchConReintento } from "./fetch-con-reintento";

export const ETIQUETA_PROYECTOS = "proyectos";

function clientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !llave) return null;
  return createClient(url, llave, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchConReintento },
  });
}

export async function proyectosParaKpi(): Promise<ProyectoKpi[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  cacheTag(ETIQUETA_PROYECTOS);

  const supabase = clientePublico();
  if (!supabase) {
    console.warn("Sin NEXT_PUBLIC_SUPABASE_URL/ANON_KEY: el inicio se muestra sin datos.");
    return [];
  }
  const { data, error } = await supabase
    .from("proyectos")
    .select("estado, potencia_nominal_mw, capacidad_maxima_mwh")
    .eq("publicacion", "Aprobado");
  if (error) throw new Error(`No se pudieron leer los proyectos: ${error.message}`);
  return data ?? [];
}

/** Registros aprobados de una tabla pública, para las descargas CSV (RF-14). */
export async function filasPublicadas(tabla: string): Promise<Record<string, unknown>[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  cacheTag(tabla);

  const supabase = clientePublico();
  if (!supabase) return [];
  const { data, error } = await supabase.from(tabla).select("*").eq("publicacion", "Aprobado");
  if (error) throw new Error(`No se pudieron leer ${tabla}: ${error.message}`);
  return data ?? [];
}
