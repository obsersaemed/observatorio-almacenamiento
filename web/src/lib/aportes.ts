// Registro de aportes del público (RF-03 a RF-06). La lógica no conoce Supabase ni
// Cloudflare: recibe sus dependencias, así se prueba sin red. Solo corre en el servidor.
import { createHash } from "node:crypto";
import { validar } from "./esquemas";

export const LIMITE_POR_HORA = 5;

export type ResultadoAporte = { ok: true; seguimiento: number } | { ok: false; errores: string[] };

export type FilaAporte = {
  tipo: string;
  registro_afectado: string | null;
  descripcion: string;
  fuente: string;
  origen: "usuario";
  publicacion: "Pendiente";
  origen_hash: string;
};

export type DependenciasAporte = {
  verificarHumano: (token: string, ip: string) => Promise<boolean>;
  contarRecientes: (origenHash: string) => Promise<number>;
  insertarAporte: (fila: FilaAporte) => Promise<number>;
  insertarAportante: (aporteId: number, correo: string) => Promise<void>;
  borrarAporte: (aporteId: number) => Promise<void>;
};

/** Huella del origen para limitar envíos sin guardar la IP (RNF-10). */
export function hashOrigen(ip: string, sal: string): string {
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex");
}

const texto = (v: unknown) => String(v ?? "").trim();

export async function registrarAporte(
  entrada: Record<string, unknown>,
  contexto: { ip: string; sal: string },
  deps: DependenciasAporte,
): Promise<ResultadoAporte> {
  // 1. Mismas reglas que la base y la importación (RF-16). Origen y estado los fija el servidor.
  const { errores } = validar("aportes", { ...entrada, origen: "usuario", publicacion: "Pendiente" });
  if (texto(entrada.tipo) === "Corrección" && !texto(entrada.registro_afectado)) {
    errores.push("Indica el registro que se corrige (nombre del proyecto, id de la norma o enlace de la noticia).");
  }
  if (errores.length) return { ok: false, errores };

  // 2. Verificación humana antes de tocar la base (CA-05.1).
  if (!(await deps.verificarHumano(texto(entrada.turnstile), contexto.ip))) {
    return { ok: false, errores: ["No se pudo completar la verificación humana. Recarga la página e inténtalo de nuevo."] };
  }

  // 3. Límite de envíos por origen (CA-05.2).
  const origenHash = hashOrigen(contexto.ip, contexto.sal);
  if ((await deps.contarRecientes(origenHash)) >= LIMITE_POR_HORA) {
    return {
      ok: false,
      errores: [`Ya enviaste ${LIMITE_POR_HORA} aportes en la última hora. Espera un momento antes de enviar otro.`],
    };
  }

  // 4. Aporte y correo en tablas separadas; si el correo falla, se deshace el aporte.
  const id = await deps.insertarAporte({
    tipo: texto(entrada.tipo),
    registro_afectado: texto(entrada.registro_afectado) || null,
    descripcion: texto(entrada.descripcion),
    fuente: texto(entrada.fuente),
    origen: "usuario",
    publicacion: "Pendiente",
    origen_hash: origenHash,
  });
  try {
    await deps.insertarAportante(id, texto(entrada.correo));
  } catch {
    await deps.borrarAporte(id);
    return { ok: false, errores: ["No se pudo guardar el aporte. Inténtalo de nuevo en unos minutos."] };
  }
  return { ok: true, seguimiento: id };
}
