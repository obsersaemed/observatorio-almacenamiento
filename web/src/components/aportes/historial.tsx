import Link from "next/link";
import { formatoFecha } from "@/lib/formato";
import { cambiosDe, type FilaHistorial } from "@/lib/historial";

const OPERACION = { INSERT: "Alta", UPDATE: "Cambio", DELETE: "Baja" } as const;

const dominio = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// Historial de cambios (CA-11.1): fecha, registro, qué cambió, editor, aporte y fuente.
export function TablaHistorial({ filas }: { filas: FilaHistorial[] }) {
  if (!filas.length) return <p className="mt-4">No hay cambios registrados.</p>;
  return (
    <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            {["Fecha", "Registro", "Operación", "Cambios", "Editor", "Aporte", "Fuente"].map((t) => (
              <th key={t} scope="col" className="px-3 py-2 font-semibold">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-b border-border align-top last:border-0">
              <td className="px-3 py-2">{formatoFecha(f.creado_en.slice(0, 10))}</td>
              <td className="px-3 py-2">
                {f.registro} <span className="text-muted-foreground">({f.tabla})</span>
              </td>
              <td className="px-3 py-2">{OPERACION[f.operacion]}</td>
              <td className="px-3 py-2">
                <ul>
                  {cambiosDe(f).map((c) => (
                    <li key={c.etiqueta}>{`${c.etiqueta}: ${c.antes} → ${c.despues}`}</li>
                  ))}
                </ul>
              </td>
              <td className="px-3 py-2">{f.editor ?? "Importación o sistema"}</td>
              <td className="px-3 py-2">
                {f.aporte_id ? (
                  <Link href={`/admin/${f.aporte_id}`} className="text-[var(--text-link)] underline">
                    {`N.º ${f.aporte_id}`}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2">
                {(f.fuente ?? "").split(/\s+/).filter(Boolean).map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="mr-2 text-[var(--text-link)] underline">
                    {dominio(u)}
                  </a>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
