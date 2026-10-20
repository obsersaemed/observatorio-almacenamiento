"use client";

// ¿El sistema pide movimiento reducido? A diferencia de useReducedMotion de Motion, que
// guarda la primera lectura, este hook escucha los cambios de la preferencia en vivo.
import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function suscribir(avisar: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener?.("change", avisar);
  return () => mq.removeEventListener?.("change", avisar);
}

const leer = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(CONSULTA).matches : false);

export function useMovimientoReducido(): boolean {
  // En el servidor se asume "reducido": el HTML inicial nunca depende de una animación.
  return useSyncExternalStore(suscribir, leer, () => true);
}
