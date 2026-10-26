// Noticias (spec 005): orden de la lista y enlace a la nota original. Lógica pura.

export type Noticia = {
  fecha: string;
  titulo: string;
  medio: string;
  enlace: string;
  resumen: string | null;
};

/** De la más reciente a la más antigua; con la misma fecha, por título (aclaración 1). */
export function ordenarNoticias(noticias: Noticia[]): Noticia[] {
  return [...noticias].sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, "es"));
}

/** La columna `enlace` admite varias URL separadas por espacios: la primera es la nota. */
export const enlacePrincipal = (n: Pick<Noticia, "enlace">) => n.enlace.split(/\s+/).filter(Boolean)[0] ?? "";
