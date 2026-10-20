// T09 · RF-03, RF-04, RF-05, RF-06, RNF-10 (CA-03.1, CA-03.2, CA-04.1, CA-05.1, CA-05.2, CA-06.1)
import { describe, expect, test, vi } from "vitest";
import { LIMITE_POR_HORA, hashOrigen, registrarAporte, type DependenciasAporte } from "./aportes";
import { mensaje } from "./esquemas";

const valido = {
  tipo: "Noticia",
  registro_afectado: "",
  descripcion: "Nueva convocatoria de almacenamiento",
  fuente: "https://ejemplo.co/noticia",
  correo: "persona@ejemplo.co",
  turnstile: "token-valido",
};

function falsas(cambios: Partial<DependenciasAporte> = {}) {
  const deps: DependenciasAporte = {
    verificarHumano: vi.fn(async () => true),
    contarRecientes: vi.fn(async () => 0),
    insertarAporte: vi.fn(async () => 42),
    insertarAportante: vi.fn(async () => {}),
    borrarAporte: vi.fn(async () => {}),
    ...cambios,
  };
  return deps;
}

const enviar = (datos: Record<string, string>, deps = falsas()) =>
  registrarAporte(datos, { ip: "190.1.2.3", sal: "sal-de-prueba" }, deps).then((r) => ({ r, deps }));

describe("registrarAporte", () => {
  test("sin fuente se rechaza y no se guarda nada (CA-03.1)", async () => {
    const { r, deps } = await enviar({ ...valido, fuente: "" });
    expect(r).toEqual({ ok: false, errores: [mensaje("obligatorio", { columna: "fuente" })] });
    expect(deps.insertarAporte).not.toHaveBeenCalled();
  });

  test("sin correo se rechaza (CA-03.2)", async () => {
    const { r } = await enviar({ ...valido, correo: "" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores).toContain(mensaje("obligatorio", { columna: "correo" }));
  });

  test("una corrección sin el registro afectado se rechaza", async () => {
    const { r } = await enviar({ ...valido, tipo: "Corrección" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores.join(" ")).toMatch(/registro/i);
  });

  test("sin verificación humana válida se rechaza sin contar ni guardar (CA-05.1)", async () => {
    const { r, deps } = await enviar(valido, falsas({ verificarHumano: vi.fn(async () => false) }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores.join(" ")).toMatch(/verificación/i);
    expect(deps.contarRecientes).not.toHaveBeenCalled();
    expect(deps.insertarAporte).not.toHaveBeenCalled();
  });

  test(`el envío número ${LIMITE_POR_HORA + 1} en una hora del mismo origen se rechaza (CA-05.2)`, async () => {
    const { r, deps } = await enviar(valido, falsas({ contarRecientes: vi.fn(async () => LIMITE_POR_HORA) }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores.join(" ")).toMatch(/espera/i);
    expect(deps.insertarAporte).not.toHaveBeenCalled();
  });

  test("un envío válido queda Pendiente, de usuario, y devuelve el número de seguimiento (CA-04.1, CA-06.1)", async () => {
    const { r, deps } = await enviar(valido);
    expect(r).toEqual({ ok: true, seguimiento: 42 });
    const fila = vi.mocked(deps.insertarAporte).mock.calls[0][0];
    expect(fila).toMatchObject({
      tipo: "Noticia",
      descripcion: valido.descripcion,
      fuente: valido.fuente,
      origen: "usuario",
      publicacion: "Pendiente",
      origen_hash: hashOrigen("190.1.2.3", "sal-de-prueba"),
    });
    expect(fila).not.toHaveProperty("correo");
    expect(fila.registro_afectado).toBeNull();
  });

  test("el correo se guarda solo en aportantes (RNF-10)", async () => {
    const { deps } = await enviar(valido);
    expect(deps.insertarAportante).toHaveBeenCalledWith(42, "persona@ejemplo.co");
  });

  test("si no se puede guardar el correo, el aporte se deshace y se informa el error", async () => {
    const { r, deps } = await enviar(
      valido,
      falsas({ insertarAportante: vi.fn(async () => Promise.reject(new Error("falla"))) }),
    );
    expect(r.ok).toBe(false);
    expect(deps.borrarAporte).toHaveBeenCalledWith(42);
  });

  test("el origen se guarda como hash, nunca la IP", () => {
    const h = hashOrigen("190.1.2.3", "sal");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("190.1.2.3");
    expect(hashOrigen("190.1.2.3", "sal")).toBe(h);
    expect(hashOrigen("190.1.2.4", "sal")).not.toBe(h);
  });
});
