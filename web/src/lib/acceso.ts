// Acceso de editores (RF-07). Solo los correos de la tabla `editores` reciben el enlace
// mágico; la respuesta es la misma para todos, así no se revela quién es editor.
export const MENSAJE_ENLACE =
  "Si ese correo está autorizado como editor, recibirás un enlace para entrar. Revisa tu bandeja (y el correo no deseado).";

const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

export type ResultadoEnlace = { ok: true; mensaje: string } | { ok: false; error: string };

export async function pedirEnlace(
  correo: string,
  redirigirA: string,
  deps: {
    esEditor: (correo: string) => Promise<boolean>;
    enviarEnlace: (correo: string, redirigirA: string) => Promise<void>;
  },
): Promise<ResultadoEnlace> {
  const limpio = normalizarCorreo(correo);
  if (!CORREO.test(limpio)) return { ok: false, error: "Escribe un correo válido." };
  try {
    if (await deps.esEditor(limpio)) await deps.enviarEnlace(limpio, redirigirA);
  } catch {
    return { ok: false, error: "No se pudo enviar el enlace. Inténtalo de nuevo en unos minutos." };
  }
  return { ok: true, mensaje: MENSAJE_ENLACE };
}

export type DecisionAcceso = "entrar" | "no-autorizado" | "permitido";

export function decidirAcceso({ correo, esEditor }: { correo: string | null; esEditor: boolean }): DecisionAcceso {
  if (!correo) return "entrar";
  return esEditor ? "permitido" : "no-autorizado";
}

const RUTAS_LIBRES = ["/admin/entrar", "/admin/confirmar"];

/** Adónde redirige el proxy una ruta de /admin según la decisión; null = dejar pasar. */
export function destinoProxy(ruta: string, decision: DecisionAcceso): string | null {
  if (RUTAS_LIBRES.some((r) => ruta === r || ruta.startsWith(`${r}/`))) return null;
  if (decision === "entrar") return "/admin/entrar";
  if (decision === "no-autorizado") return "/admin/entrar?error=no-autorizado";
  return null;
}
