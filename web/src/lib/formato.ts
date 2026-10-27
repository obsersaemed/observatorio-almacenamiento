// Formato de cifras y fechas en español de Colombia: coma decimal, punto de miles,
// fechas dd/mm/aaaa. Un valor ausente o inválido se muestra como "—".
const VACIO = "—";

export function formatoNumero(valor: number | null | undefined, decimales = 0): string {
  if (valor == null || !Number.isFinite(valor)) return VACIO;
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    useGrouping: "always",
  }).format(valor);
}

const conUnidad = (unidad: string) => (valor: number | null | undefined) => {
  const numero = formatoNumero(valor, 1);
  return numero === VACIO ? VACIO : `${numero} ${unidad}`;
};

export const formatoMW = conUnidad("MW");
export const formatoMWh = conUnidad("MWh");

/** 008 (RF-05): «Gran escala» en MW/MWh; «Detrás del medidor» en kW/kWh. Los datos siempre
 *  están en MW y MWh; en kW se multiplican por 1000. */
export type Unidades = "MW" | "kW";
export const factorDe = (unidades: Unidades) => (unidades === "kW" ? 1000 : 1);
export const unidadEnergia = (unidades: Unidades) => `${unidades}h`;
const enUnidades = (valor: number | null | undefined, unidades: Unidades) =>
  valor == null ? valor : valor * factorDe(unidades);

export const formatoPotencia = (mw: number | null | undefined, unidades: Unidades) =>
  conUnidad(unidades)(enUnidades(mw, unidades));
export const formatoEnergia = (mwh: number | null | undefined, unidades: Unidades) =>
  conUnidad(unidadEnergia(unidades))(enUnidades(mwh, unidades));

export function formatoFecha(iso: string | null | undefined): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!partes) return VACIO;
  const [, anio, mes, dia] = partes;
  return `${dia}/${mes}/${anio}`;
}
