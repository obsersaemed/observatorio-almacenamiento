// Verificación de Cloudflare Turnstile en el servidor (CA-05.1). La llave secreta nunca
// sale del servidor; en pruebas se usan las llaves de prueba oficiales de Cloudflare.
// Ante un error de red se reintenta una vez; si persiste, se rechaza (falla cerrada).
const URL_VERIFICACION = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const INTENTOS = 2;

async function consultar(token: string, ip: string, secreto: string): Promise<boolean> {
  const respuesta = await fetch(URL_VERIFICACION, {
    method: "POST",
    body: new URLSearchParams({ secret: secreto, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(8_000),
  });
  const datos = (await respuesta.json()) as { success?: boolean };
  return datos.success === true;
}

export async function verificarTurnstile(token: string, ip: string, secreto: string): Promise<boolean> {
  if (!token || !secreto) return false;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      return await consultar(token, ip, secreto);
    } catch (error) {
      if (intento === INTENTOS) {
        console.error("Turnstile no respondió:", (error as Error).message);
        return false;
      }
    }
  }
  return false;
}
