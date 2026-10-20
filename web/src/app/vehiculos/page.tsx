import type { Metadata } from "next";
import { SeccionEnConstruccion } from "@/components/seccion-en-construccion";

export const metadata: Metadata = {
  title: "Vehículos eléctricos",
  description: "Evolución de la flota de vehículos eléctricos en Colombia y la capacidad de almacenamiento en sus baterías.",
};

export default function Vehiculos() {
  return <SeccionEnConstruccion titulo="Vehículos eléctricos" descripcion={metadata.description as string} />;
}
