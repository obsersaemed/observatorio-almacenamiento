// 003 · T04 · RF-12, RF-14, CA-14.1, CA-11.1 contra Supabase «pruebas» (migración 0005).
// Ojo: reemplazar_vehiculos() reemplaza TODO; por eso al final se restauran los datos que había.
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import definicion from "@/generado/esquemas.json";
import { mensaje } from "@/lib/esquemas";
import { anonimo, servicio } from "./sesion";

type Linea = Record<string, unknown>;
type Venta = Record<string, unknown>;
let respaldo: { lineas: Linea[]; ventas: Venta[]; corte: string | null; ultimaId: number } = { lineas: [], ventas: [], corte: null, ultimaId: 0 };
const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

const linea = (f: Partial<Linea> = {}) => ({
  marca: "E2E", linea: "prueba-int Linea", tipo_de_bateria: "LFP",
  capacidad_minima_kwh: 40, capacidad_maxima_kwh: 60, potencia_kw: null, ...f,
});

beforeAll(async () => {
  const [l, v, i] = await Promise.all([
    servicio.from("vehiculos_lineas").select("marca, linea, tipo_de_bateria, capacidad_minima_kwh, capacidad_maxima_kwh, potencia_kw"),
    servicio.from("vehiculos_ventas").select("linea, ano, unidades"),
    servicio.from("vehiculos_importaciones").select("id, corte").order("id", { ascending: false }).limit(1),
  ]);
  if (l.error || v.error || i.error) throw l.error ?? v.error ?? i.error;
  respaldo = { lineas: l.data, ventas: v.data, corte: i.data[0]?.corte ?? null, ultimaId: i.data[0]?.id ?? 0 };
});

afterAll(async () => {
  // Deja la base como estaba: las mismas líneas y ventas (o ninguna) y solo las importaciones
  // anteriores, para no cambiar la «Última actualización».
  const r = await servicio.rpc("reemplazar_vehiculos", { p_lineas: respaldo.lineas, p_ventas: respaldo.ventas, p_corte: respaldo.corte ?? hoy });
  if (r.error) throw r.error;
  await servicio.from("vehiculos_importaciones").delete().gt("id", respaldo.ultimaId);
});

describe("RLS de vehículos", () => {
  test("el visitante anónimo lee pero no escribe", async () => {
    const lectura = await anonimo.from("vehiculos_lineas").select("linea").limit(1);
    expect(lectura.error).toBeNull();
    const escritura = await anonimo.from("vehiculos_lineas").insert(linea());
    expect(escritura.error).not.toBeNull();
    const rpc = await anonimo.rpc("reemplazar_vehiculos", { p_lineas: [], p_ventas: [], p_corte: hoy });
    expect(rpc.error).not.toBeNull();
  });
});

describe("reemplazar_vehiculos (todo o nada)", () => {
  test("una fila inválida no cambia nada y devuelve el mensaje compartido (CA-14.1)", async () => {
    const antes = await servicio.from("vehiculos_lineas").select("linea", { count: "exact", head: true });
    const { error } = await servicio.rpc("reemplazar_vehiculos", {
      p_lineas: [linea({ capacidad_maxima_kwh: 30 })],
      p_ventas: [],
      p_corte: hoy,
    });
    expect(error?.message).toBe(
      mensaje("min_de", { columna: "Capacidad máxima [kWh]", valor: "30", otra: "Capacidad mínima [kWh]" }),
    );
    const despues = await servicio.from("vehiculos_lineas").select("linea", { count: "exact", head: true });
    expect(despues.count).toBe(antes.count);
  });

  test("unidades no enteras se rechazan con el mensaje de «entero»", async () => {
    const { error } = await servicio.rpc("reemplazar_vehiculos", {
      p_lineas: [linea()],
      p_ventas: [{ linea: "prueba-int Linea", ano: 2024, unidades: 2.5 }],
      p_corte: hoy,
    });
    expect(error?.message).toBe(mensaje("entero", { columna: "Unidades", valor: "2.5" }));
  });

  test("con datos válidos reemplaza y registra la importación con la fecha de hoy (CA-11.1)", async () => {
    const { data: id, error } = await servicio.rpc("reemplazar_vehiculos", {
      p_lineas: [linea()],
      p_ventas: [{ linea: "prueba-int Linea", ano: 2024, unidades: 100 }],
      p_corte: "2026-09-17",
    });
    expect(error).toBeNull();
    const { data } = await anonimo.from("vehiculos_importaciones").select("actualizado_en, corte, lineas, unidades").eq("id", id).single();
    expect(data).toMatchObject({ corte: "2026-09-17", lineas: 1, unidades: 100 });
    expect(new Date(data!.actualizado_en).toLocaleDateString("en-CA", { timeZone: "America/Bogota" })).toBe(hoy);
  });

  test("un corte posterior a hoy se rechaza", async () => {
    const { error } = await servicio.rpc("reemplazar_vehiculos", { p_lineas: [linea()], p_ventas: [], p_corte: "2999-01-01" });
    expect(error?.message).toMatch(/no puede ser posterior a hoy/);
  });
});

void definicion;
