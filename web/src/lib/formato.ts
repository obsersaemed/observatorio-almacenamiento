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

export function formatoFecha(iso: string | null | undefined): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!partes) return VACIO;
  const [, anio, mes, dia] = partes;
  return `${dia}/${mes}/${anio}`;
}
