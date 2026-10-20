"use client";

// Entrada suave de un bloque (RF-17). Con movimiento reducido se muestra sin animar.
import { motion } from "motion/react";
import { useMovimientoReducido } from "@/lib/movimiento";
import type { ReactNode } from "react";

export function Aparecer({ children, retraso = 0, className }: { children: ReactNode; retraso?: number; className?: string }) {
  const reducir = useMovimientoReducido();
  if (reducir) {
    return (
      <div data-animado="false" className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      data-animado="true"
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: retraso }}
    >
      {children}
    </motion.div>
  );
}
