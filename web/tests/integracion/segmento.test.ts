// 008 · T02 contra Supabase "pruebas": la base (insert directo) aplica las mismas reglas que el
// validador y /admin (CA-02.1, CA-02.2, CA-09.1, CA-09.2, CA-10.1).
// EN ESPERA: necesita la migración 0007_segmento.sql aplicada en «pruebas» (la aplica el usuario).
// Hasta entonces se salta; para correrla: MIGRACION_0007_APLICADA=1 npm run test:integracion
import { afterAll, describe, expect, test } from "vitest";
import { servicio } from "./sesion";

const aplicada = process.env.MIGRACION_0007_APLICADA === "1";
const prefijo = `prueba-segmento-${process.pid}-${Math.floor(performance.now())}`;
const MEDIDOR = "Maximización de autoconsumo PV y respaldo";
const TEXTO = "Información de Azimut Energía (2026-10)";

function proyecto(nombre: string, campos: Record<string, unknown>) {
  return {
    nombre: `${prefijo} ${nombre}`,
    estado: "En operación",
    departamento: "Antioquia",
    municipio: "Medellín",
    potencia_nominal_mw: 0.015,
    publicacion: "Pendiente",
    ...campos,
  };
}

afterAll(async () => {
  if (!aplicada) return;
  await servicio.from("proyectos").delete().like("nombre", `${prefijo}%`);
  await servicio.from("aportes").delete().like("descripcion", `${prefijo}%`);
  await servicio.from("historial").delete().like("registro", `${prefijo}%`);
});

describe.skipIf(!aplicada)("segmentos en la base (en espera de la 0007)", () => {
  test("detrás del medidor con fuente textual se acepta (CA-02.1, CA-09.1)", async () => {
    const { error } = await servicio.from("proyectos").insert(proyecto("Medidor", { tipo_uso_conexion: MEDIDOR, fuente: TEXTO }));
    expect(error).toBeNull();
  });

  test("gran escala con fuente textual se rechaza como hoy (CA-09.2)", async () => {
    const { error } = await servicio
      .from("proyectos")
      .insert(proyecto("Gran escala", { tipo_uso_conexion: "Regulación primaria de frecuencia", fuente: TEXTO }));
    expect(error?.code).toBe("23514");
    expect(error?.message).toBe("'Fuente' tiene algo que no es un enlace http(s)");
  });

  test("mezclar servicios de los dos segmentos se rechaza nombrando la columna (CA-02.2)", async () => {
    const { error } = await servicio.from("proyectos").insert(
      proyecto("Mezcla", { tipo_uso_conexion: `Regulación primaria de frecuencia, ${MEDIDOR}`, fuente: "https://ejemplo.co" }),
    );
    expect(error?.code).toBe("23514");
    expect(error?.message).toBe(
      "'Tipo uso/conexión' mezcla servicios de dos segmentos (Gran escala y Detrás del medidor): un proyecto es de un solo segmento",
    );
  });

  test("un servicio fuera de la lista se rechaza (CA-02.1)", async () => {
    const { error } = await servicio.from("proyectos").insert(proyecto("Inventado", { tipo_uso_conexion: "Servicio X", fuente: "https://ejemplo.co" }));
    expect(error?.code).toBe("23514");
  });

  test("un aporte del segmento admite fuente textual; uno de gran escala no", async () => {
    const base = { tipo: "Proyecto nuevo", descripcion: `${prefijo} aporte`, origen: "agente", agente: "prueba" };
    const medidor = await servicio.from("aportes").insert({ ...base, fuente: TEXTO, datos: { tipo_uso_conexion: MEDIDOR } });
    expect(medidor.error).toBeNull();
    const gran = await servicio
      .from("aportes")
      .insert({ ...base, fuente: TEXTO, datos: { tipo_uso_conexion: "Regulación primaria de frecuencia" } });
    expect(gran.error?.message).toBe("'fuente' tiene algo que no es un enlace http(s)");
  });
});
