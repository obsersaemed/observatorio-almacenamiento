import type { Metadata } from "next";
import { TEXTOS } from "@/lib/textos";
import { SeccionEnConstruccion } from "@/components/seccion-en-construccion";

export const metadata: Metadata = {
  title: TEXTOS.normativa.titulo,
  description: TEXTOS.normativa.intro,
};

export default function Normativa() {
  return <SeccionEnConstruccion titulo={TEXTOS.normativa.titulo} descripcion={metadata.description as string} descarga="/datos/normativa.csv" />;
}
