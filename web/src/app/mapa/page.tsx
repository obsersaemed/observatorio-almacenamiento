import type { Metadata } from "next";
import { SeccionEnConstruccion } from "@/components/seccion-en-construccion";

export const metadata: Metadata = {
  title: "Implementación en el país",
  description: "Mapa e inventario de los sistemas de almacenamiento con baterías (SAEB) en Colombia, con filtros por estado, tecnología y ubicación.",
};

export default function Mapa() {
  return <SeccionEnConstruccion titulo="Implementación en el país" descripcion={metadata.description as string} />;
}
