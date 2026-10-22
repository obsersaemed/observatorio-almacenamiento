// Solo para pruebas: en jsdom el contenedor adaptable de Recharts mide 0 × 0 y no dibuja nada.
// Este reemplazo le da un tamaño fijo al gráfico hijo.
import { cloneElement, isValidElement, type ReactNode } from "react";

export async function rechartsConTamano(original: () => Promise<Record<string, unknown>>) {
  const r = await original();
  return {
    ...r,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      isValidElement(children) ? cloneElement(children as React.ReactElement<{ width: number; height: number }>, { width: 500, height: 300 }) : null,
  };
}

export function preferirMovimientoReducido(reducido: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reducido && q.includes("reduce"),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}
