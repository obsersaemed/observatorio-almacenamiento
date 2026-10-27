// Noticias (spec 005): orden de la lista y enlace a la nota original. Lógica pura.

export type Noticia = {
  fecha: string;
  titulo: string;
  medio: string;
  enlace: string;
  resumen: string | null;
  /** Etiquetas separadas por «;». La primera define el tema de la ilustración (spec 007, RF-28). */
  etiquetas: string | null;
};

/** De la más reciente a la más antigua; con la misma fecha, por título (aclaración 1). */
export function ordenarNoticias(noticias: Noticia[]): Noticia[] {
  return [...noticias].sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, "es"));
}

/** La columna `enlace` admite varias URL separadas por espacios: la primera es la nota. */
export const enlacePrincipal = (n: Pick<Noticia, "enlace">) => n.enlace.split(/\s+/).filter(Boolean)[0] ?? "";

/** Temas de las ilustraciones (spec 007, RF-28): lista cerrada más «General» por defecto. */
export const TEMAS = ["Regulación", "Subasta", "Mercado", "Empresas", "Ambiente", "Política pública", "General"] as const;
export type Tema = (typeof TEMAS)[number];

/** Sin mayúsculas ni tildes, para comparar etiquetas escritas a mano. */
const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const EQUIVALENCIAS: Record<string, Tema> = {
  regulacion: "Regulación",
  subasta: "Subasta",
  mercado: "Mercado",
  empresas: "Empresas",
  ambiente: "Ambiente",
  ambiental: "Ambiente",
  "politica publica": "Política pública",
};

/** Tema de una noticia según su primera etiqueta; «General» si no hay o no está en la lista. */
export function temaDe(etiquetas: string | null | undefined): Tema {
  const primera = normalizar((etiquetas ?? "").split(";")[0] ?? "");
  return EQUIVALENCIAS[primera] ?? "General";
}
