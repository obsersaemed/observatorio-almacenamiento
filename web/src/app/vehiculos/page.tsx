import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaVehiculos } from "@/components/vehiculos/vista-vehiculos";
import { vehiculosPublicos } from "@/lib/datos-publicos";

export const metadata: Metadata = {
  title: "Vehículos eléctricos",
  description: "Vehículos eléctricos vendidos en Colombia y la energía que pueden almacenar sus baterías, por marca, línea y tipo de batería.",
};

async function VistaConDatos() {
  const { lineas, ventas, importacion } = await vehiculosPublicos();
  return <VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />;
}

export default function Vehiculos() {
  return (
    <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-6 px-4 py-8">
      <header className="grid gap-2">
        <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">Vehículos eléctricos</h1>
        <p className="max-w-3xl">
          Las baterías de los vehículos eléctricos vendidos en Colombia también son almacenamiento de
          energía. Aquí está cuántos hay, cuánta energía pueden guardar y de qué tecnología son, por
          marca, línea y tipo de batería.
        </p>
      </header>
      <Suspense fallback={<p role="status">Cargando los datos de vehículos…</p>}>
        <VistaConDatos />
      </Suspense>
    </main>
  );
}
