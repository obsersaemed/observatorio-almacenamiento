import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { FormularioAporte } from "./formulario-aporte";

describe("FormularioAporte", () => {
  test("tiene los campos obligatorios con etiqueta", () => {
    render(<FormularioAporte accion={vi.fn()} siteKey="clave" />);
    for (const etiqueta of [/tipo de aporte/i, /descripción/i, /enlace de la fuente/i, /correo/i]) {
      expect(screen.getByLabelText(etiqueta)).toBeRequired();
    }
    expect(screen.getByRole("button", { name: /enviar aporte/i })).toBeInTheDocument();
  });

  test("llega prellenado desde «Proponer corrección» del mapa (002 · CA-06.1)", () => {
    render(<FormularioAporte accion={vi.fn()} siteKey="clave" inicial={{ tipo: "Corrección", registro: "La Martina" }} />);
    expect(screen.getByLabelText(/tipo de aporte/i)).toHaveValue("Corrección");
    expect(screen.getByDisplayValue("La Martina")).toHaveAttribute("name", "registro_afectado");
  });

  test("ignora un tipo inicial que no existe", () => {
    render(<FormularioAporte accion={vi.fn()} siteKey="clave" inicial={{ tipo: "Otra cosa", registro: "X" }} />);
    expect(screen.getByLabelText(/tipo de aporte/i)).toHaveValue("Proyecto nuevo");
  });

  test("explica que el correo es privado", () => {
    render(<FormularioAporte accion={vi.fn()} siteKey="clave" />);
    expect(screen.getByText(/no se publica/i)).toBeInTheDocument();
  });

  test("incluye el widget de verificación humana con la clave del sitio", () => {
    const { container } = render(<FormularioAporte accion={vi.fn()} siteKey="clave-publica" />);
    expect(container.querySelector(".cf-turnstile")).toHaveAttribute("data-sitekey", "clave-publica");
  });

  test("pide el registro afectado solo para correcciones", () => {
    render(<FormularioAporte accion={vi.fn()} siteKey="clave" />);
    expect(screen.queryByLabelText(/registro que se corrige/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tipo de aporte/i), { target: { value: "Corrección" } });
    expect(screen.getByLabelText(/registro que se corrige/i)).toBeRequired();
  });

  test("tras un envío válido muestra el número de seguimiento (CA-06.1)", async () => {
    const accion = vi.fn(async () => ({ ok: true as const, seguimiento: 42 }));
    render(<FormularioAporte accion={accion} siteKey="clave" />);
    fireEvent.submit(screen.getByRole("button", { name: /enviar aporte/i }).closest("form")!);
    expect(await screen.findByText(/número de seguimiento/i)).toHaveTextContent("42");
  });

  test("muestra los errores que devuelve el servidor", async () => {
    const accion = vi.fn(async () => ({ ok: false as const, errores: ["'fuente' es obligatorio"] }));
    render(<FormularioAporte accion={accion} siteKey="clave" />);
    fireEvent.submit(screen.getByRole("button", { name: /enviar aporte/i }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("'fuente' es obligatorio");
  });
});
