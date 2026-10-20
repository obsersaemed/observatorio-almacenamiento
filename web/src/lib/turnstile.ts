// Verificación de Cloudflare Turnstile en el servidor (CA-05.1). La llave secreta nunca
// sale del servidor; en pruebas se usan las llaves de prueba oficiales de Cloudflare.
const URL_VERIFICACION = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verificarTurnstile(token: string, ip: string, secreto: string): Promise<boolean> {
  if (!token || !secreto) return false;
  try {
    const respuesta = await fetch(URL_VERIFICACION, {
      method: "POST",
      body: new URLSearchParams({ secret: secreto, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(10_000),
    });
    const datos = (await respuesta.json()) as { success?: boolean };
    return datos.success === true;
  } catch {
    return false;
  }
}
