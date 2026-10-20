// Reintento solo cuando la conexión no llegó a establecerse (la petición nunca salió),
// para no duplicar escrituras. Red de este equipo: ~10 % de conexiones expiran al conectar.
import { describe, expect, test, vi } from "vitest";
import { crearFetchConReintento } from "./fetch-con-reintento";

const errorDeConexion = (codigo: string) => Object.assign(new TypeError("fetch failed"), { cause: { code: codigo } });

describe("crearFetchConReintento", () => {
  test("reintenta una vez si la conexión expiró antes de establecerse", async () => {
    const base = vi.fn().mockRejectedValueOnce(errorDeConexion("UND_ERR_CONNECT_TIMEOUT")).mockResolvedValueOnce(new Response("ok"));
    const r = await crearFetchConReintento(base)("https://x", { method: "POST", body: "{}" });
    expect(await r.text()).toBe("ok");
    expect(base).toHaveBeenCalledTimes(2);
  });

  test("también con conexión rechazada o nombre no resuelto", async () => {
    for (const codigo of ["ECONNREFUSED", "ENOTFOUND"]) {
      const base = vi.fn().mockRejectedValueOnce(errorDeConexion(codigo)).mockResolvedValueOnce(new Response("ok"));
      await crearFetchConReintento(base)("https://x");
      expect(base).toHaveBeenCalledTimes(2);
    }
  });

  test("no reintenta errores que pudieron ocurrir con la petición ya enviada", async () => {
    const base = vi.fn().mockRejectedValue(errorDeConexion("ECONNRESET"));
    await expect(crearFetchConReintento(base)("https://x", { method: "POST" })).rejects.toThrow("fetch failed");
    expect(base).toHaveBeenCalledTimes(1);
  });

  test("si vuelve a fallar al conectar, propaga el error", async () => {
    const base = vi.fn().mockRejectedValue(errorDeConexion("UND_ERR_CONNECT_TIMEOUT"));
    await expect(crearFetchConReintento(base)("https://x")).rejects.toThrow("fetch failed");
    expect(base).toHaveBeenCalledTimes(2);
  });

  test("las respuestas HTTP (aunque sean error) no se reintentan", async () => {
    const base = vi.fn().mockResolvedValue(new Response("x", { status: 500 }));
    expect((await crearFetchConReintento(base)("https://x")).status).toBe(500);
    expect(base).toHaveBeenCalledTimes(1);
  });
});
