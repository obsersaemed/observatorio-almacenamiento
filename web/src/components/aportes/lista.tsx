import Link from "next/link";
import { formatoFecha } from "@/lib/formato";
import { etiquetaOrigen, type AporteFila } from "@/lib/aportes-admin";

const dominio = (url: string) => {
  try {
    return new URL(url.split(/\s+/)[0]).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function ListaAportes({ aportes }: { aportes: AporteFila[] }) {
  if (!aportes.length) return <p className="mt-4">No hay aportes pendientes de revisión.</p>;
  return (
    <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            {["N.º", "Tipo", "Origen", "Fecha", "Fuente"].map((t) => (
              <th key={t} scope="col" className="px-3 py-2 font-semibold">
                {t}
              </th>
            ))}
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Acción</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {aportes.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2">{a.id}</td>
              <td className="px-3 py-2">{a.tipo}</td>
              <td className="px-3 py-2">{etiquetaOrigen(a)}</td>
              <td className="px-3 py-2">{formatoFecha(a.creado_en.slice(0, 10))}</td>
              <td className="px-3 py-2">
                <a href={a.fuente.split(/\s+/)[0]} target="_blank" rel="noopener noreferrer" className="text-[var(--text-link)] underline">
                  {dominio(a.fuente)}
                </a>
              </td>
              <td className="px-3 py-2 text-right">
                <Link href={`/admin/${a.id}`} className="font-semibold text-[var(--text-link)] underline">
                  Revisar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
