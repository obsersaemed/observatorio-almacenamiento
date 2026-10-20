import type { Metadata } from "next";
import { SeccionEnConstruccion } from "@/components/seccion-en-construccion";

export const metadata: Metadata = {
  title: "Noticias",
  description: "Noticias curadas sobre el almacenamiento de energía con baterías en Colombia, con fuente y fecha.",
};

export default function Noticias() {
  return <SeccionEnConstruccion titulo="Noticias" descripcion={metadata.description as string} descarga="/datos/noticias.csv" />;
}
