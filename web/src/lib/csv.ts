// CSV de datos publicados (RF-14). Columnas = esquema de datos/esquemas.json (sin
// columnas internas ni correos), solo registros aprobados, licencia CC BY 4.0 en la
// primera línea y marca UTF-8 para que Excel lea bien las tildes. Punto decimal.
import definicion from "@/generado/esquemas.json";
import { columnaSql } from "./columnas";
import { anios, type Importacion, type LineaVehiculo } from "./vehiculos";

export const FUENTES_VEHICULOS = "Fuentes: ANDEMOS, RUNT y cálculos propios del Observatorio";

export type SeccionDescargable = "proyectos" | "normativa" | "noticias";

export const LICENCIA =
  "# Observatorio de Almacenamiento de Energía · Datos bajo licencia CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/deed.es). Cita al Observatorio y la fuente de cada registro.";

export const TABLA_DE_SECCION: Record<SeccionDescargable, string> = {
  proyectos: "proyectos",
  normativa: "normas",
  noticias: "noticias",
};

export function seccionDescargable(archivo: string): SeccionDescargable | null {
  const m = /^(proyectos|normativa|noticias)\.csv$/.exec(archivo);
  return m ? (m[1] as SeccionDescargable) : null;
}

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function columnasDeSeccion(seccion: SeccionDescargable) {
  return definicion[seccion].columnas
    .filter((c) => columnaSql(c.nombre) !== "publicacion")
    .map((c) => ({ nombre: c.nombre, sql: columnaSql(c.nombre) }));
}

export function csvDe(seccion: SeccionDescargable, filas: Record<string, unknown>[]): string {
  const columnas = columnasDeSeccion(seccion);
  const lineas = [
    LICENCIA,
    columnas.map((c) => celda(c.nombre)).join(","),
    ...filas
      .filter((f) => f.publicacion === "Aprobado")
      .map((f) => columnas.map((c) => celda(f[c.sql])).join(",")),
  ];
  return `﻿${lineas.join("\r\n")}\r\n`;
}

// CSV de /vehiculos (spec 003, RF-13): una fila por línea filtrada, con sus ventas por año,
// tipo de batería, capacidades y energía; licencia, créditos y fechas en las primeras líneas.
// Punto decimal, como el resto de las descargas.
const enColombia = (instante: string) => new Date(instante).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
const dma = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

export function csvVehiculos(lineas: LineaVehiculo[], importacion: Importacion): string {
  const años = anios(lineas);
  const creditos = importacion
    ? `# ${FUENTES_VEHICULOS} · Última actualización: ${dma(enColombia(importacion.actualizado_en))} · Ventas hasta el ${dma(importacion.corte)}`
    : `# ${FUENTES_VEHICULOS}`;
  const encabezado = [
    "Marca", "Línea", "Tipo de batería", "Capacidad mínima [kWh]", "Capacidad máxima [kWh]", "Potencia [kW]",
    ...años.map((a) => `${a} [vehículos]`), "Total [vehículos]", "Energía [MWh]",
  ];
  const num = (v: number | null) => (v === null ? "" : String(Number(v.toFixed(3))));
  const filas = lineas.map((l) => [
    l.marca, l.linea, l.tipo, num(l.capMin), num(l.capMax), num(l.potencia),
    ...años.map((a) => String(l.porAnio[a] ?? 0)), String(l.unidades), num(l.kwh / 1000),
  ]);
  const cuerpo = [encabezado, ...filas].map((f) => f.map(celda).join(","));
  return `﻿${[LICENCIA, creditos, ...cuerpo].join("\r\n")}\r\n`;
}
