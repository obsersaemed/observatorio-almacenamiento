// 005 · T03 · RF-02, RF-03, RF-04, RF-09 · CA-02.1, CA-03.1, CA-03.2, CA-04.1, CA-09.1. Datos ficticios.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { Noticia } from "@/lib/noticias";
import { ListaNoticias } from "./lista-noticias";

const NOTICIAS: Noticia[] = [
  { fecha: "2025-03-10", titulo: "Noticia ficticia antigua", medio: "Medio A", enlace: "https://ejemplo.co/a", resumen: "Resumen ficticio A." },
  { fecha: "2026-06-19", titulo: "Noticia ficticia reciente", medio: "Medio B", enlace: "https://ejemplo.co/b https://ejemplo.co/b2", resumen: "Resumen ficticio B." },
];
const TEXTO = "Si quieres saber más sobre esta noticia, haz clic en el enlace";

describe("ListaNoticias", () => {
  test("ordena de la más reciente a la más antigua", () => {
    render(<ListaNoticias noticias={NOTICIAS} />);
    expect(screen.getAllByRole("article").map((a) => within(a).getByRole("heading").textContent)).toEqual([
      "Noticia ficticia reciente",
      "Noticia ficticia antigua",
    ]);
  });

  test("cada tarjeta muestra fecha dd/mm/aaaa, medio, título y resumen (CA-02.1)", () => {
    render(<ListaNoticias noticias={NOTICIAS} />);
    const tarjeta = screen.getByRole("article", { name: "Noticia ficticia reciente" });
    expect(within(tarjeta).getByText("19/06/2026")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Medio B")).toBeInTheDocument();
    expect(within(tarjeta).getByRole("heading", { name: "Noticia ficticia reciente" })).toBeInTheDocument();
    expect(within(tarjeta).getByText("Resumen ficticio B.")).toBeInTheDocument();
  });

  test("termina con el texto y el enlace a la nota original en pestaña nueva (CA-03.1)", () => {
    render(<ListaNoticias noticias={NOTICIAS} />);
    const tarjeta = screen.getByRole("article", { name: "Noticia ficticia reciente" });
    expect(tarjeta).toHaveTextContent(TEXTO);
    const enlace = within(tarjeta).getByRole("link");
    expect(enlace).toHaveAttribute("href", "https://ejemplo.co/b");
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace.getAttribute("rel")).toContain("noopener");
  });

  test("el nombre de cada enlace incluye el título de su noticia (CA-03.2)", () => {
    render(<ListaNoticias noticias={NOTICIAS} />);
    const nombres = screen.getAllByRole("link").map((l) => l.textContent ?? "");
    expect(nombres).toHaveLength(2);
    expect(nombres[0]).toContain("Noticia ficticia reciente");
    expect(nombres[1]).toContain("Noticia ficticia antigua");
    expect(new Set(nombres).size).toBe(2);
  });

  test("sin noticias avisa que todavía no hay publicadas (CA-04.1)", () => {
    render(<ListaNoticias noticias={[]} />);
    expect(screen.getByText("Todavía no hay noticias publicadas")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  test("no ofrece descargas (CA-09.1)", () => {
    render(<ListaNoticias noticias={NOTICIAS} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/descargar/i)).not.toBeInTheDocument();
  });
});
