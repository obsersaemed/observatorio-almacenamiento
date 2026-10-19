import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "./page";

test("el inicio muestra el título del observatorio", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Observatorio de Almacenamiento de Energía" }),
  ).toBeInTheDocument();
});
