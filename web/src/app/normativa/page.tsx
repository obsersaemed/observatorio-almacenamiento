import type { Metadata } from "next";
import { SeccionEnConstruccion } from "@/components/seccion-en-construccion";

export const metadata: Metadata = {
  title: "Evolución normativa",
  description: "Línea de tiempo de la regulación del almacenamiento en Colombia (CREG, MME, CNO), condensada y explicada.",
};

export default function Normativa() {
  return <SeccionEnConstruccion titulo="Evolución normativa" descripcion={metadata.description as string} descarga="/datos/normativa.csv" />;
}
