"use client";

// Formularios de decisión del editor (RF-09): ajustar y aprobar, o rechazar con motivo.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoDecision } from "@/lib/decision";

type Accion = (anterior: ResultadoDecision | null, datos: FormData) => Promise<ResultadoDecision>;
export type CampoDecision = { sql: string; etiqueta: string; obligatorio: boolean; valor: string };

const estiloCampo = "mt-1 block w-full rounded-[var(--radius-md)] border border-input bg-card px-3 py-2 font-normal";

function Errores({ resultado }: { resultado: ResultadoDecision | null }) {
  if (!resultado || resultado.ok) return null;
  return (
    <ul role="alert" className="list-disc rounded-[var(--radius-md)] border border-destructive p-3 pl-7 text-destructive">
      {resultado.errores.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

export function Decision({ campos, aprobar, rechazar }: { campos: CampoDecision[]; aprobar: Accion; rechazar: Accion }) {
  const [resAprobar, enviarAprobar, aprobando] = useActionState(aprobar, null);
  const [resRechazar, enviarRechazar, rechazando] = useActionState(rechazar, null);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
      <form action={enviarAprobar} aria-label="Aprobar aporte" className="grid gap-3">
        <h2 className="text-lg font-bold text-[var(--text-heading)]">Ajustar y aprobar</h2>
        <p className="text-sm text-muted-foreground">
          Revisa los valores con la fuente. Lo que apruebes se publica y queda en el historial.
        </p>
        <Errores resultado={resAprobar} />
        <div className="grid gap-3 sm:grid-cols-2">
          {campos.map((c) => (
            <label key={c.sql} className="block text-sm font-semibold text-[var(--text-heading)]">
              {c.etiqueta}
              {c.obligatorio && " *"}
              <input name={`campo:${c.sql}`} defaultValue={c.valor} className={estiloCampo} />
            </label>
          ))}
        </div>
        <Button type="submit" size="lg" disabled={aprobando} className="justify-self-start">
          {aprobando ? "Aprobando…" : "Aprobar y publicar"}
        </Button>
      </form>

      <form action={enviarRechazar} aria-label="Rechazar aporte" className="grid content-start gap-3">
        <h2 className="text-lg font-bold text-[var(--text-heading)]">Rechazar</h2>
        <Errores resultado={resRechazar} />
        <label className="block text-sm font-semibold text-[var(--text-heading)]">
          Motivo (obligatorio)
          <textarea name="motivo" rows={4} className={estiloCampo} />
        </label>
        <Button type="submit" variant="outline" disabled={rechazando} className="justify-self-start">
          {rechazando ? "Rechazando…" : "Rechazar aporte"}
        </Button>
      </form>
    </div>
  );
}
