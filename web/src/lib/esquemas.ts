// Esquemas zod construidos desde datos/esquemas.json (copiado a src/generado/ por
// scripts/sincronizar-esquemas.mjs), la misma definición que usa
// scripts/validar_datos.py. Los mensajes salen de las mismas plantillas (_mensajes),
// así que un dato inválido se rechaza con el mismo texto en la web y en la importación.
import { z } from "zod";
import definicion from "@/generado/esquemas.json";

type Columna = {
  nombre: string;
  tipo: "texto" | "numero" | "fecha" | "urls" | "correo" | "enum";
  obligatorio?: boolean;
  valores?: string[];
  min?: number;
  max?: number;
};
type Plantilla = keyof typeof definicion._mensajes;
export type NombreEsquema = "proyectos" | "normativa" | "noticias" | "aportes";

const URL_VALIDA = /^https?:\/\/\S+$/;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function mensaje(clave: Plantilla, datos: Record<string, string>): string {
  return definicion._mensajes[clave].replace(/\{(\w+)\}/g, (_, k: string) => datos[k] ?? "");
}

// Igual que numero() en validar_datos.py: acepta "4,9653", "4.9653" y "1.234,5".
export function leerNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let v = String(valor ?? "").trim();
  if (v.includes(",") && v.includes(".")) v = v.replaceAll(".", "");
  const x = Number(v.replace(",", "."));
  return v !== "" && Number.isFinite(x) ? x : null;
}

const esFechaReal = (v: string) =>
  FECHA.test(v) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

function campo(c: Columna) {
  return z.unknown().transform((bruto, ctx) => {
    const texto = typeof bruto === "number" ? String(bruto) : String(bruto ?? "").trim();
    const falla = (clave: Plantilla, extra: Record<string, string> = {}) => {
      ctx.addIssue({ code: "custom", message: mensaje(clave, { columna: c.nombre, valor: texto, ...extra }) });
      return z.NEVER;
    };

    if (texto === "") return c.obligatorio ? falla("obligatorio") : undefined;

    switch (c.tipo) {
      case "numero": {
        const x = leerNumero(bruto);
        if (x === null) return falla("numero");
        if ((c.min !== undefined && x < c.min) || (c.max !== undefined && x > c.max)) {
          return falla("rango", { min: String(c.min ?? "-inf"), max: String(c.max ?? "inf") });
        }
        return x;
      }
      case "enum":
        return c.valores!.includes(texto) ? texto : falla("valores", { valores: c.valores!.join(", ") });
      case "fecha":
        return esFechaReal(texto) ? texto : falla("fecha");
      case "urls":
        return texto.split(/\s+/).every((u) => URL_VALIDA.test(u)) ? texto : falla("urls");
      case "correo":
        return CORREO.test(texto) ? texto : falla("correo");
      default:
        return texto;
    }
  });
}

const cache = new Map<NombreEsquema, z.ZodType<Record<string, unknown>>>();

export function esquemaDe(nombre: NombreEsquema) {
  if (!cache.has(nombre)) {
    const columnas = definicion[nombre].columnas as Columna[];
    const forma = Object.fromEntries(columnas.map((c) => [c.nombre, campo(c)]));
    // zod 4 rechaza claves ausentes antes del transform: se completan con "" para que
    // cada columna aplique su propia regla (obligatoria o no).
    const completar = (datos: unknown) => ({
      ...Object.fromEntries(columnas.map((c) => [c.nombre, ""])),
      ...(datos as Record<string, unknown>),
    });
    cache.set(
      nombre,
      z.preprocess(completar, z.object(forma)) as unknown as z.ZodType<Record<string, unknown>>,
    );
  }
  return cache.get(nombre)!;
}

export function validar(nombre: NombreEsquema, datos: Record<string, unknown>) {
  const r = esquemaDe(nombre).safeParse(datos);
  return r.success
    ? { datos: r.data, errores: [] as string[] }
    : { datos: null, errores: r.error.issues.map((i) => i.message) };
}
