import type { ReactNode } from "react";

// Bloque del inicio. Desde el rediseño 007 (RF-11) ya no anima: la única animación del sitio
// es el crecimiento de las barras del inicio. `retraso` se acepta por compatibilidad y no se usa.
export function Aparecer({ children, className }: { children: ReactNode; retraso?: number; className?: string }) {
  return (
    <div data-animado="false" className={className}>
      {children}
    </div>
  );
}
