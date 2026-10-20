"use client";

// Cifra de un KPI con conteo animado (RF-17). El HTML del servidor ya trae el valor
// final (sirve sin JavaScript); al montarse, si el sistema no pide movimiento reducido,
// cuenta desde cero. Los lectores de pantalla leen solo el valor final.
import { animate } from "motion/react";
import { useEffect, useState } from "react";
import { formatoMW, formatoMWh, formatoNumero } from "@/lib/formato";
import { useMovimientoReducido } from "@/lib/movimiento";

type Unidad = "MW" | "MWh" | null;

const formatear = (valor: number, unidad: Unidad) =>
  unidad === "MW" ? formatoMW(valor) : unidad === "MWh" ? formatoMWh(valor) : formatoNumero(valor);

export function KpiValor({ valor, unidad }: { valor: number; unidad: Unidad }) {
  const reducir = useMovimientoReducido();
  const final = formatear(valor, unidad);
  const [mostrado, setMostrado] = useState(final);

  useEffect(() => {
    if (reducir) return;
    const decimales = unidad ? 1 : 0;
    const control = animate(0, valor, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setMostrado(formatear(Number(v.toFixed(decimales)), unidad)),
    });
    return () => control.stop();
  }, [valor, unidad, reducir]);

  return (
    <>
      <span className="sr-only">{final}</span>
      <span data-testid="kpi-valor" aria-hidden="true" data-animado={reducir ? "false" : "true"}>
        {reducir ? final : mostrado}
      </span>
    </>
  );
}
