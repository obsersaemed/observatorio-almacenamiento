"use client";

// Formulario público de aportes (RF-03, RF-06). Valida en el navegador con atributos
// HTML y en el servidor con las reglas compartidas; el resultado llega por useActionState.
import Script from "next/script";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import definicion from "@/generado/esquemas.json";
import type { ResultadoAporte } from "@/lib/aportes";

type Accion = (anterior: ResultadoAporte | null, datos: FormData) => Promise<ResultadoAporte>;

const TIPOS = definicion.aportes.columnas.find((c) => c.nombre === "tipo")?.valores ?? [];

const campo = "mt-1 block w-full rounded-[var(--radius-md)] border border-input bg-card px-3 py-2";
const etiqueta = "block font-semibold text-[var(--text-heading)]";

/** Valores iniciales desde la URL, p. ej. «Proponer corrección» en el mapa (spec 002, RF-06). */
export type InicialAporte = { tipo?: string; registro?: string };

export function FormularioAporte({ accion, siteKey, inicial }: { accion: Accion; siteKey: string; inicial?: InicialAporte }) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const [tipo, setTipo] = useState(inicial?.tipo && TIPOS.includes(inicial.tipo) ? inicial.tipo : (TIPOS[0] ?? ""));

  if (resultado?.ok) {
    return (
      <div role="status" className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <p className="font-bold text-[var(--text-heading)]">¡Gracias! Recibimos tu aporte.</p>
        <p className="mt-2">
          Número de seguimiento: <strong>{resultado.seguimiento}</strong>. Un editor lo revisará
          antes de publicarlo.
        </p>
      </div>
    );
  }

  return (
    <form action={enviar} className="grid max-w-2xl gap-5">
      {resultado && !resultado.ok && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-destructive p-4 text-destructive">
          <p className="font-semibold">Revisa lo siguiente:</p>
          <ul className="mt-1 list-disc pl-5">
            {resultado.errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <label className={etiqueta}>
        Tipo de aporte
        <select name="tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
          {TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>

      {tipo === "Corrección" && (
        <label className={etiqueta}>
          Registro que se corrige
          <input name="registro_afectado" required defaultValue={inicial?.registro} className={campo} placeholder="Nombre del proyecto, id de la norma o enlace de la noticia" />
        </label>
      )}

      <label className={etiqueta}>
        Descripción
        <textarea name="descripcion" required rows={5} className={campo} placeholder="Qué dato aportas o qué debe corregirse" />
      </label>

      <label className={etiqueta}>
        Enlace de la fuente
        <input name="fuente" type="url" required className={campo} placeholder="https://…" />
      </label>

      <label className={etiqueta}>
        Correo de contacto
        <input name="correo" type="email" required autoComplete="email" className={campo} />
        <span className="mt-1 block text-sm font-normal text-muted-foreground">
          Solo lo usamos para pedirte aclaraciones sobre este aporte. No se publica ni se comparte.
        </span>
      </label>

      <div className="cf-turnstile" data-sitekey={siteKey} data-language="es" data-appearance="interaction-only" />
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <Button type="submit" size="lg" disabled={enviando} className="justify-self-start">
        {enviando ? "Enviando…" : "Enviar aporte"}
      </Button>
    </form>
  );
}
