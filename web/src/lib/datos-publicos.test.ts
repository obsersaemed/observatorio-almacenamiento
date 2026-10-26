// 004 · T04 · RF-13, RF-16: la página de normativa lee solo lo aprobado y se revalida con la
// misma etiqueta que /admin invalida al aprobar una norma.
import { describe, expect, test, vi } from "vitest";
import { ETIQUETA_NORMAS, ETIQUETA_NOTICIAS, leerNormas, leerNoticias } from "./datos-publicos";
import { tablaDestino } from "./aportes-admin";

function clienteSimulado(filas: unknown[]) {
  const consulta = {
    select: vi.fn(() => consulta),
    eq: vi.fn(() => consulta),
    order: vi.fn(() => Promise.resolve({ data: filas, error: null })),
  };
  return { cliente: { from: vi.fn(() => consulta) }, consulta };
}

describe("leerNormas", () => {
  test("pide a la tabla normas solo las aprobadas, con las columnas públicas", async () => {
    const { cliente, consulta } = clienteSimulado([{ id: "CREG-RES-098-2019" }]);
    const normas = await leerNormas(cliente as never);
    expect(cliente.from).toHaveBeenCalledWith("normas");
    expect(consulta.eq).toHaveBeenCalledWith("publicacion", "Aprobado");
    const columnas = (consulta.select.mock.calls[0] as unknown as [string])[0];
    for (const c of ["id", "fecha", "emisor", "tipo", "numero", "titulo", "estado", "resumen", "explicacion", "aplica_a", "relacionada_con", "enlace"]) {
      expect(columnas).toContain(c);
    }
    expect(columnas).not.toContain("publicacion");
    expect(normas).toEqual([{ id: "CREG-RES-098-2019" }]);
  });

  test("un error de la base se informa", async () => {
    const consulta = { select: () => consulta, eq: () => consulta, order: () => Promise.resolve({ data: null, error: { message: "caída" } }) };
    await expect(leerNormas({ from: () => consulta } as never)).rejects.toThrow("caída");
  });

  test("la etiqueta de caché es la que /admin revalida al aprobar una norma", () => {
    expect(ETIQUETA_NORMAS).toBe(tablaDestino({ tipo: "Norma", datos: {} }));
  });
});

describe("leerNoticias (005 · T02 · RF-05, RF-08)", () => {
  test("pide a la tabla noticias solo las aprobadas, con las columnas que muestra la lista", async () => {
    const { cliente, consulta } = clienteSimulado([{ titulo: "N" }]);
    expect(await leerNoticias(cliente as never)).toEqual([{ titulo: "N" }]);
    expect(cliente.from).toHaveBeenCalledWith("noticias");
    expect(consulta.eq).toHaveBeenCalledWith("publicacion", "Aprobado");
    const columnas = (consulta.select.mock.calls[0] as unknown as [string])[0];
    for (const c of ["fecha", "titulo", "medio", "enlace", "resumen"]) expect(columnas).toContain(c);
    expect(columnas).not.toContain("publicacion");
  });

  test("un error de la base se informa", async () => {
    const consulta = { select: () => consulta, eq: () => consulta, order: () => Promise.resolve({ data: null, error: { message: "caída" } }) };
    await expect(leerNoticias({ from: () => consulta } as never)).rejects.toThrow("caída");
  });

  test("la etiqueta de caché es la que /admin revalida al aprobar una noticia", () => {
    expect(ETIQUETA_NOTICIAS).toBe(tablaDestino({ tipo: "Noticia", datos: {} }));
  });
});
