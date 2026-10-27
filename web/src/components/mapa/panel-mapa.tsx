"use client";

// Pestañas del mapa de /mapa (spec 007, RF-16 a RF-18): «Gran escala» muestra el mapa
// interactivo; «Detrás del medidor» es un aviso mientras se preparan los datos, sin puntos.
import { useId, useState } from "react";
import { House } from "lucide-react";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { Pestanas } from "../graficas/pestanas";
import { MapaDiferido } from "./mapa-diferido";

const OPCIONES = [
  { id: "gran-escala", texto: "Gran escala" },
  { id: "detras-medidor", texto: "Detrás del medidor" },
];

export function PanelMapa({
  proyectos,
  seleccionado,
  onSeleccionar,
}: {
  proyectos: ProyectoMapa[];
  seleccionado: string | null;
  onSeleccionar: (nombre: string | null) => void;
}) {
  const idPanel = useId();
  const [activa, setActiva] = useState(OPCIONES[0].id);
  const texto = OPCIONES.find((o) => o.id === activa)!.texto;

  return (
    <section aria-label="Mapa" className="grid gap-3">
      <Pestanas etiqueta="Tipo de almacenamiento" opciones={OPCIONES} activa={activa} onCambiar={setActiva} idPanel={idPanel} />
      <div id={idPanel} role="tabpanel" aria-label={texto}>
        {activa === "gran-escala" ? (
          <MapaDiferido proyectos={proyectos} seleccionado={seleccionado} onSeleccionar={onSeleccionar} />
        ) : (
          <div className="grid h-[60vh] min-h-80 place-items-center rounded-[var(--radius-lg)] border border-border bg-[var(--surface-alt)] p-6">
            <div className="grid max-w-md justify-items-center gap-3 text-center">
              <House aria-hidden className="size-10 text-[var(--text-heading)]" />
              <h3 className="text-lg font-bold text-[var(--text-heading)]">Sección en construcción</h3>
              <p className="text-sm">
                Aquí se publicarán los sistemas de baterías instalados en usuarios (industria, comercio y hogares),
                detrás del medidor. Los datos están en preparación.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
