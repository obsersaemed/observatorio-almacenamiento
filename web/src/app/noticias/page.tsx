import type { Metadata } from "next";
import { TEXTOS } from "@/lib/textos";
import { SeccionEnConstruccion } from "@/components/seccion-en-construccion";

export const metadata: Metadata = {
  title: TEXTOS.noticias.titulo,
  description: TEXTOS.noticias.intro,
};

export default function Noticias() {
  return <SeccionEnConstruccion titulo={TEXTOS.noticias.titulo} descripcion={metadata.description as string} descarga="/datos/noticias.csv" />;
}
