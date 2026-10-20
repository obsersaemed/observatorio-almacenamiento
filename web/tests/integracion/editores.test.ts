// T10 contra Supabase "pruebas": sesión real de editor y de no editor (CA-07.1, RLS de editores).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { esEditorSupabase } from "@/lib/acceso-supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
const servicio = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, opciones);

const sufijo = `${process.pid}-${Math.floor(performance.now())}`;
const editor = `editor-prueba-${sufijo}@ejemplo.co`;
const intruso = `intruso-prueba-${sufijo}@ejemplo.co`;
const ids: string[] = [];

// Sesión real sin correo: el enlace se genera con la API de administración y se canjea.
async function sesionDe(correo: string): Promise<SupabaseClient> {
  const creado = await servicio.auth.admin.createUser({ email: correo, email_confirm: true });
  if (creado.error) throw creado.error;
  ids.push(creado.data.user.id);
  const enlace = await servicio.auth.admin.generateLink({ type: "magiclink", email: correo });
  if (enlace.error) throw enlace.error;
  const cliente = createClient(url, anonKey, opciones);
  const { error } = await cliente.auth.verifyOtp({ token_hash: enlace.data.properties.hashed_token, type: "magiclink" });
  if (error) throw error;
  return cliente;
}

beforeAll(async () => {
  const { error } = await servicio.from("editores").insert({ correo: editor });
  if (error) throw new Error(`No se pudo registrar el editor de prueba: ${error.message}`);
});

afterAll(async () => {
  await servicio.from("editores").delete().eq("correo", editor);
  for (const id of ids) await servicio.auth.admin.deleteUser(id);
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
