// fetch con un reintento solo cuando la conexión no llegó a establecerse: la petición nunca
// salió, así que reintentar no puede duplicar una escritura. Se usa en los clientes de
// Supabase del servidor (redes con conexiones que a veces expiran al conectar).
const SIN_CONEXION = new Set(["UND_ERR_CONNECT_TIMEOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);

const codigo = (error: unknown) => (error as { cause?: { code?: string } })?.cause?.code;

export function crearFetchConReintento(base: typeof fetch = fetch): typeof fetch {
  return async (entrada, opciones) => {
    try {
      return await base(entrada, opciones);
    } catch (error) {
      if (!SIN_CONEXION.has(codigo(error) ?? "")) throw error;
      return base(entrada, opciones);
    }
  };
}

export const fetchConReintento = crearFetchConReintento();
