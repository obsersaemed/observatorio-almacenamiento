"use client";

// Donas de /vehiculos (spec 003): participación de marcas (RF-07) y tecnología de batería
// (RF-08), las dos en número de vehículos.
import { formatoNumero } from "@/lib/formato";
import { porMarca, porTipo, type LineaVehiculo } from "@/lib/vehiculos";
import { Dona } from "../graficas/dona";
import { TarjetaGrafica } from "../graficas/tarjeta-grafica";

const vehiculos = (n: number) => `${formatoNumero(n, 0)} ${n === 1 ? "vehículo" : "vehículos"}`;

export function DonaMarcas({ lineas }: { lineas: LineaVehiculo[] }) {
  const filas = porMarca(lineas).map((m) => ({ categoria: m.marca, valor: m.total, porcentaje: m.porcentaje }));
  const total = filas.reduce((t, f) => t + f.valor, 0);
  return (
    <TarjetaGrafica
      titulo="Participación de marcas en el mercado %"
      tabla={{
        encabezados: ["Marca", "Ventas [vehículos]", "Participación [%]"],
        filas: filas.map((f) => [f.categoria, formatoNumero(f.valor, 0), formatoNumero(f.porcentaje, 1)]),
      }}
      vacia={!lineas.length}
    >
      <Dona filas={filas} centro={vehiculos(total)} etiquetaLista="Marcas" />
    </TarjetaGrafica>
  );
}

export function DonaTecnologia({ lineas }: { lineas: LineaVehiculo[] }) {
  const filas = porTipo(lineas).map((t) => ({ categoria: t.tipo, valor: t.vehiculos, porcentaje: t.porcentaje }));
  const total = filas.reduce((t, f) => t + f.valor, 0);
  return (
    <TarjetaGrafica
      titulo="Tecnología de batería"
      tabla={{
        encabezados: ["Tipo de batería", "Ventas [vehículos]", "Participación [%]"],
        filas: filas.map((f) => [f.categoria, formatoNumero(f.valor, 0), formatoNumero(f.porcentaje, 1)]),
      }}
      vacia={!lineas.length}
    >
      <Dona filas={filas} centro={vehiculos(total)} etiquetaLista="Tipos de batería" />
    </TarjetaGrafica>
  );
}
