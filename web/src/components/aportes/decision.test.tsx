// T12 · CA-09.1, CA-09.2: formularios de decisión del editor.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Decision } from "./decision";

const campos = [
  { sql: "nombre", etiqueta: "Nombre", obligatorio: true, valor: "BESS Termozipa" },
  { sql: "potencia_nominal_mw", etiqueta: "Potencia nominal [MW]", obligatorio: false, valor: "12" },
];

describe("Decision", () => {
  test("muestra los campos llenos con lo propuesto para ajustarlos (CA-09.2)", () => {
    render(<Decision campos={campos} aprobar={vi.fn()} rechazar={vi.fn()} />);
    const aprobar = screen.getByRole("form", { name: "Aprobar aporte" });
    expect(within(aprobar).getByLabelText(/potencia nominal/i)).toHaveValue("12");
    expect(within(aprobar).getByLabelText(/potencia nominal/i)).toHaveAttribute("name", "campo:potencia_nominal_mw");
  });

  test("el rechazo pide el motivo y muestra el error del servidor (CA-09.1)", async () => {
    const rechazar = vi.fn(async () => ({ ok: false as const, errores: ["El motivo es obligatorio para rechazar un aporte."] }));
    render(<Decision campos={campos} aprobar={vi.fn()} rechazar={rechazar} />);
    const formulario = screen.getByRole("form", { name: "Rechazar aporte" });
    expect(within(formulario).getByLabelText(/motivo/i)).toBeInTheDocument();
    fireEvent.submit(formulario);
    expect(await within(formulario).findByRole("alert")).toHaveTextContent(/motivo es obligatorio/i);
  });

  test("muestra los errores de validación al aprobar (CA-16.1)", async () => {
    const aprobar = vi.fn(async () => ({ ok: false as const, errores: ["'Estado' = 'Planeado' no está entre los valores permitidos"] }));
    render(<Decision campos={campos} aprobar={aprobar} rechazar={vi.fn()} />);
    fireEvent.submit(screen.getByRole("form", { name: "Aprobar aporte" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Planeado/);
  });
});

describe("Decision · campos con valores permitidos (CA-16.1)", () => {
  test("un campo con valores permitidos se elige de una lista", () => {
    render(
      <Decision
        campos={[{ sql: "estado", etiqueta: "Estado", obligatorio: true, valor: "Anunciado", valores: ["En operación", "Anunciado"] }]}
        aprobar={vi.fn()}
        rechazar={vi.fn()}
      />,
    );
    const lista = screen.getByRole("combobox", { name: /Estado/ });
    expect(lista).toHaveValue("Anunciado");
    expect(within(lista).getAllByRole("option").map((o) => o.textContent)).toEqual(["", "En operación", "Anunciado"]);
  });
});
