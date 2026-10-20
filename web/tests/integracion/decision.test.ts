// T12 contra Supabase "pruebas": funciones aplicar_aporte y rechazar_aporte (migración 0002).
// CA-09.1, CA-09.2, CA-10.1 (dato publicado), CA-11.1 (historial con editor y aporte).
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { anonimo, borrarUsuariosCreados, servicio, sesionDe } from "./sesion";

const sufijo = `${process.pid}-${Math.floor(performance.now())}`;
const prefijo = `prueba-decision-${sufijo}`;
const correoEditor = `editor-decision-${sufijo}@ejemplo.co`;
const nombreProyecto = `${prefijo} Termozipa`;
let editor: SupabaseClient;
let intruso: SupabaseClient;

async function nuevoAporte(campos: Record<string, unknown>) {
  const { data, error } = await servicio
    .from("aportes")
    .insert({ descripcion: `${prefijo} aporte`, fuente: "https://ejemplo.co/f", origen: "usuario", ...campos })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

beforeAll(async () => {
  const r1 = await servicio.from("editores").insert({ correo: correoEditor });
  if (r1.error) throw r1.error;
  const r2 = await servicio.from("proyectos").insert({
    nombre: nombreProyecto,
    estado: "En operación",
    departamento: "Cundinamarca",
    municipio: "Tocancipá",
    potencia_nominal_mw: 7,
    fuente: "https://ejemplo.co/original",
    publicacion: "Aprobado",
  });
  if (r2.error) throw r2.error;
  editor = await sesionDe(correoEditor);
  intruso = await sesionDe(`intruso-decision-${sufijo}@ejemplo.co`);
});

afterAll(async () => {
  await servicio.from("proyectos").delete().like("nombre", `${prefijo}%`);
  await servicio.from("aportes").delete().like("descripcion", `${prefijo}%`);
  await servicio.from("historial").delete().like("registro", `${prefijo}%`);
  await servicio.from("editores").delete().eq("correo", correoEditor);
  await borrarUsuariosCreados();
});

describe("aplicar_aporte", () => {
  test("una corrección ajustada publica la versión final y conserva la propuesta (CA-09.2, CA-11.1)", async () => {
    const id = await nuevoAporte({ tipo: "Corrección", registro_afectado: nombreProyecto, datos: { potencia_nominal_mw: 12 } });
    const { error } = await editor.rpc("aplicar_aporte", { p_aporte_id: id, p_datos: { potencia_nominal_mw: 11.5 } });
    expect(error).toBeNull();

    const { data: proyecto } = await anonimo.from("proyectos").select("potencia_nominal_mw").eq("nombre", nombreProyecto).single();
    expect(Number(proyecto?.potencia_nominal_mw)).toBe(11.5);

    const { data: a } = await servicio.from("aportes").select("*").eq("id", id).single();
    expect(a).toMatchObject({ publicacion: "Aprobado", revisado_por: correoEditor });
    expect(a.datos).toEqual({ potencia_nominal_mw: 12 });
    expect(a.datos_aprobados).toEqual({ potencia_nominal_mw: 11.5 });

    const { data: h } = await servicio
      .from("historial")
      .select("operacion, editor, aporte_id, antes, despues, fuente")
      .eq("registro", nombreProyecto)
      .eq("aporte_id", id)
      .single();
    expect(h).toMatchObject({ operacion: "UPDATE", editor: correoEditor, aporte_id: id, fuente: "https://ejemplo.co/original" });
    expect(Number(h?.antes.potencia_nominal_mw)).toBe(7);
    expect(Number(h?.despues.potencia_nominal_mw)).toBe(11.5);
  });

  test("un proyecto nuevo queda publicado", async () => {
    const nombre = `${prefijo} Nuevo`;
    const id = await nuevoAporte({ tipo: "Proyecto nuevo" });
    const { error } = await editor.rpc("aplicar_aporte", {
      p_aporte_id: id,
      p_datos: { nombre, estado: "Anunciado", departamento: "Meta", municipio: "Puerto Gaitán", fuente: "https://ejemplo.co/n" },
    });
    expect(error).toBeNull();
    const { data } = await anonimo.from("proyectos").select("nombre, publicacion").eq("nombre", nombre).single();
    expect(data).toEqual({ nombre, publicacion: "Aprobado" });
  });

  test("no se puede aplicar dos veces el mismo aporte", async () => {
    const id = await nuevoAporte({ tipo: "Corrección", registro_afectado: nombreProyecto, datos: {} });
    expect((await editor.rpc("aplicar_aporte", { p_aporte_id: id, p_datos: { municipio: "Cogua" } })).error).toBeNull();
    expect((await editor.rpc("aplicar_aporte", { p_aporte_id: id, p_datos: { municipio: "Zipaquirá" } })).error).not.toBeNull();
  });

  test("un valor fuera de las reglas se rechaza en la base y no cambia nada (CA-16.1)", async () => {
    const id = await nuevoAporte({ tipo: "Corrección", registro_afectado: nombreProyecto, datos: {} });
    const { error } = await editor.rpc("aplicar_aporte", { p_aporte_id: id, p_datos: { estado: "Planeado" } });
    expect(error).not.toBeNull();
    const { data } = await servicio.from("aportes").select("publicacion").eq("id", id).single();
    expect(data?.publicacion).toBe("Pendiente");
  });

  test("ni un usuario sin rol de editor ni un anónimo pueden aplicar", async () => {
    const id = await nuevoAporte({ tipo: "Corrección", registro_afectado: nombreProyecto, datos: {} });
    expect((await intruso.rpc("aplicar_aporte", { p_aporte_id: id, p_datos: { municipio: "X" } })).error).not.toBeNull();
    expect((await anonimo.rpc("aplicar_aporte", { p_aporte_id: id, p_datos: { municipio: "X" } })).error).not.toBeNull();
  });
});

describe("rechazar_aporte (CA-09.1)", () => {
  test("exige motivo y luego rechaza", async () => {
    const id = await nuevoAporte({ tipo: "Noticia" });
    expect((await editor.rpc("rechazar_aporte", { p_aporte_id: id, p_motivo: " " })).error).not.toBeNull();
    expect((await editor.rpc("rechazar_aporte", { p_aporte_id: id, p_motivo: "Duplicada" })).error).toBeNull();
    const { data } = await servicio.from("aportes").select("publicacion, motivo, revisado_por").eq("id", id).single();
    expect(data).toEqual({ publicacion: "Rechazado", motivo: "Duplicada", revisado_por: correoEditor });
  });
});

test("los correos de editores se guardan en minúsculas", async () => {
  const { error } = await servicio.from("editores").insert({ correo: `Mayus-${sufijo}@Ejemplo.co` });
  expect(error?.code).toBe("23514");
});
