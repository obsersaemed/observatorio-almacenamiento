// T10 contra Supabase "pruebas": sesión real de editor y de no editor (CA-07.1, RLS de editores).
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { esEditorSupabase } from "@/lib/acceso-supabase";
import { borrarUsuariosCreados, servicio, sesionDe } from "./sesion";

const sufijo = `${process.pid}-${Math.floor(performance.now())}`;
const editor = `editor-prueba-${sufijo}@ejemplo.co`;
const intruso = `intruso-prueba-${sufijo}@ejemplo.co`;

beforeAll(async () => {
  const { error } = await servicio.from("editores").insert({ correo: editor });
  if (error) throw new Error(`No se pudo registrar el editor de prueba: ${error.message}`);
});

afterAll(async () => {
  await servicio.from("editores").delete().eq("correo", editor);
  await borrarUsuariosCreados();
});

describe("esEditorSupabase (consulta del servidor)", () => {
  test("reconoce al editor sin importar mayúsculas y rechaza a los demás", async () => {
    const esEditor = esEditorSupabase(servicio);
    expect(await esEditor(editor.toUpperCase())).toBe(true);
    expect(await esEditor(intruso)).toBe(false);
  });

  test("los comodines % y _ escritos por el visitante no hacen pasar por editor", async () => {
    const esEditor = esEditorSupabase(servicio);
    expect(await esEditor("%@ejemplo.co")).toBe(false);
    expect(await esEditor(editor.replace("editor", "edito_"))).toBe(false);
  });
});

describe("RLS con sesiones reales", () => {
  test("el editor lee la cola de aportes y la lista de editores", async () => {
    const cliente = await sesionDe(editor);
    const { data: esEditor } = await cliente.rpc("es_editor");
    expect(esEditor).toBe(true);
    const { error } = await cliente.from("aportes").select("id").limit(1);
    expect(error).toBeNull();
    const { data } = await cliente.from("editores").select("correo").eq("correo", editor);
    expect(data).toEqual([{ correo: editor }]);
  });

  test("un usuario con sesión que no es editor no ve la cola ni los correos (CA-07.1)", async () => {
    const cliente = await sesionDe(intruso);
    const { data: esEditor } = await cliente.rpc("es_editor");
    expect(esEditor).toBe(false);
    for (const tabla of ["aportes", "aportantes", "historial", "editores"]) {
      const { data } = await cliente.from(tabla).select("*").limit(1);
      expect(data ?? [], `leyó ${tabla}`).toEqual([]);
    }
  });
});
