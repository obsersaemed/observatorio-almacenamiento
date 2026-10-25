// Lecturas públicas (solo lo aprobado) para las páginas del sitio. Se cachean y se
// revalidan cada 5 minutos (RF-10); al aprobar un aporte se invalida la etiqueta.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { ProyectoKpi } from "./kpi";
import { columnasDeSeccion } from "./csv";
import type { FilaPublica } from "./proyectos-mapa";
import type { FilaLinea, FilaVenta, Importacion } from "./vehiculos";
import type { Norma } from "./normativa";
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

/** Proyectos aprobados para /mapa (spec 002, RF-01): las columnas del CSV público, porque la
 *  sección también descarga el resultado filtrado (RF-13). Sin columnas internas. */
export async function leerProyectosMapa(supabase: SupabaseClient): Promise<FilaPublica[]> {
  const columnas = [...columnasDeSeccion("proyectos").map((c) => c.sql), "publicacion"];
  const { data, error } = await supabase
    .from("proyectos")
    .select(columnas.join(", "))
    .eq("publicacion", "Aprobado")
    .order("nombre");
  if (error) throw new Error(`No se pudieron leer los proyectos: ${error.message}`);
  return (data ?? []) as unknown as FilaPublica[];
}

export async function proyectosParaMapa(): Promise<FilaPublica[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  cacheTag(ETIQUETA_PROYECTOS);

  const supabase = clientePublico();
  if (!supabase) {
    console.warn("Sin NEXT_PUBLIC_SUPABASE_URL/ANON_KEY: /mapa se muestra sin datos.");
    return [];
  }
  return leerProyectosMapa(supabase);
}

export const ETIQUETA_VEHICULOS = "vehiculos";

/** Vehículos eléctricos (spec 003): líneas, ventas y la última importación (RF-12). */
export async function leerVehiculos(supabase: SupabaseClient) {
  const [lineas, ventas, importacion] = await Promise.all([
    supabase.from("vehiculos_lineas").select("marca, linea, tipo_de_bateria, capacidad_minima_kwh, capacidad_maxima_kwh, potencia_kw").order("linea"),
    supabase.from("vehiculos_ventas").select("linea, ano, unidades").order("linea").order("ano"),
    supabase.from("vehiculos_importaciones").select("actualizado_en, corte").order("id", { ascending: false }).limit(1),
  ]);
  const error = lineas.error ?? ventas.error ?? importacion.error;
  if (error) throw new Error(`No se pudieron leer los vehículos: ${error.message}`);
  return {
    lineas: (lineas.data ?? []) as FilaLinea[],
    ventas: (ventas.data ?? []) as FilaVenta[],
    importacion: (importacion.data?.[0] ?? null) as Importacion,
  };
}

export async function vehiculosPublicos() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  cacheTag(ETIQUETA_VEHICULOS);

  const supabase = clientePublico();
  if (!supabase) {
    console.warn("Sin NEXT_PUBLIC_SUPABASE_URL/ANON_KEY: /vehiculos se muestra sin datos.");
    return { lineas: [], ventas: [], importacion: null };
  }
  return leerVehiculos(supabase);
}

/** Etiqueta de caché de /normativa: la misma tabla que /admin revalida al aprobar (spec 004, RF-16). */
export const ETIQUETA_NORMAS = "normas";

const COLUMNAS_NORMAS = "id, fecha, precision_fecha, emisor, tipo, numero, titulo, estado, resumen, explicacion, aplica_a, relacionada_con, enlace";

/** Normas aprobadas (spec 004, RF-13); el orden de la línea de tiempo lo da lib/normativa. */
export async function leerNormas(supabase: SupabaseClient): Promise<Norma[]> {
  const { data, error } = await supabase.from("normas").select(COLUMNAS_NORMAS).eq("publicacion", "Aprobado").order("fecha", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las normas: ${error.message}`);
  return (data ?? []) as Norma[];
}

export async function normasPublicas(): Promise<Norma[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  cacheTag(ETIQUETA_NORMAS);

  const supabase = clientePublico();
  if (!supabase) {
    console.warn("Sin NEXT_PUBLIC_SUPABASE_URL/ANON_KEY: /normativa se muestra sin datos.");
    return [];
  }
  return leerNormas(supabase);
}
