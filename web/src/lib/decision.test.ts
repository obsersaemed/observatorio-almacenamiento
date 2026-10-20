// T12 · RF-09, RF-10, RF-16 (CA-09.1, CA-09.2, CA-10.1, CA-16.1)
import { describe, expect, test, vi } from "vitest";
import type { AporteFila } from "./aportes-admin";
import { aprobarAporte, columnaSql, datosDesdeFormulario, rechazarAporte } from "./decision";
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
