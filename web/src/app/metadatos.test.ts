// T16 · RNF-09: páginas compartibles e indexables; /admin fuera de buscadores.
import { describe, expect, test, vi } from "vitest";

// next/font no funciona fuera de Next; para leer los metadatos del layout basta un sustituto.
vi.mock("next/font/google", () => ({ Raleway: () => ({ variable: "fuente-raleway" }) }));

import { metadata } from "./layout";
import robots from "./robots";
import sitemap from "./sitemap";

describe("metadatos del sitio", () => {
  test("título por defecto, plantilla y descripción", () => {
    const titulo = metadata.title as { default: string; template: string };
    expect(titulo.default).toBe("Observatorio de Almacenamiento de Energía");
    expect(titulo.template).toContain("%s");
    expect(String(metadata.description).length).toBeGreaterThan(40);
  });

  test("Open Graph en español de Colombia para compartir", () => {
    expect(metadata.openGraph).toMatchObject({
      locale: "es_CO",
      siteName: "Observatorio de Almacenamiento de Energía",
      type: "website",
    });
    expect(metadata.metadataBase).toBeInstanceOf(URL);
  });
});

describe("robots.txt", () => {
  test("permite el sitio público, excluye /admin y anuncia el sitemap", () => {
    const r = robots();
    const regla = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(regla.allow).toBe("/");
    expect(regla.disallow).toContain("/admin");
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});

describe("sitemap.xml", () => {
  test("lista las páginas públicas y ninguna de /admin", () => {
    const rutas = sitemap().map((e) => new URL(e.url).pathname);
    for (const ruta of ["/", "/mapa", "/vehiculos", "/normativa", "/noticias", "/aportar"]) {
      expect(rutas).toContain(ruta);
    }
    expect(rutas.some((r) => r.startsWith("/admin"))).toBe(false);
  });
});
