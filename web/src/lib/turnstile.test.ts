// Turnstile ante una red intermitente: un reintento por error de red, y si persiste se
// rechaza (falla cerrada, CA-05.1).
import { afterEach, describe, expect, test, vi } from "vitest";
import { verificarTurnstile } from "./turnstile";

const respuesta = (success: boolean) => new Response(JSON.stringify({ success }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("verificarTurnstile", () => {
  test("si la primera consulta falla por red, reintenta una vez", async () => {
    const fetchFalso = vi.fn().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(respuesta(true));
    vi.stubGlobal("fetch", fetchFalso);
    expect(await verificarTurnstile("token", "1.2.3.4", "secreto")).toBe(true);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  test("si la red falla dos veces, rechaza", async () => {
    const fetchFalso = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchFalso);
    expect(await verificarTurnstile("token", "1.2.3.4", "secreto")).toBe(false);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  test("una respuesta negativa de Cloudflare no se reintenta", async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuesta(false));
    vi.stubGlobal("fetch", fetchFalso);
    expect(await verificarTurnstile("token", "1.2.3.4", "secreto")).toBe(false);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });
});
