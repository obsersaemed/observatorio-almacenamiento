import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaVehiculos } from "@/components/vehiculos/vista-vehiculos";
import { vehiculosPublicos } from "@/lib/datos-publicos";
import { TEXTOS } from "@/lib/textos";

export const metadata: Metadata = {
  title: TEXTOS.vehiculos.titulo,
  description: TEXTOS.vehiculos.intro,
};

async function VistaConDatos() {
  const { lineas, ventas, importacion } = await vehiculosPublicos();
  return <VistaVehiculos lineas={lineas} ventas={ventas} importacion={importacion} />;
}

export default function Vehiculos() {
  return (
    <main className="mx-auto grid w-full max-w-[var(--page-max)] gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--text-heading)] sm:text-3xl">{TEXTOS.vehiculos.titulo}</h1>
      <Suspense fallback={<p role="status">Cargando los datos de vehículos…</p>}>
        <VistaConDatos />
      </Suspense>
      {/* RF-03: la introducción va al final, antes del pie. */}
      <p className="max-w-3xl">{TEXTOS.vehiculos.intro}</p>
    </main>
  );
}
