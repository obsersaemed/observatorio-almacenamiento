import type { MetadataRoute } from "next";
import { RUTAS_PUBLICAS, URL_SITIO } from "@/lib/sitio";

// RNF-09: páginas públicas para buscadores (nunca /admin).
export default function sitemap(): MetadataRoute.Sitemap {
  return RUTAS_PUBLICAS.map((ruta) => ({ url: new URL(ruta, URL_SITIO).toString() }));
}
