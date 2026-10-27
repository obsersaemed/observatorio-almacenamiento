// Cifra de un KPI. Desde el rediseño 007 (RF-11) muestra el valor final desde el primer render,
// sin conteo. Se conserva la copia para lectores de pantalla y la visible con aria-hidden.
import { formatoEnergia, formatoNumero, formatoPotencia, type Unidades } from "@/lib/formato";

/** `unidad` dice qué es el valor (potencia en MW, energía en MWh o un conteo); `unidades` (008)
 *  cómo se muestra: en MW/MWh o en kW/kWh. */
type Unidad = "MW" | "MWh" | null;

const formatear = (valor: number, unidad: Unidad, unidades: Unidades) =>
  unidad === "MW"
    ? formatoPotencia(valor, unidades)
    : unidad === "MWh"
      ? formatoEnergia(valor, unidades)
      : formatoNumero(valor);

export function KpiValor({ valor, unidad, unidades = "MW" }: { valor: number; unidad: Unidad; unidades?: Unidades }) {
  const final = formatear(valor, unidad, unidades);
  return (
    <>
      <span className="sr-only">{final}</span>
      <span data-testid="kpi-valor" aria-hidden="true" data-animado="false">
        {final}
      </span>
    </>
  );
}
