// Piezas de Supabase para el acceso de editores. Solo servidor.
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { normalizarCorreo } from "./acceso";
import { fetchConReintento } from "./fetch-con-reintento";

/** ¿El correo está en `editores`? Se consulta con la llave de servicio, antes de enviar nada.
 *  Comparación exacta (no ilike: % y _ del visitante actuarían como comodines); los correos
 *  de editores se guardan en minúsculas (restricción en la migración 0002). */
export function esEditorSupabase(servicio: SupabaseClient) {
  return async (correo: string) => {
    const { data, error } = await servicio
      .from("editores")
      .select("correo")
      .eq("correo", normalizarCorreo(correo))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data !== null;
  };
}

/** Cliente con la sesión del visitante (cookies). Las consultas pasan por RLS como ese usuario. */
export async function clienteConSesion() {
  // Marca la petición como dinámica antes de que el cliente consulte la hora (vencimiento
  // de la sesión); sin esto Next 16 avisa de Date.now() durante el prerender.
  await connection();
  const almacen = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: fetchConReintento },
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // Desde un componente de servidor no se pueden escribir cookies; el proxy las renueva.
        }
      },
    },
  });
}

/** Correo de la sesión actual y si es editor según la base (función es_editor). */
export async function sesionEditor() {
  const supabase = await clienteConSesion();
  const { data } = await supabase.auth.getUser();
  const correo = data.user?.email ?? null;
  if (!correo) return { supabase, correo: null, esEditor: false };
  const { data: esEditor } = await supabase.rpc("es_editor");
  return { supabase, correo, esEditor: esEditor === true };
}
