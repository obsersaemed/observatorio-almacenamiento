// 005 · T01 · RF-01 · CA-01.1, CA-01.2: orden y enlace principal de las noticias. Datos ficticios.
import { describe, expect, test } from "vitest";
import { enlacePrincipal, ordenarNoticias, type Noticia } from "./noticias";

const noticia = (titulo: string, fecha: string, enlace = `https://ejemplo.co/${titulo}`): Noticia => ({
  fecha, titulo, medio: "Medio ficticio", enlace, resumen: `Resumen de ${titulo}.`,
});

describe("ordenarNoticias", () => {
  test("de la más reciente a la más antigua", () => {
    const orden = ordenarNoticias([noticia("A", "2025-03-01"), noticia("B", "2026-01-15"), noticia("C", "2025-11-30")]);
    expect(orden.map((n) => n.titulo)).toEqual(["B", "C", "A"]);
  });

  test("con la misma fecha, por título en orden alfabético (aclaración 1)", () => {
    const orden = ordenarNoticias([noticia("Zeta", "2026-02-01"), noticia("Álamo", "2026-02-01"), noticia("Beta", "2026-02-01")]);
    expect(orden.map((n) => n.titulo)).toEqual(["Álamo", "Beta", "Zeta"]);
  });

  test("no cambia la lista original", () => {
    const lista = [noticia("A", "2025-01-01"), noticia("B", "2026-01-01")];
    ordenarNoticias(lista);
    expect(lista.map((n) => n.titulo)).toEqual(["A", "B"]);
  });
});

describe("enlacePrincipal", () => {
  test("es la primera URL de la columna enlace", () => {
    expect(enlacePrincipal(noticia("A", "2025-01-01", "https://a.co/nota https://b.co/otra"))).toBe("https://a.co/nota");
  });
});
