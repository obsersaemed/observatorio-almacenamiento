// 003 · T09 · RF-01, RF-12, CA-11.1: lectura pública de vehículos (requiere la 0005 y la importación).
import { expect, test } from "vitest";
import { leerVehiculos } from "@/lib/datos-publicos";
import { anonimo } from "./sesion";

test("trae líneas, ventas y la última importación con sus dos fechas", async () => {
  const { lineas, ventas, importacion } = await leerVehiculos(anonimo);
  expect(lineas.length).toBeGreaterThan(0);
  expect(Object.keys(lineas[0]).sort()).toEqual(
    ["capacidad_maxima_kwh", "capacidad_minima_kwh", "linea", "marca", "potencia_kw", "tipo_de_bateria"],
  );
  expect(ventas.length).toBeGreaterThan(0);
  expect(Object.keys(ventas[0]).sort()).toEqual(["ano", "linea", "unidades"]);
  expect(importacion).toMatchObject({ corte: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
  expect(new Date(importacion!.actualizado_en).getTime()).not.toBeNaN();
});
