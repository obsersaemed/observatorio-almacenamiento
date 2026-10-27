// Cifra de un KPI. Desde el rediseño 007 (RF-11) muestra el valor final desde el primer render,
// sin conteo. Se conserva la copia para lectores de pantalla y la visible con aria-hidden.
import { formatoMW, formatoMWh, formatoNumero } from "@/lib/formato";

type Unidad = "MW" | "MWh" | null;

const formatear = (valor: number, unidad: Unidad) =>
  unidad === "MW" ? formatoMW(valor) : unidad === "MWh" ? formatoMWh(valor) : formatoNumero(valor);

export function KpiValor({ valor, unidad }: { valor: number; unidad: Unidad }) {
  const final = formatear(valor, unidad);
  return (
    <>
      <span className="sr-only">{final}</span>
      <span data-testid="kpi-valor" aria-hidden="true" data-animado="false">
        {final}
      </span>
    </>
  );
}
