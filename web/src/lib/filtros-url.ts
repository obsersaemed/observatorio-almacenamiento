// Los filtros de una sección viven en la URL (002 RF-10, 003 RF-02): ?estado=…&departamento=…,
// con el parámetro repetido para varios valores. Abrir la URL reproduce la vista; sin filtros no
// hay consulta. Cada sección pasa su lista de campos (por defecto, los de /mapa).
import { CAMPOS_FILTRO } from "./proyectos-mapa";

type ParametrosNext = Record<string, string | string[] | undefined>;
type FiltrosDe<C extends string> = Partial<Record<C, string[]>>;

export function consultaDeFiltros<C extends string>(
  filtros: FiltrosDe<C>,
  campos: readonly C[] = CAMPOS_FILTRO as unknown as readonly C[],
): string {
  const p = new URLSearchParams();
  for (const campo of campos) for (const v of filtros[campo] ?? []) p.append(campo, v);
  const consulta = p.toString();
  return consulta ? `?${consulta}` : "";
}

export function filtrosDeConsulta<C extends string>(
  parametros: URLSearchParams | ParametrosNext,
  campos: readonly C[] = CAMPOS_FILTRO as unknown as readonly C[],
): FiltrosDe<C> {
  const leer = (campo: C): string[] => {
    if (parametros instanceof URLSearchParams) return parametros.getAll(campo);
    const v = parametros[campo];
    return v === undefined ? [] : Array.isArray(v) ? v : [v];
  };
  const filtros: FiltrosDe<C> = {};
  for (const campo of campos) {
    const valores = leer(campo).map((v) => v.trim()).filter(Boolean);
    if (valores.length) filtros[campo] = valores;
  }
  return filtros;
}
