import type { MetadataRoute } from "next";
import { URL_SITIO } from "@/lib/sitio";

// RNF-09: el sitio público es indexable; el área de editores y las descargas no.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/datos/"] },
    sitemap: new URL("/sitemap.xml", URL_SITIO).toString(),
  };
}
