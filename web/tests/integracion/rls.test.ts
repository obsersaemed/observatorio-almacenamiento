// CA-01.1, CA-04.1, CA-16.1 y RNF-10 contra la base real del proyecto "pruebas".
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import definicion from "@/generado/esquemas.json";
import { mensaje } from "@/lib/esquemas";
import { fetchConReintento } from "@/lib/fetch-con-reintento";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en web/.env.local",
  );
}

const sinSesion = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetchConReintento } };
const anonimo: SupabaseClient = createClient(url, anonKey, sinSesion);
const servicio: SupabaseClient = createClient(url, serviceKey, sinSesion);

// Prefijo único por corrida para no chocar con otros datos y poder limpiar.
const prefijo = `prueba-rls-${process.pid}-${Math.floor(performance.now())}`;

const proyecto = (nombre: string, publicacion: string, estado = "En operación") => ({
  nombre: `${prefijo} ${nombre}`,
  estado,
  departamento: "Cundinamarca",
  municipio: "Tocancipá",
  fuente: "https://ejemplo.co/fuente",
  publicacion,
});

beforeAll(async () => {
  const { error } = await servicio
    .from("proyectos")
    .insert([proyecto("pendiente", "Pendiente"), proyecto("aprobado", "Aprobado")]);
  if (error) throw new Error(`No se pudo sembrar: ${error.message}`);
});

afterAll(async () => {
  await servicio.from("proyectos").delete().like("nombre", `${prefijo}%`);
  await servicio.from("aportes").delete().like("descripcion", `${prefijo}%`);
  await servicio.from("historial").delete().like("registro", `${prefijo}%`);
  await servicio.from("normas").delete().like("id", `${prefijo}%`);
});

describe("RLS para visitantes anónimos", () => {
  test("solo ve proyectos aprobados (CA-01.1)", async () => {
    const { data, error } = await anonimo.from("proyectos").select("nombre").like("nombre", `${prefijo}%`);
    expect(error).toBeNull();
    expect(data?.map((p) => p.nombre)).toEqual([`${prefijo} aprobado`]);
  });

  test("puede enviar un aporte pendiente de usuario (CA-04.1)", async () => {
    const { error } = await anonimo.from("aportes").insert({
      tipo: "Noticia",
      descripcion: `${prefijo} aporte`,
      fuente: "https://ejemplo.co/noticia",
      origen: "usuario",
      publicacion: "Pendiente",
    });
    expect(error).toBeNull();
  });

  test("no puede enviar un aporte ya aprobado ni hacerse pasar por agente", async () => {
    const base = { tipo: "Noticia", descripcion: `${prefijo} trampa`, fuente: "https://ejemplo.co/x" };
    const aprobado = await anonimo.from("aportes").insert({ ...base, origen: "usuario", publicacion: "Aprobado" });
    const agente = await anonimo.from("aportes").insert({ ...base, origen: "agente", publicacion: "Pendiente" });
    expect(aprobado.error).not.toBeNull();
    expect(agente.error).not.toBeNull();
  });

  test("no lee aportes, aportantes, historial ni editores (CA-04.1, RNF-10)", async () => {
    for (const tabla of ["aportes", "aportantes", "historial", "editores"]) {
      const { data } = await anonimo.from(tabla).select("*").limit(1);
      expect(data ?? [], `anónimo leyó ${tabla}`).toEqual([]);
    }
  });

  test("no puede escribir en proyectos", async () => {
    const { error } = await anonimo.from("proyectos").insert(proyecto("intruso", "Aprobado"));
    expect(error).not.toBeNull();
  });
});

describe("restricciones de la base (CA-16.1)", () => {
  test("un Estado fuera de la lista se rechaza incluso con la llave de servicio, con el mensaje compartido", async () => {
    const { error } = await servicio.from("proyectos").insert(proyecto("estado inválido", "Pendiente", "Planeado"));
    expect(error?.code).toBe("23514"); // check_violation
    const valores = definicion.proyectos.columnas.find((c) => c.nombre === "Estado")!.valores!.join(", ");
    expect(error?.message).toBe(mensaje("valores", { columna: "Estado", valor: "Planeado", valores }));
  });

  test("un servicio fuera de la lista se rechaza con el mensaje compartido (002 · CA-14.1)", async () => {
    const { error } = await servicio
      .from("proyectos")
      .insert({ ...proyecto("servicio inválido", "Pendiente"), tipo_uso_conexion: "Servicio X" });
    expect(error?.code).toBe("23514");
    const valores = definicion.proyectos.columnas.find((c) => c.nombre === "Tipo uso/conexión")!.valores!.join(", ");
    expect(error?.message).toBe(mensaje("valores", { columna: "Tipo uso/conexión", valor: "Servicio X", valores }));
  });

  test("dos servicios de la lista separados por coma se aceptan (002 · CA-14.2)", async () => {
    const { error } = await servicio.from("proyectos").insert({
      ...proyecto("dos servicios", "Pendiente"),
      tipo_uso_conexion: "Regulación primaria de frecuencia, Inyección de energía en la noche",
    });
    expect(error).toBeNull();
  });

  test("una latitud fuera de Colombia se rechaza", async () => {
    const { error } = await servicio
      .from("proyectos")
      .insert({ ...proyecto("latitud", "Pendiente"), latitud: 49.653 });
    expect(error?.code).toBe("23514");
  });
});

describe("normas (004 · T02, aclaración 1)", () => {
  const norma = (id: string, emisor: string, tipo: string) => ({
    id: `${prefijo}-${id}`, fecha: "2024-01-01", emisor, tipo, numero: "X", titulo: "Norma ficticia de prueba",
    estado: "Vigente", enlace: "https://ejemplo.co/norma", publicacion: "Pendiente",
  });

  test("un estudio académico (emisor Academia, tipo Estudio) se acepta", async () => {
    const { error } = await servicio.from("normas").insert(norma("estudio", "Academia", "Estudio"));
    expect(error).toBeNull();
  });

  test("un emisor fuera de la lista se rechaza con el mensaje compartido", async () => {
    const { error } = await servicio.from("normas").insert(norma("emisor", "Emisor X", "Resolución"));
    const valores = definicion.normativa.columnas.find((c) => c.nombre === "emisor")!.valores!.join(", ");
    expect(error?.message).toBe(mensaje("valores", { columna: "emisor", valor: "Emisor X", valores }));
  });
});

describe("historial (CA-11.1)", () => {
  test("cambiar un proyecto deja un registro con valores anteriores y nuevos", async () => {
    const nombre = `${prefijo} aprobado`;
    const { error } = await servicio
      .from("proyectos")
      .update({ potencia_nominal_mw: 12 })
      .eq("nombre", nombre);
    expect(error).toBeNull();
    const { data } = await servicio
      .from("historial")
      .select("tabla, operacion, antes, despues")
      .eq("tabla", "proyectos")
      .eq("operacion", "UPDATE")
      .eq("despues->>nombre", nombre);
    expect(data?.length).toBe(1);
    expect(data?.[0].antes.potencia_nominal_mw).toBeNull();
    expect(Number(data?.[0].despues.potencia_nominal_mw)).toBe(12);
  });
});
