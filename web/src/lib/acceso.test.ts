// T10 · RF-07 · CA-07.1: solo los editores reciben enlace y entran a /admin.
import { describe, expect, test, vi } from "vitest";
import { MENSAJE_ENLACE, decidirAcceso, destinoProxy, normalizarCorreo, pedirEnlace } from "./acceso";

const deps = (esEditor: boolean) => ({
  esEditor: vi.fn(async () => esEditor),
  enviarEnlace: vi.fn(async () => {}),
});

describe("pedirEnlace", () => {
  test("a un editor le envía el enlace con el correo normalizado y la ruta de regreso", async () => {
    const d = deps(true);
    const r = await pedirEnlace("  ObserSAE_med@UNAL.edu.co ", "http://localhost:3000/admin/confirmar", d);
    expect(r).toEqual({ ok: true, mensaje: MENSAJE_ENLACE });
    expect(d.esEditor).toHaveBeenCalledWith("obsersae_med@unal.edu.co");
    expect(d.enviarEnlace).toHaveBeenCalledWith("obsersae_med@unal.edu.co", "http://localhost:3000/admin/confirmar");
  });

  test("a un correo que no es editor no le envía nada, pero responde igual (CA-07.1)", async () => {
    const d = deps(false);
    const r = await pedirEnlace("otra@ejemplo.co", "http://x/admin/confirmar", d);
    expect(r).toEqual({ ok: true, mensaje: MENSAJE_ENLACE });
    expect(d.enviarEnlace).not.toHaveBeenCalled();
  });

  test("un correo mal escrito se rechaza sin consultar", async () => {
    const d = deps(true);
    const r = await pedirEnlace("no-es-correo", "http://x", d);
    expect(r.ok).toBe(false);
    expect(d.esEditor).not.toHaveBeenCalled();
  });

  test("si el envío falla se informa sin revelar si el correo es editor", async () => {
    const d = { esEditor: vi.fn(async () => true), enviarEnlace: vi.fn(async () => Promise.reject(new Error("límite"))) };
    const r = await pedirEnlace("obsersae_med@unal.edu.co", "http://x", d);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/inténtalo/i);
  });
});

describe("decidirAcceso a /admin", () => {
  test("sin sesión va a la página de entrada", () => {
    expect(decidirAcceso({ correo: null, esEditor: false })).toBe("entrar");
  });
  test("con sesión pero sin ser editor no entra", () => {
    expect(decidirAcceso({ correo: "otra@ejemplo.co", esEditor: false })).toBe("no-autorizado");
  });
  test("un editor entra", () => {
    expect(decidirAcceso({ correo: "obsersae_med@unal.edu.co", esEditor: true })).toBe("permitido");
  });
});

describe("destinoProxy (qué hace el proxy con cada ruta de /admin)", () => {
  test("las rutas de entrada y confirmación siempre pasan", () => {
    expect(destinoProxy("/admin/entrar", "entrar")).toBeNull();
    expect(destinoProxy("/admin/confirmar", "no-autorizado")).toBeNull();
  });
  test("sin sesión redirige a la entrada", () => {
    expect(destinoProxy("/admin", "entrar")).toBe("/admin/entrar");
    expect(destinoProxy("/admin/42", "entrar")).toBe("/admin/entrar");
  });
  test("con sesión de no editor redirige con el aviso", () => {
    expect(destinoProxy("/admin", "no-autorizado")).toBe("/admin/entrar?error=no-autorizado");
  });
  test("un editor sigue", () => {
    expect(destinoProxy("/admin/42", "permitido")).toBeNull();
  });
});

test("normalizarCorreo quita espacios y pasa a minúsculas", () => {
  expect(normalizarCorreo(" A@B.Co ")).toBe("a@b.co");
});
