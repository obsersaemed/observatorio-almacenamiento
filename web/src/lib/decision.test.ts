// T12 · RF-09, RF-10, RF-16 (CA-09.1, CA-09.2, CA-10.1, CA-16.1)
import { describe, expect, test, vi } from "vitest";
import type { AporteFila } from "./aportes-admin";
import { aprobarAporte, camposDecision, columnaSql, datosDesdeFormulario, rechazarAporte } from "./decision";
import { mensaje } from "./esquemas";

const aporte = (cambios: Partial<AporteFila> = {}): AporteFila => ({
  id: 5,
  tipo: "Corrección",
  registro_afectado: "BESS Termozipa",
  descripcion: "La potencia es 12 MW",
  datos: { potencia_nominal_mw: 12 },
  fuente: "https://ejemplo.co/fuente",
  origen: "usuario",
  agente: null,
  publicacion: "Pendiente",
  creado_en: "2026-10-19T15:00:00Z",
  ...cambios,
});

const actual = {
  nombre: "BESS Termozipa",
  estado: "En operación",
  departamento: "Cundinamarca",
  municipio: "Tocancipá",
  potencia_nominal_mw: 7,
  fuente: "https://ejemplo.co/original",
};

const deps = () => ({ aplicar: vi.fn(async () => {}), rechazar: vi.fn(async () => {}), revalidar: vi.fn() });

describe("columnaSql (misma regla que scripts/validar_datos.py)", () => {
  test.each([
    ["Potencia nominal [MW]", "potencia_nominal_mw"],
    ["Tipo uso/conexión", "tipo_uso_conexion"],
    ["Estado de carga mínimo técnico [%]", "estado_de_carga_minimo_tecnico"],
    ["relacionada_con", "relacionada_con"],
  ])("%s → %s", (nombre, sql) => expect(columnaSql(nombre)).toBe(sql));
});

describe("rechazarAporte (CA-09.1)", () => {
  test("sin motivo no rechaza y lo exige", async () => {
    const d = deps();
    const r = await rechazarAporte(5, "   ", d);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errores.join(" ")).toMatch(/motivo/i);
    expect(d.rechazar).not.toHaveBeenCalled();
  });
  test("con motivo rechaza", async () => {
    const d = deps();
    expect(await rechazarAporte(5, "Sin fuente verificable", d)).toEqual({ ok: true });
    expect(d.rechazar).toHaveBeenCalledWith(5, "Sin fuente verificable");
  });
});

describe("aprobarAporte", () => {
  test("una corrección ajustada envía solo los campos que cambian y revalida la tabla (CA-09.2, CA-10.1)", async () => {
    const d = deps();
    const r = await aprobarAporte(aporte(), actual, { ...actual, potencia_nominal_mw: "11,5" }, d);
    expect(r).toEqual({ ok: true });
    expect(d.aplicar).toHaveBeenCalledWith(5, { potencia_nominal_mw: 11.5 });
    expect(d.revalidar).toHaveBeenCalledWith("proyectos");
  });

  test("valida el registro resultante con las reglas compartidas (CA-16.1)", async () => {
    const d = deps();
    const r = await aprobarAporte(aporte(), actual, { ...actual, estado: "Planeado" }, d);
    const valores = ["En operación", "En construcción", "Anunciado", "Inactivo"].join(", ");
    expect(r).toEqual({ ok: false, errores: [mensaje("valores", { columna: "Estado", valor: "Planeado", valores })] });
    expect(d.aplicar).not.toHaveBeenCalled();
  });

  test("un proyecto nuevo envía todos los campos con valor", async () => {
    const d = deps();
    const nuevo = { nombre: "BESS Nuevo", estado: "Anunciado", departamento: "Meta", municipio: "Puerto Gaitán", fuente: "https://ejemplo.co/n" };
    const r = await aprobarAporte(aporte({ tipo: "Proyecto nuevo", registro_afectado: null, datos: {} }), null, nuevo, d);
    expect(r).toEqual({ ok: true });
    expect(d.aplicar).toHaveBeenCalledWith(5, nuevo);
  });

  test("una corrección sin cambios no se aprueba", async () => {
    const d = deps();
    const r = await aprobarAporte(aporte(), actual, { ...actual }, d);
    expect(r.ok).toBe(false);
    expect(d.aplicar).not.toHaveBeenCalled();
  });

  test("si la base rechaza, se informa su mensaje", async () => {
    const d = { ...deps(), aplicar: vi.fn(async () => Promise.reject(new Error("solo editores"))) };
    const r = await aprobarAporte(aporte(), actual, { ...actual, potencia_nominal_mw: 12 }, d);
    expect(r).toEqual({ ok: false, errores: ["solo editores"] });
    expect(d.revalidar).not.toHaveBeenCalled();
  });
});

