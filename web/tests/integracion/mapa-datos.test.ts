// 002 · T07 · RF-01, CA-01.2: /mapa lee solo proyectos aprobados y solo las columnas públicas.
import { afterAll, beforeAll, expect, test } from "vitest";
import { leerProyectosMapa } from "@/lib/datos-publicos";
import { columnasDeSeccion } from "@/lib/csv";
import { COLUMNAS_MAPA } from "@/lib/proyectos-mapa";
import { anonimo, servicio } from "./sesion";

const prefijo = `prueba-mapa-${process.pid}-${Math.floor(performance.now())}`;
const proyecto = (nombre: string, publicacion: string) => ({
  nombre: `${prefijo} ${nombre}`,
  estado: "En operación",
  departamento: "Cundinamarca",
  municipio: "Tocancipá",
  latitud: 4.9,
  longitud: -73.9,
  fuente: "https://ejemplo.co/fuente",
  publicacion,
});

beforeAll(async () => {
  const { error } = await servicio.from("proyectos").insert([proyecto("pendiente", "Pendiente"), proyecto("aprobado", "Aprobado")]);
  if (error) throw error;
});

afterAll(async () => {
  await servicio.from("proyectos").delete().like("nombre", `${prefijo}%`);
  await servicio.from("historial").delete().like("registro", `${prefijo}%`);
});

test("devuelve los aprobados con las columnas públicas (las del CSV) y sin columnas internas", async () => {
  const filas = await leerProyectosMapa(anonimo);
  const mias = filas.filter((f) => f.nombre.startsWith(prefijo));
  expect(mias.map((f) => f.nombre)).toEqual([`${prefijo} aprobado`]);
  const claves = Object.keys(mias[0]);
  expect(claves.sort()).toEqual([...columnasDeSeccion("proyectos").map((c) => c.sql), "publicacion"].sort());
  for (const c of COLUMNAS_MAPA) expect(claves).toContain(c);
  expect(claves).not.toContain("id");
  expect(claves).not.toContain("actualizado_en");
});

test("aunque se lea con la llave de servicio, no trae pendientes", async () => {
  const filas = await leerProyectosMapa(servicio);
  expect(filas.some((f) => f.nombre === `${prefijo} pendiente`)).toBe(false);
});
