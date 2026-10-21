// Los filtros de /mapa viven en la URL (RF-10): ?estado=…&departamento=…, con el parámetro
// repetido para varios valores. Abrir la URL reproduce la vista; sin filtros no hay consulta.
import { CAMPOS_FILTRO, type CampoFiltro, type Filtros } from "./proyectos-mapa";

type ParametrosNext = Record<string, string | string[] | undefined>;

export function consultaDeFiltros(filtros: Filtros): string {
  const p = new URLSearchParams();
  for (const campo of CAMPOS_FILTRO) for (const v of filtros[campo] ?? []) p.append(campo, v);
  const consulta = p.toString();
  return consulta ? `?${consulta}` : "";
}

export function filtrosDeConsulta(parametros: URLSearchParams | ParametrosNext): Filtros {
  const leer = (campo: CampoFiltro): string[] => {
    if (parametros instanceof URLSearchParams) return parametros.getAll(campo);
    const v = parametros[campo];
    return v === undefined ? [] : Array.isArray(v) ? v : [v];
  };
  const filtros: Filtros = {};
  for (const campo of CAMPOS_FILTRO) {
    const valores = leer(campo).map((v) => v.trim()).filter(Boolean);
    if (valores.length) filtros[campo] = valores;
  }
  return filtros;
}
