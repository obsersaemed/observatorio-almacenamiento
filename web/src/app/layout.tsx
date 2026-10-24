import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import { EncabezadoSitio } from "@/components/encabezado-sitio";
import { FondoMapa } from "@/components/fondo-mapa";
import { URL_SITIO } from "@/lib/sitio";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Observatorio de Almacenamiento de Energía",
    template: "%s · Observatorio de Almacenamiento de Energía",
  },
  description: "Implementación, regulación y noticias de los sistemas de almacenamiento de energía con baterías (SAEB) en Colombia.",
  metadataBase: URL_SITIO,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Observatorio de Almacenamiento de Energía",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      className={`${raleway.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <FondoMapa />
        <EncabezadoSitio />
        <div id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