test("datosDesdeFormulario toma los campos 'campo:<columna>' del formulario", () => {
  const f = new FormData();
  f.set("campo:nombre", " BESS ");
  f.set("campo:potencia_nominal_mw", "7");
  f.set("otro", "x");
  expect(datosDesdeFormulario(f)).toEqual({ nombre: "BESS", potencia_nominal_mw: "7" });
});

test("datosDesdeFormulario une con coma las casillas marcadas de un campo de lista (002 · CA-14.1)", () => {
  const f = new FormData();
  f.append("campo:tipo_uso_conexion", "");
  f.append("campo:tipo_uso_conexion", "Regulación primaria de frecuencia");
  f.append("campo:tipo_uso_conexion", "Inyección de energía en la noche");
  expect(datosDesdeFormulario(f)).toEqual({
    tipo_uso_conexion: "Regulación primaria de frecuencia, Inyección de energía en la noche",
  });
  const vacio = new FormData();
  vacio.append("campo:tipo_uso_conexion", "");
  expect(datosDesdeFormulario(vacio)).toEqual({ tipo_uso_conexion: "" });
});

describe("camposDecision (RNF-04, CA-16.1)", () => {
  test("T18 · un servicio propuesto fuera de la lista se avisa y el grupo se llama Servicios (O-3)", () => {
    const campos = camposDecision(
      aporte({ datos: { tipo_uso_conexion: "Servicio X, Inyección de energía en la noche" } }),
      actual,
    );
    const servicios = campos.find((c) => c.sql === "tipo_uso_conexion")!;
    expect(servicios.etiqueta).toBe("Servicios");
    expect(servicios.aviso).toBe(
      "El aporte propone «Servicio X», que no está en la lista. Elige los servicios que correspondan; ese valor no se guardará.",
    );
    const sinAviso = camposDecision(aporte({ datos: {} }), { ...actual, tipo_uso_conexion: "Inyección de energía en la noche" });
    expect(sinAviso.find((c) => c.sql === "tipo_uso_conexion")!.aviso).toBeUndefined();
  });

  test("Servicios se ofrece como lista de varios valores (002 · CA-14.1)", () => {
    const campos = camposDecision(aporte({ datos: {} }), { ...actual, tipo_uso_conexion: "Inyección de energía en la noche" });
    const servicios = campos.find((c) => c.sql === "tipo_uso_conexion")!;
    expect(servicios).toMatchObject({ multiple: true, valor: "Inyección de energía en la noche" });
    expect(servicios.valores).toHaveLength(3);
  });

  test("prellena con lo propuesto sobre lo actual, números con coma y Estado con su lista", () => {
    const campos = camposDecision(aporte({ datos: { potencia_nominal_mw: 4.5 } }), actual);
    const potencia = campos.find((c) => c.sql === "potencia_nominal_mw")!;
    const estado = campos.find((c) => c.sql === "estado")!;
    expect(potencia).toMatchObject({ etiqueta: "Potencia nominal [MW]", valor: "4,5" });
    expect(estado).toMatchObject({ valor: "En operación", obligatorio: true });
    expect(estado.valores).toEqual(["En operación", "En construcción", "Anunciado", "Inactivo"]);
    expect(campos.find((c) => c.sql === "nombre")?.valores).toBeUndefined();
  });
});

describe("camposDecision · fuente del cambio (CA-11.1)", () => {
  test("en una corrección, la fuente prellenada suma la del aporte a la del registro", () => {
    const campos = camposDecision(aporte({ fuente: "https://ejemplo.co/fuente" }), actual);
    expect(campos.find((c) => c.sql === "fuente")?.valor).toBe("https://ejemplo.co/original https://ejemplo.co/fuente");
  });
  test("si el registro ya cita esa fuente no se duplica", () => {
    const campos = camposDecision(aporte({ fuente: "https://ejemplo.co/original" }), actual);
    expect(campos.find((c) => c.sql === "fuente")?.valor).toBe("https://ejemplo.co/original");
  });
  test("en un proyecto nuevo sin fuente en los datos, se usa la del aporte", () => {
    const campos = camposDecision(aporte({ tipo: "Proyecto nuevo", registro_afectado: null, datos: {}, fuente: "https://ejemplo.co/n" }), null);
    expect(campos.find((c) => c.sql === "fuente")?.valor).toBe("https://ejemplo.co/n");
  });
});
