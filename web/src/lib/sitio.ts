// Dirección pública del sitio (metadatos, robots y sitemap). En Vercel se define
// NEXT_PUBLIC_SITIO_URL; en desarrollo se usa localhost.
export const URL_SITIO = new URL(process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000");

export const RUTAS_PUBLICAS = ["/", "/mapa", "/vehiculos", "/normativa", "/noticias", "/aportar"];
