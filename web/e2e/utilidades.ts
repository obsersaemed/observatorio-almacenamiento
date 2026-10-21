// Utilidades de las pruebas E2E (probador independiente).
// Lee las variables de web/.env.local sin imprimirlas. Solo para el proyecto Supabase "pruebas".
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { BrowserContext, Page } from "@playwright/test";

function leerEnv(): Record<string, string> {
  const archivo = path.join(__dirname, "..", ".env.local");
  const texto = fs.readFileSync(archivo, "utf8");
  const env: Record<string, string> = {};
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea || linea.startsWith("#") || !linea.includes("=")) continue;
    const i = linea.indexOf("=");
    env[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return env;
}

export const ENV = leerEnv();
export const URL_SUPABASE = ENV.NEXT_PUBLIC_SUPABASE_URL;
const ANON = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICIO = ENV.SUPABASE_SERVICE_ROLE_KEY;

// Prefijo único de todo lo que siembran estas pruebas.
export const FECHA = new Date().toISOString().slice(0, 10).replace(/-/g, "");
export const PREFIJO = `e2e-${FECHA}-`;
export const DOMINIO_PRUEBA = "ejemplo.co";

export function admin(): SupabaseClient {
  return createClient(URL_SUPABASE, SERVICIO, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonimo(): SupabaseClient {
  return createClient(URL_SUPABASE, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function sufijo(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Proyecto mínimo válido con nombre prefijado. */
export function proyectoPrueba(extra: Record<string, unknown> = {}) {
  return {
    nombre: `${PREFIJO}proyecto-${sufijo()}`,
    operador: `${PREFIJO}operador`,
    estado: "En operación",
    tecnologia: "Li-ion",
    departamento: "Cundinamarca",
    municipio: "Tocancipá",
    latitud: 4.96,
    longitud: -73.91,
    potencia_nominal_mw: 1.5,
    capacidad_maxima_mwh: 2.25,
    fuente: "https://ejemplo.co/fuente-e2e",
    publicacion: "Aprobado",
    ...extra,
  };
}

export async function sembrarProyectos(filas: Record<string, unknown>[]) {
  const { data, error } = await admin().from("proyectos").insert(filas).select();
  if (error) throw new Error("No se pudo sembrar proyectos: " + error.message);
  return data!;
}

export async function sembrarAporte(fila: Record<string, unknown>) {
  const { data, error } = await admin().from("aportes").insert(fila).select().single();
  if (error) throw new Error("No se pudo sembrar el aporte: " + error.message);
  return data!;
}

/** Borra todo lo sembrado con el prefijo (proyectos, aportes, aportantes, historial, editores, usuarios). */
export async function limpiarTodo() {
  const sb = admin();
  const like = `${PREFIJO}%`;
  const { data: aps } = await sb
    .from("aportes")
    .select("id")
    .or(`descripcion.like.${like},agente.like.${like},registro_afectado.like.${like}`);
  const idsAportes = (aps ?? []).map((a) => a.id);
  const { data: aportantes } = await sb.from("aportantes").select("aporte_id").like("correo", `%@${DOMINIO_PRUEBA}`);
  for (const a of aportantes ?? []) idsAportes.push(a.aporte_id);
  if (idsAportes.length) {
    await sb.from("historial").delete().in("aporte_id", idsAportes);
    await sb.from("aportantes").delete().in("aporte_id", idsAportes);
  }
  await sb.from("aportantes").delete().like("correo", `%@${DOMINIO_PRUEBA}`);
  if (idsAportes.length) await sb.from("aportes").delete().in("id", idsAportes);
  await sb.from("proyectos").delete().like("nombre", like);
  await sb.from("noticias").delete().like("titulo", like);
  await sb.from("normas").delete().like("titulo", like);
  await sb.from("historial").delete().like("registro", like);
  await sb.from("historial").delete().like("editor", like);
  await sb.from("historial").delete().like("editor", `%@${DOMINIO_PRUEBA}`);
  await sb.from("editores").delete().like("correo", `${PREFIJO}%@${DOMINIO_PRUEBA}`);
  const { data: usuarios } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of usuarios?.users ?? []) {
    if (u.email?.startsWith(PREFIJO) && u.email.endsWith(`@${DOMINIO_PRUEBA}`)) {
      await sb.auth.admin.deleteUser(u.id);
    }
  }
}

export const CORREO_EDITOR = `${PREFIJO}editor@${DOMINIO_PRUEBA}`;

/**
 * Crea (si hace falta) un editor de prueba, lo registra en `editores` y deja en el
 * navegador una sesión válida usando el formato de cookies de @supabase/ssr.
 */
export async function iniciarSesionEditor(context: BrowserContext, correo = CORREO_EDITOR) {
  const sb = admin();
  await sb.from("editores").upsert({ correo, nombre: `${PREFIJO}editor` });
  const { data: lista } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (!lista?.users.find((u) => u.email === correo)) {
    const { error } = await sb.auth.admin.createUser({ email: correo, email_confirm: true });
    if (error) throw new Error("createUser: " + error.message);
  }
  const { data: enlace, error: e2 } = await sb.auth.admin.generateLink({ type: "magiclink", email: correo });
  if (e2) throw new Error("generateLink: " + e2.message);
  const { data: ses, error: e3 } = await anonimo().auth.verifyOtp({
    type: "magiclink",
    token_hash: enlace.properties.hashed_token,
  });
  if (e3 || !ses.session) throw new Error("verifyOtp: " + (e3?.message ?? "sin sesión"));

  const galletas: { name: string; value: string }[] = [];
  const ssr = createServerClient(URL_SUPABASE, ANON, {
    cookies: {
      getAll: () => galletas,
      setAll: (nuevas) => {
        for (const g of nuevas) {
          const i = galletas.findIndex((x) => x.name === g.name);
          if (i >= 0) galletas.splice(i, 1);
          if (g.value) galletas.push({ name: g.name, value: g.value });
        }
      },
    },
  });
  await ssr.auth.setSession({
    access_token: ses.session.access_token,
    refresh_token: ses.session.refresh_token,
  });
  await context.addCookies(
    galletas.map((g) => ({ name: g.name, value: g.value, domain: "localhost", path: "/", sameSite: "Lax" as const })),
  );
}

/** Recoge errores de consola y de página. */
export function vigilarConsola(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

/** Espera a que Turnstile deje su respuesta en el formulario. */
export async function esperarTurnstile(page: Page) {
  await page.waitForFunction(
    () => {
      const i = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
      return !!i && i.value.length > 0;
    },
    undefined,
    { timeout: 30_000 },
  );
}
