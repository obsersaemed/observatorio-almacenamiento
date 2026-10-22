// KPI, tabla de participación por tecnología y créditos de /vehiculos (spec 003, RF-03, RF-05,
// RF-11). Vehículos con punto de miles (45.346, no «45.346 mil») y energía en MWh (RNF-04).
import { KpiTarjeta } from "@/components/kpi-tarjeta";
import { KpiValor } from "@/components/kpi-valor";
import { FUENTES_VEHICULOS as FUENTES } from "@/lib/csv";
import { formatoFecha, formatoNumero } from "@/lib/formato";
import { anios, kpiVehiculos, porTipo, type Importacion, type LineaVehiculo } from "@/lib/vehiculos";

export function KpiVehiculos({ lineas }: { lineas: LineaVehiculo[] }) {
  const kpi = kpiVehiculos(lineas);
  const años = anios(lineas);
  const periodo = años.length ? ` · ${años[0]}–${años.at(-1)}` : "";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <KpiTarjeta etiqueta={`Vehículos eléctricos registrados${periodo}`}>
        <KpiValor valor={kpi.vehiculos} unidad={null} />
      </KpiTarjeta>
      <KpiTarjeta etiqueta="Energía almacenada en circulación [MWh]">
        <KpiValor valor={kpi.mwh} unidad="MWh" />
      </KpiTarjeta>
    </div>
  );
}

export function TablaTecnologia({ lineas }: { lineas: LineaVehiculo[] }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <caption className="pb-2 text-left font-bold text-[var(--text-heading)]">Participación por tipo de batería</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-1 text-left font-semibold">Tipo de batería</th>
            <th scope="col" className="py-1 text-right font-semibold">Vehículos [%]</th>
          </tr>
        </thead>
        <tbody>
          {porTipo(lineas).map((t) => (
            <tr key={t.tipo} className="border-b border-border last:border-0">
              <td className="py-1">{t.tipo}</td>
              <td className="py-1 text-right tabular-nums">{`${formatoNumero(t.porcentaje, 1)} %`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Fecha (AAAA-MM-DD) en Colombia de un instante de la base. */
const fechaEnColombia = (instante: string) => new Date(instante).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

export function Creditos({ importacion }: { importacion: Importacion }) {
  const fechas = importacion
    ? ` · Última actualización: ${formatoFecha(fechaEnColombia(importacion.actualizado_en))} · Ventas hasta el ${formatoFecha(importacion.corte)}`
    : "";
  return <p className="text-sm text-muted-foreground">{`${FUENTES}${fechas}`}</p>;
}
