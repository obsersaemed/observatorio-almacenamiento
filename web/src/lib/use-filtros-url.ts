"use client";

// Filtros de una sección guardados en la URL (002 RF-10, 003 RF-02), compartido por /mapa y
// /vehiculos. La consulta es un almacén externo: en el servidor (y al hidratar) no hay filtros;
// en el navegador se lee window.location.search, así el HTML inicial coincide.
import { useEffect, useMemo, useState } from "react";
import { consultaDeFiltros, filtrosDeConsulta } from "./filtros-url";
import { OPCIONES_SEGMENTO, PARAMETRO_SEGMENTO, segmentoDeConsulta } from "./proyectos-mapa";

const CAMBIO_URL = "observatorio:filtros";

function suscribir(avisar: () => void) {
  window.addEventListener("popstate", avisar);
  window.addEventListener(CAMBIO_URL, avisar);
  return () => {
    window.removeEventListener("popstate", avisar);
    window.removeEventListener(CAMBIO_URL, avisar);
  };
}
const leerConsulta = () => window.location.search;

/** Consulta de la URL: "" al renderizar en el servidor y al hidratar (el HTML coincide); después
 *  de montar se lee window.location.search y se sigue cada cambio. 008 · CA-03.2: con
 *  useSyncExternalStore, la vista que llega en streaming dentro del <Suspense> de /mapa se quedaba
 *  con la consulta vacía al abrir un enlace con ?segmento= (visto en el navegador). */
function useConsultaUrl() {
  const [consulta, setConsulta] = useState("");
  useEffect(() => {
    const leer = () => setConsulta(leerConsulta());
    leer();
    return suscribir(leer);
  }, []);
  return consulta;
}

/** Escribe archivos en una descarga del navegador (CSV de la sección). */
export function descargarTexto(texto: string, nombre: string, tipo = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

function escribirConsulta(consulta: string) {
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${consulta}`);
  window.dispatchEvent(new Event(CAMBIO_URL));
}

/** `conservar` (008): parámetros de la URL que no son filtros y se mantienen al filtrar, como
 *  ?segmento= en /mapa. Van antes de los filtros. */
export function useFiltrosUrl<C extends string>(campos?: readonly C[], conservar: readonly string[] = []) {
  const consulta = useConsultaUrl();
  const filtros = useMemo(() => filtrosDeConsulta<C>(new URLSearchParams(consulta), campos), [consulta, campos]);
  const escribir = (nuevos: Partial<Record<C, string[]>>) => {
    const actual = new URLSearchParams(window.location.search);
    const fijos = new URLSearchParams(conservar.flatMap((p) => actual.getAll(p).map((v) => [p, v])));
    const deFiltros = consultaDeFiltros(nuevos, campos).slice(1);
    const todo = [fijos.toString(), deFiltros].filter(Boolean).join("&");
    escribirConsulta(todo ? `?${todo}` : "");
  };
  return { consulta, filtros, escribir };
}

/** 008 (RF-03, RF-04): segmento de /mapa en la URL. Elegir otro segmento borra los filtros; el de
 *  por defecto («Gran escala») no se escribe. */
export function useSegmentoUrl() {
  const consulta = useConsultaUrl();
  const segmento = segmentoDeConsulta(consulta);
  const elegir = (id: string) => {
    escribirConsulta(id === OPCIONES_SEGMENTO[0].id ? "" : `?${new URLSearchParams({ [PARAMETRO_SEGMENTO]: id })}`);
  };
  return { segmento, elegir };
}
