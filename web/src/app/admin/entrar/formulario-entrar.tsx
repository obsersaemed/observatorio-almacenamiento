"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoEnlace } from "@/lib/acceso";

type Accion = (anterior: ResultadoEnlace | null, datos: FormData) => Promise<ResultadoEnlace>;

export function FormularioEntrar({ accion }: { accion: Accion }) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  if (resultado?.ok) {
    return (
      <p role="status" className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        {resultado.mensaje}
      </p>
    );
  }
  return (
    <form action={enviar} className="grid max-w-md gap-4">
      {resultado && !resultado.ok && (
        <p role="alert" className="text-destructive">
          {resultado.error}
        </p>
      )}
      <label className="block font-semibold text-[var(--text-heading)]">
        Correo de editor
        <input
          name="correo"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-[var(--radius-md)] border border-input bg-card px-3 py-2 font-normal"
        />
      </label>
      <Button type="submit" size="lg" disabled={enviando} className="justify-self-start">
        {enviando ? "Enviando…" : "Recibir enlace de acceso"}
      </Button>
    </form>
  );
}
