"use server";

// Pide el enlace mágico (RF-07). Flujo PKCE: el verificador queda en una cookie de este
// navegador y /admin/confirmar lo canjea por la sesión; el enlace debe abrirse aquí mismo.
import { headers } from "next/headers";
import { pedirEnlace, type ResultadoEnlace } from "@/lib/acceso";
import { clienteConSesion, esEditorSupabase } from "@/lib/acceso-supabase";
import { clienteServicio } from "@/lib/aportes-supabase";

export async function pedirAcceso(_anterior: ResultadoEnlace | null, datos: FormData): Promise<ResultadoEnlace> {
  const cabeceras = await headers();
  const origen = `${cabeceras.get("x-forwarded-proto") ?? "http"}://${cabeceras.get("host")}`;
  const supabase = await clienteConSesion();
  return pedirEnlace(String(datos.get("correo") ?? ""), `${origen}/admin/confirmar`, {
    esEditor: esEditorSupabase(clienteServicio()),
    async enviarEnlace(correo, redirigirA) {
      const { error } = await supabase.auth.signInWithOtp({
        email: correo,
        options: { emailRedirectTo: redirigirA, shouldCreateUser: true },
      });
      if (error) throw error;
    },
  });
}

export async function salir() {
  const supabase = await clienteConSesion();
  await supabase.auth.signOut();
}
