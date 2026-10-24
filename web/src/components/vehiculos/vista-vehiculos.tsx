"use client";

// Vista de /vehiculos (spec 003). Los filtros viven en la URL y un solo resultado filtrado
// alimenta los KPI, la tabla de tecnología, las gráficas y la descarga.
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { csvVehiculos } from "@/lib/csv";
import { descargarTexto, useFiltrosUrl } from "@/lib/use-filtros-url";
import { armarLineas, CAMPOS_VEHICULOS, filtrar, type FilaLinea, type FilaVenta, type Importacion } from "@/lib/vehiculos";
import { FiltrosVehiculos } from "./filtros-vehiculos";
import { GraficasVehiculosDiferidas } from "./graficas-vehiculos-diferidas";
import { Creditos, KpiVehiculos, TablaTecnologia } from "./resumen-vehiculos";

export function VistaVehiculos({ lineas, ventas, importacion }: { lineas: FilaLinea[]; ventas: FilaVenta[]; importacion: Importacion }) {
  const { consulta, filtros, escribir } = useFiltrosUrl(CAMPOS_VEHICULOS);
  const todas = useMemo(() => armarLineas(lineas, ventas), [lineas, ventas]);
  const resultado = useMemo(() => filtrar(todas, filtros), [todas, filtros]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <FiltrosVehiculos lineas={todas} filtros={filtros} onCambiar={escribir} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => escribir({})} disabled={!consulta}>
            Limpiar filtros
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => descargarTexto(csvVehiculos(resultado, importacion), "observatorio-vehiculos-filtrados.csv")}
          >
            Descargar CSV
          </Button>
        </div>
        <Creditos importacion={importacion} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <KpiVehiculos lineas={resultado} />
        <TablaTecnologia lineas={resultado} />
      </div>
      <GraficasVehiculosDiferidas lineas={resultado} corte={importacion?.corte ?? null} />
    </div>
  );
}
