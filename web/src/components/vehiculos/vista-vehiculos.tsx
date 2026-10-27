"use client";

// Vista de /vehiculos (spec 003). Los filtros viven en la URL y un solo resultado filtrado
// alimenta los KPI, la tabla de tecnología, las gráficas y la descarga. Spec 007 (RF-20 a
// RF-22): primero las cifras, luego la barra de filtros con los créditos y al final las gráficas.
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { csvVehiculos } from "@/lib/csv";
import { formatoNumero } from "@/lib/formato";
import { descargarTexto, useFiltrosUrl } from "@/lib/use-filtros-url";
import { armarLineas, CAMPOS_VEHICULOS, filtrar, kpiVehiculos, type FilaLinea, type FilaVenta, type Importacion } from "@/lib/vehiculos";
import { FiltrosVehiculos } from "./filtros-vehiculos";
import { GraficasVehiculosDiferidas } from "./graficas-vehiculos-diferidas";
import { Creditos, KpiVehiculos, TablaTecnologia } from "./resumen-vehiculos";

export function VistaVehiculos({ lineas, ventas, importacion }: { lineas: FilaLinea[]; ventas: FilaVenta[]; importacion: Importacion }) {
  const { consulta, filtros, escribir } = useFiltrosUrl(CAMPOS_VEHICULOS);
  const todas = useMemo(() => armarLineas(lineas, ventas), [lineas, ventas]);
  const resultado = useMemo(() => filtrar(todas, filtros), [todas, filtros]);
  const vehiculos = kpiVehiculos(resultado).vehiculos;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <KpiVehiculos lineas={resultado} />
        <TablaTecnologia lineas={resultado} />
      </div>
      <FiltrosVehiculos
        lineas={todas}
        filtros={filtros}
        onCambiar={escribir}
        conteo={`${formatoNumero(vehiculos)} ${vehiculos === 1 ? "vehículo" : "vehículos"}`}
        acciones={
          <>
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
          </>
        }
        pie={<Creditos importacion={importacion} />}
      />
      <GraficasVehiculosDiferidas lineas={resultado} corte={importacion?.corte ?? null} />
    </div>
  );
}
