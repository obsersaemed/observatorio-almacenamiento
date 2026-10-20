"use server";

// Server action del formulario /aportar: une la lógica de registrarAporte con Supabase y
// Turnstile. La IP solo se usa para el límite de envíos y se guarda como hash.
import { headers } from "next/headers";
import { registrarAporte, type ResultadoAporte } from "@/lib/aportes";
import { clienteServicio, dependenciasSupabase } from "@/lib/aportes-supabase";
import { verificarTurnstile } from "@/lib/turnstile";

export async function enviarAporte(_anterior: ResultadoAporte | null, datos: FormData): Promise<ResultadoAporte> {
  const cabeceras = await headers();
  const ip = (cabeceras.get("x-forwarded-for") ?? "").split(",")[0].trim() || cabeceras.get("x-real-ip") || "desconocida";
  const secreto = process.env.TURNSTILE_SECRET_KEY ?? "";
  const sal = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const entrada = Object.fromEntries(
    ["tipo", "registro_afectado", "descripcion", "fuente", "correo"].map((k) => [k, String(datos.get(k) ?? "")]),
  );
  try {
    return await registrarAporte(
      { ...entrada, turnstile: String(datos.get("cf-turnstile-response") ?? "") },
      { ip, sal },
      dependenciasSupabase(clienteServicio(), (token, origen) => verificarTurnstile(token, origen, secreto)),
    );
  } catch (error) {
    console.error("Error al registrar un aporte:", error);
    return { ok: false, errores: ["No se pudo guardar el aporte. Inténtalo de nuevo en unos minutos."] };
  }
}
