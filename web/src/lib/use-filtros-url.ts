"use client";

// Filtros de una sección guardados en la URL (002 RF-10, 003 RF-02), compartido por /mapa y
// /vehiculos. La consulta es un almacén externo: en el servidor (y al hidratar) no hay filtros;
// en el navegador se lee window.location.search, así el HTML inicial coincide.
import { useMemo, useSyncExternalStore } from "react";
import { consultaDeFiltros, filtrosDeConsulta } from "./filtros-url";

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

/** Escribe archivos en una descarga del navegador (CSV de la sección). */
export function descargarTexto(texto: string, nombre: string, tipo = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function useFiltrosUrl<C extends string>(campos?: readonly C[]) {
  const consulta = useSyncExternalStore(suscribir, leerConsulta, () => "");
  const filtros = useMemo(() => filtrosDeConsulta<C>(new URLSearchParams(consulta), campos), [consulta, campos]);
  const escribir = (nuevos: Partial<Record<C, string[]>>) => {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${consultaDeFiltros(nuevos, campos)}`);
    window.dispatchEvent(new Event(CAMBIO_URL));
  };
  return { consulta, filtros, escribir };
}
