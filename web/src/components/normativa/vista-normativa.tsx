"use client";

// Vista de /normativa (spec 004). Los filtros viven en la URL y un solo resultado filtrado
// alimenta el conteo, la barra de años y la línea de tiempo. Sin descargas CSV (RF-11). Los
// estudios van aparte, en «Documentos de referencia» (RF-12).
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { aniosDe, CAMPOS_NORMATIVA, filtrar, ordenar, separar, textoConteo, type Norma } from "@/lib/normativa";
import { useFiltrosUrl } from "@/lib/use-filtros-url";
import { BarraAnios } from "./barra-anios";
import { DocumentosReferencia } from "./documentos-referencia";
import { FiltrosNormativa } from "./filtros-normativa";
import { LineaPuntos } from "./linea-puntos";
import { LineaTiempo } from "./linea-tiempo";

export function VistaNormativa({ normas }: { normas: Norma[] }) {
  const { consulta, filtros, escribir } = useFiltrosUrl(CAMPOS_NORMATIVA);
  const { linea, referencia } = useMemo(() => separar(normas), [normas]);
  const resultado = useMemo(() => ordenar(filtrar(linea, filtros)), [linea, filtros]);
  const [abrir, setAbrir] = useState<string | null>(null);
  const [resaltada, setResaltada] = useState<string | null>(null);

  // Una relacionada que los filtros ocultan: se quitan los filtros y se abre (RF-06).
  const irAOculta = (id: string) => {
    escribir({});
    setAbrir(id);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <FiltrosNormativa
          normas={linea}
          filtros={filtros}
          onCambiar={escribir}
          conteo={textoConteo(resultado.length)}
          acciones={
            <Button type="button" variant="outline" onClick={() => escribir({})} disabled={!consulta}>
              Limpiar filtros
            </Button>
          }
        />
        <BarraAnios anios={aniosDe(resultado)} />
      </div>
      <LineaPuntos normas={resultado} onElegir={setResaltada} />
      <div data-testid="linea-tiempo">
        {resultado.length ? (
          <LineaTiempo normas={resultado} publicadas={linea} onFuera={irAOculta} abrirAlCargar={abrir} resaltada={resaltada} />
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-border bg-card p-4">Ninguna norma cumple estos filtros</p>
        )}
      </div>
      <DocumentosReferencia documentos={referencia} />
    </div>
  );
}
