// CSV de datos publicados (RF-14). Columnas = esquema de datos/esquemas.json (sin
// columnas internas ni correos), solo registros aprobados, licencia CC BY 4.0 en la
// primera línea y marca UTF-8 para que Excel lea bien las tildes. Punto decimal.
import definicion from "@/generado/esquemas.json";
import { columnaSql } from "./decision";

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
