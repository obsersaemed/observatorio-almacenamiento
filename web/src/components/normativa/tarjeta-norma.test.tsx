// 004 · T05 · RF-04, 05, 06, 15 · CA-04.1, 04.2, 05.1, 05.2, 05.3, 06.2, 15.1. Datos ficticios.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import type { Norma, Relacionada } from "@/lib/normativa";
import { COLOR_ENTIDAD, TarjetaNorma } from "./tarjeta-norma";

const NORMA: Norma = {
  id: "CREG-RES-101113-2026", fecha: "2026-06-19", precision_fecha: null, emisor: "CREG", tipo: "Resolución", numero: "101 113",
  titulo: "Por la cual se definen mecanismos ficticios", estado: "Vigente",
  resumen: "Resumen ficticio.", explicacion: "Explicación ficticia en lenguaje claro.",
  aplica_a: "Operadores de red ficticios", relacionada_con: "CREG-RES-098-2019; MME-RES-1-2020",
  enlace: "https://gestornormativo.creg.gov.co/ficticio.htm https://ejemplo.co/anexo.pdf",
};
const PUBLICADA: Norma = { ...NORMA, id: "CREG-RES-098-2019", fecha: "2019-07-11", numero: "098", relacionada_con: null };
const RELACIONADAS: Relacionada[] = [
  { id: PUBLICADA.id, norma: PUBLICADA, texto: "Resolución CREG 098 de 2019" },
  { id: "MME-RES-1-2020", norma: null, texto: "Resolución MME 1 de 2020" },
];

function Envoltura({ onIrA = vi.fn() }: { onIrA?: (id: string) => void }) {
  const [abierta, setAbierta] = useState(false);
  return <TarjetaNorma norma={NORMA} relacionadas={RELACIONADAS} abierta={abierta} onAlternar={() => setAbierta((a) => !a)} onIrA={onIrA} />;
}

describe("TarjetaNorma plegada (RF-04)", () => {
  test("muestra fecha dd/mm/aaaa, entidad, tipo y número, título, estado y resumen", () => {
    render(<Envoltura />);
    const tarjeta = screen.getByRole("article", { name: /Resolución CREG 101 113 de 2026/ });
    expect(within(tarjeta).getByText("19/06/2026")).toBeInTheDocument();
    expect(within(tarjeta).getByText("CREG")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Resolución 101 113")).toBeInTheDocument();
    expect(within(tarjeta).getByRole("heading", { name: "Por la cual se definen mecanismos ficticios" })).toBeInTheDocument();
    expect(within(tarjeta).getByText("Vigente")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Resumen ficticio.")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Explicación ficticia en lenguaje claro.")).not.toBeVisible();
  });

  test("la entidad lleva un color de token y su nombre escrito (CA-04.2)", () => {
    render(<Envoltura />);
    const marca = screen.getByTestId("color-entidad");
    expect(marca).toHaveAttribute("aria-hidden", "true");
    expect(marca.style.backgroundColor).toBe(COLOR_ENTIDAD.CREG);
    expect(COLOR_ENTIDAD.CREG).toMatch(/^var\(--/);
    expect(new Set(Object.values(COLOR_ENTIDAD)).size).toBe(Object.keys(COLOR_ENTIDAD).length);
  });
});

describe("TarjetaNorma con fecha sin día (CA-04.3)", () => {
  test("muestra el mes y el año", () => {
    render(<TarjetaNorma norma={{ ...NORMA, fecha: "2026-04-01", precision_fecha: "Mes" }} relacionadas={[]} abierta={false} onAlternar={vi.fn()} onIrA={vi.fn()} />);
    expect(screen.getByText("abril de 2026")).toBeInTheDocument();
    expect(screen.queryByText("01/04/2026")).not.toBeInTheDocument();
  });
});

describe("TarjetaNorma desplegada (RF-05, RF-06, RF-15)", () => {
  test("con el teclado se despliega y se pliega, y el control anuncia el estado (CA-05.3)", () => {
    render(<Envoltura />);
    const boton = screen.getByRole("button", { name: /Ver explicación/ });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Explicación ficticia en lenguaje claro.")).toBeVisible();
    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "false");
  });

  test("muestra explicación, a quién aplica, relacionadas y el documento oficial en pestaña nueva (CA-05.1, CA-05.2)", () => {
    render(<Envoltura />);
    fireEvent.click(screen.getByRole("button", { name: /Ver explicación/ }));
    expect(screen.getByText("Operadores de red ficticios")).toBeInTheDocument();
    const oficial = screen.getByRole("link", { name: /Ver documento oficial/ });
    expect(oficial).toHaveAttribute("href", "https://gestornormativo.creg.gov.co/ficticio.htm");
    expect(oficial).toHaveAttribute("target", "_blank");
    expect(oficial.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: /Enlace 2/ })).toHaveAttribute("href", "https://ejemplo.co/anexo.pdf");
  });

  test("la relacionada publicada es un enlace que lleva a ella; la no publicada es solo texto (CA-06.2)", () => {
    const onIrA = vi.fn();
    render(<Envoltura onIrA={onIrA} />);
    fireEvent.click(screen.getByRole("button", { name: /Ver explicación/ }));
    const enlace = screen.getByRole("link", { name: "Resolución CREG 098 de 2019" });
    expect(enlace).toHaveAttribute("href", "#norma-CREG-RES-098-2019");
    fireEvent.click(enlace);
    expect(onIrA).toHaveBeenCalledWith("CREG-RES-098-2019");
    expect(screen.getByText("Resolución MME 1 de 2020")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Resolución MME 1 de 2020" })).not.toBeInTheDocument();
  });

  test("«Proponer corrección» abre /aportar con el tipo Corrección y el id (CA-15.1)", () => {
    render(<Envoltura />);
    fireEvent.click(screen.getByRole("button", { name: /Ver explicación/ }));
    expect(screen.getByRole("link", { name: "Proponer corrección" })).toHaveAttribute(
      "href",
      `/aportar?tipo=${encodeURIComponent("Corrección")}&registro=${encodeURIComponent(NORMA.id)}`,
    );
  });

  test("sin explicación ni relacionadas no deja títulos vacíos", () => {
    render(
      <TarjetaNorma norma={{ ...NORMA, explicacion: null, aplica_a: null, relacionada_con: null }} relacionadas={[]} abierta onAlternar={vi.fn()} onIrA={vi.fn()} />,
    );
    expect(screen.queryByText("Aplica a")).not.toBeInTheDocument();
    expect(screen.queryByText("Normas relacionadas")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver documento oficial/ })).toBeInTheDocument();
  });
});
