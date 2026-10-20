// T09 contra servicios reales: Supabase "pruebas" y Turnstile con sus llaves de prueba
// oficiales (siempre aprueba / siempre falla). CA-04.1, CA-05.1, CA-05.2, CA-06.1, RNF-10.
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, test } from "vitest";
import { dependenciasSupabase } from "@/lib/aportes-supabase";
import { LIMITE_POR_HORA, hashOrigen, registrarAporte } from "@/lib/aportes";
import { verificarTurnstile } from "@/lib/turnstile";
import { fetchConReintento } from "@/lib/fetch-con-reintento";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const servicio = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, global: { fetch: fetchConReintento } });
const anonimo = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false }, global: { fetch: fetchConReintento } });

const SIEMPRE_APRUEBA = "1x0000000000000000000000000000000AA";
const SIEMPRE_FALLA = "2x0000000000000000000000000000000AA";
const prefijo = `prueba-aportes-${process.pid}-${Math.floor(performance.now())}`;
const sal = `sal-${prefijo}`;

const aporte = (n: number) => ({
  tipo: "Noticia",
  descripcion: `${prefijo} aporte ${n}`,
  fuente: "https://ejemplo.co/noticia",
  correo: "persona@ejemplo.co",
  turnstile: "XXXX.DUMMY.TOKEN.XXXX",
});

afterAll(async () => {
  await servicio.from("aportes").delete().like("descripcion", `${prefijo}%`);
});

describe("Turnstile (llaves de prueba de Cloudflare)", () => {
  test("la llave que siempre aprueba aprueba", async () => {
    expect(await verificarTurnstile("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1", SIEMPRE_APRUEBA)).toBe(true);
  });
  test("la llave que siempre falla rechaza (CA-05.1)", async () => {
    expect(await verificarTurnstile("XXXX.DUMMY.TOKEN.XXXX", "127.0.0.1", SIEMPRE_FALLA)).toBe(false);
  });
  test("sin token no consulta y rechaza", async () => {
    expect(await verificarTurnstile("", "127.0.0.1", SIEMPRE_APRUEBA)).toBe(false);
  });
});

describe("registrarAporte con Supabase real", () => {
  const deps = dependenciasSupabase(servicio, (token, ip) => verificarTurnstile(token, ip, SIEMPRE_APRUEBA));

  test("guarda el aporte pendiente y el correo aparte; el público no los ve (CA-04.1, CA-06.1, RNF-10)", async () => {
    const r = await registrarAporte(aporte(1), { ip: "10.0.0.1", sal }, deps);
    expect(r.ok).toBe(true);
    const id = r.ok ? r.seguimiento : -1;

    const { data: fila } = await servicio.from("aportes").select("*").eq("id", id).single();
    expect(fila).toMatchObject({ publicacion: "Pendiente", origen: "usuario", origen_hash: hashOrigen("10.0.0.1", sal) });
    expect(JSON.stringify(fila)).not.toContain("persona@ejemplo.co");

    const { data: contacto } = await servicio.from("aportantes").select("correo").eq("aporte_id", id).single();
    expect(contacto?.correo).toBe("persona@ejemplo.co");

    expect((await anonimo.from("aportes").select("id").eq("id", id)).data ?? []).toEqual([]);
    expect((await anonimo.from("aportantes").select("correo").eq("aporte_id", id)).data ?? []).toEqual([]);
  });

  test(`el envío ${LIMITE_POR_HORA + 1} del mismo origen en una hora se rechaza (CA-05.2)`, async () => {
    const ip = "10.0.0.2";
    for (let n = 0; n < LIMITE_POR_HORA; n++) {
      expect((await registrarAporte(aporte(10 + n), { ip, sal }, deps)).ok).toBe(true);
    }
    const r = await registrarAporte(aporte(99), { ip, sal }, deps);
    expect(r.ok).toBe(false);
    const { count } = await servicio
      .from("aportes")
      .select("id", { count: "exact", head: true })
      .eq("origen_hash", hashOrigen(ip, sal));
    expect(count).toBe(LIMITE_POR_HORA);
  }, 90_000); // 6 envíos reales, cada uno con Turnstile y Supabase
});
