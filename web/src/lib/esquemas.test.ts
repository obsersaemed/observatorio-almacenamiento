import { describe, expect, test } from "vitest";
import definicion from "@/generado/esquemas.json";
import { esquemaDe, mensaje, validar } from "./esquemas";

const proyectoValido = {
  Nombre: "BESS de prueba",
  Estado: "En operación",
  Departamento: "Cundinamarca",
  Municipio: "Tocancipá",
  Latitud: "4,9653",
  Longitud: "-73,9128",
  "Potencia nominal [MW]": 7,
  "Capacidad máxima [MWh]": "3,9",
  Fuente: "https://ejemplo.co/proyecto",
};

const aporteValido = {
  tipo: "Noticia",
  descripcion: "Nueva subasta de almacenamiento",
  fuente: "https://ejemplo.co/noticia",
  correo: "persona@ejemplo.co",
  origen: "usuario",
  publicacion: "Pendiente",
};

describe("esquemas construidos desde datos/esquemas.json", () => {
  test("un proyecto válido pasa y los números en es-CO se convierten", () => {
    const r = validar("proyectos", proyectoValido);
    expect(r.errores).toEqual([]);
    expect(r.datos?.Latitud).toBeCloseTo(4.9653);
    expect(r.datos?.["Capacidad máxima [MWh]"]).toBeCloseTo(3.9);
  });

  test("servicios de la lista separados por coma se aceptan y se normalizan (002 · CA-14.2)", () => {
    const r = validar("proyectos", {
      ...proyectoValido,
      "Tipo uso/conexión": "Regulación primaria de frecuencia ,Inyección de energía en la noche",
    });
    expect(r.errores).toEqual([]);
    expect(r.datos?.["Tipo uso/conexión"]).toBe("Regulación primaria de frecuencia, Inyección de energía en la noche");
  });

  test("un servicio fuera de la lista se rechaza con el mismo mensaje que Python y SQL (002 · CA-14.1)", () => {
    const r = validar("proyectos", { ...proyectoValido, "Tipo uso/conexión": "Servicio X" });
    const valores = definicion.proyectos.columnas.find((c) => c.nombre === "Tipo uso/conexión")!.valores!;
    expect(r.errores).toEqual([
      mensaje("valores", { columna: "Tipo uso/conexión", valor: "Servicio X", valores: valores.join(", ") }),
    ]);
  });

  test("Estado fuera de la lista se rechaza con el mensaje de la plantilla", () => {
    const r = validar("proyectos", { ...proyectoValido, Estado: "Planeado" });
    const valores = definicion.proyectos.columnas.find((c) => c.nombre === "Estado")!.valores!;
    expect(r.errores).toContain(
      mensaje("valores", { columna: "Estado", valor: "Planeado", valores: valores.join(", ") }),
    );
  });

  test("una latitud fuera de Colombia se rechaza", () => {
    const r = validar("proyectos", { ...proyectoValido, Latitud: "49,653" });
    expect(r.errores).toContain(
      mensaje("rango", { columna: "Latitud", valor: "49,653", min: "-4.3", max: "13.5" }),
    );
  });

  test("un aporte sin fuente se rechaza", () => {
    const r = validar("aportes", { ...aporteValido, fuente: "" });
    expect(r.errores).toContain(mensaje("obligatorio", { columna: "fuente" }));
  });

  test("un aporte sin correo se rechaza, y uno con correo mal escrito también", () => {
    expect(validar("aportes", { ...aporteValido, correo: "" }).errores).toContain(
      mensaje("obligatorio", { columna: "correo" }),
    );
    expect(validar("aportes", { ...aporteValido, correo: "persona@" }).errores).toContain(
      mensaje("correo", { columna: "correo" }),
    );
  });

  test("un aporte válido pasa", () => {
    expect(validar("aportes", aporteValido).errores).toEqual([]);
  });

  test("esquemaDe devuelve un esquema zod utilizable con safeParse", () => {
    expect(esquemaDe("aportes").safeParse(aporteValido).success).toBe(true);
    expect(esquemaDe("aportes").safeParse({ ...aporteValido, tipo: "Otro" }).success).toBe(false);
  });
});
