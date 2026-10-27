// Esquemas zod construidos desde datos/esquemas.json (copiado a src/generado/ por
// scripts/sincronizar-esquemas.mjs), la misma definición que usa
// scripts/validar_datos.py. Los mensajes salen de las mismas plantillas (_mensajes),
// así que un dato inválido se rechaza con el mismo texto en la web y en la importación.
import { z } from "zod";
import definicion from "@/generado/esquemas.json";

type Columna = {
  nombre: string;
  tipo: "texto" | "numero" | "entero" | "fecha" | "urls" | "correo" | "enum" | "lista";
  obligatorio?: boolean;
  valores?: string[];
  separador?: string;
  min?: number;
  max?: number;
  /** Regla entre columnas: el valor no puede ser menor que el de esta otra columna. */
  min_de?: string;
  /** 008: servicios de cada segmento; los que no están aquí son del segmento por defecto. */
  segmentos?: Record<string, string[]>;
  segmento_por_defecto?: string;
  /** 008: en este segmento la columna (Fuente) acepta texto sin URL. */
  texto_si_segmento?: string;
};
type Plantilla = keyof typeof definicion._mensajes;
export type NombreEsquema = "proyectos" | "normativa" | "noticias" | "aportes" | "vehiculos_lineas" | "vehiculos_ventas";

const URL_VALIDA = /^https?:\/\/\S+$/;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ENTERO = /^-?\d+$/;

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

/** Igual que separar_lista() en validar_datos.py: "a ,b" → ["a", "b"] (sin vacíos). */
export function separarLista(texto: string, separador = ","): string[] {
  return texto.split(separador).map((v) => v.trim()).filter(Boolean);
}

/** Igual que segmentos_de() en validar_datos.py: segmentos de los servicios, en orden (el de por
 *  defecto primero y luego los del esquema). */
export function segmentosDe(c: Columna, servicios: string[]): string[] {
  const porServicio = new Map(Object.entries(c.segmentos ?? {}).flatMap(([seg, xs]) => xs.map((x) => [x, seg] as const)));
  const encontrados = new Set(servicios.map((x) => porServicio.get(x) ?? c.segmento_por_defecto));
  return [c.segmento_por_defecto, ...Object.keys(c.segmentos ?? {})].filter((s): s is string => !!s && encontrados.has(s));
}

const sonUrls = (texto: string) => texto.split(/\s+/).every((u) => URL_VALIDA.test(u));

const esFechaReal = (v: string) =>
  FECHA.test(v) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

/** urlsDespues: la regla de URL de esta columna depende del segmento y se revisa en superRefine. */
function campo(c: Columna, urlsDespues = false) {
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
      case "entero": {
        if (!ENTERO.test(texto)) return falla("entero");
        const x = Number(texto);
        if ((c.min !== undefined && x < c.min) || (c.max !== undefined && x > c.max)) {
          return falla("rango", { min: String(c.min ?? "-inf"), max: String(c.max ?? "inf") });
        }
        return x;
      }
      case "enum":
        return c.valores!.includes(texto) ? texto : falla("valores", { valores: c.valores!.join(", ") });
      case "lista": {
        const valores = separarLista(texto, c.separador);
        if (!valores.every((v) => c.valores!.includes(v))) return falla("valores", { valores: c.valores!.join(", ") });
        // 008 · RF-02: un proyecto no mezcla servicios de dos segmentos.
        const segmentos = c.segmentos ? segmentosDe(c, valores) : [];
        if (segmentos.length > 1) return falla("segmentos", { segmentos: segmentos.join(" y ") });
        return valores.join(`${c.separador ?? ","} `);
      }
      case "fecha":
        return esFechaReal(texto) ? texto : falla("fecha");
      case "urls":
        return urlsDespues || sonUrls(texto) ? texto : falla("urls");
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
    const colSegmentos = columnas.find((c) => c.segmentos);
    const segunSegmento = (c: Columna) => !!(colSegmentos && c.texto_si_segmento);
    const forma = Object.fromEntries(columnas.map((c) => [c.nombre, campo(c, segunSegmento(c))]));
    // zod 4 rechaza claves ausentes antes del transform: se completan con "" para que
    // cada columna aplique su propia regla (obligatoria o no).
    const completar = (datos: unknown) => ({
      ...Object.fromEntries(columnas.map((c) => [c.nombre, ""])),
      ...(datos as Record<string, unknown>),
    });
    // Reglas entre columnas (min_de), como en validar_datos.py.
    const conReglas = z.object(forma).superRefine((datos, ctx) => {
      for (const c of columnas.filter((x) => x.min_de)) {
        const v = datos[c.nombre];
        const otra = datos[c.min_de!];
        if (typeof v === "number" && typeof otra === "number" && v < otra) {
          ctx.addIssue({ code: "custom", message: mensaje("min_de", { columna: c.nombre, valor: String(v), otra: c.min_de! }) });
        }
      }
      // 008 · RF-09: texto sin URL solo en el segmento indicado (como en validar_datos.py y SQL).
      for (const c of columnas.filter(segunSegmento)) {
        const v = datos[c.nombre];
        if (typeof v !== "string" || v === "" || sonUrls(v)) continue;
        const segmentos = segmentosDe(colSegmentos!, separarLista(String(datos[colSegmentos!.nombre] ?? ""), colSegmentos!.separador));
        const segmento = segmentos.length === 1 ? segmentos[0] : colSegmentos!.segmento_por_defecto;
        if (segmento !== c.texto_si_segmento) ctx.addIssue({ code: "custom", message: mensaje("urls", { columna: c.nombre }) });
      }
    });
    cache.set(nombre, z.preprocess(completar, conReglas) as unknown as z.ZodType<Record<string, unknown>>);
  }
  return cache.get(nombre)!;
}

export function validar(nombre: NombreEsquema, datos: Record<string, unknown>) {
  const r = esquemaDe(nombre).safeParse(datos);
  return r.success
    ? { datos: r.data, errores: [] as string[] }
    : { datos: null, errores: r.error.issues.map((i) => i.message) };
}
