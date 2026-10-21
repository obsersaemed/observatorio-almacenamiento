// Historial de cambios para /admin (RF-11): qué cambió en cada registro, con nombres
// legibles y valores en es-CO.
import { columnasDe, valorEsCo, type TablaPublicable } from "./columnas";

export type FilaHistorial = {
  id: number;
  tabla: string;
  registro: string;
  operacion: "INSERT" | "UPDATE" | "DELETE";
  antes: Record<string, unknown> | null;
  despues: Record<string, unknown> | null;
  fuente: string | null;
  editor: string | null;
  aporte_id: number | null;
  creado_en: string;
};

export type Cambio = { etiqueta: string; antes: string; despues: string };

const TABLAS: TablaPublicable[] = ["proyectos", "normas", "noticias"];

export function cambiosDe(fila: FilaHistorial): Cambio[] {
  if (!TABLAS.includes(fila.tabla as TablaPublicable)) return [];
  const cambios: Cambio[] = [];
  for (const c of columnasDe(fila.tabla as TablaPublicable)) {
    const antes = valorEsCo(c, fila.antes?.[c.sql]);
    const despues = valorEsCo(c, fila.despues?.[c.sql]);
    if (antes !== despues) cambios.push({ etiqueta: c.nombre, antes: antes || "—", despues: despues || "—" });
  }
  return cambios;
}
