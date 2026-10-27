// /aportar: correo del observatorio a primera vista y formulario de registro descargable
// (pedido del usuario, 2026-10-27).
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ContactoAportar } from "./contacto-aportar";

const CORREO = "obsersae_med@unal.edu.co";

describe("ContactoAportar", () => {
  test("dice que cualquier comunicación o contacto se hace por el correo, con enlace mailto", () => {
    render(<ContactoAportar />);
    expect(screen.getByText(/Cualquier comunicación o contacto/)).toBeInTheDocument();
    const correo = screen.getAllByRole("link", { name: CORREO })[0];
    expect(correo).toHaveAttribute("href", `mailto:${CORREO}`);
  });

  test("ofrece descargar el formulario de registro de proyectos y enviarlo al correo", () => {
    render(<ContactoAportar />);
    const descarga = screen.getByRole("link", { name: /Descargar formulario de registro de proyectos/ });
    expect(descarga).toHaveAttribute("href", "/formularios/Formulario_Recoleccion_SAEB_Colombia.xlsx");
    expect(descarga).toHaveAttribute("download");
    const envio = screen.getByRole("link", { name: /Enviar el formulario diligenciado/ });
    expect(envio.getAttribute("href")).toMatch(new RegExp(`^mailto:${CORREO}\\?subject=`));
  });
});
