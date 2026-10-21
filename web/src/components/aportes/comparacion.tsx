import type { FilaComparacion } from "@/lib/aportes-admin";

// Valor actual frente al propuesto (CA-08.1). Las filas que cambian se resaltan.
export function Comparacion({ filas }: { filas: FilaComparacion[] }) {
  if (!filas.length) return <p className="mt-2 text-muted-foreground">El aporte no trae campos estructurados.</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded-[var(--radius-md)] border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2">Campo</th>
            <th scope="col" className="px-3 py-2">Valor actual</th>
            <th scope="col" className="px-3 py-2">Propuesto</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr
              key={f.campo}
              data-cambia={String(f.cambia)}
              className={f.cambia ? "bg-[var(--surface-tint)] font-semibold" : undefined}
            >
              <th scope="row" className="px-3 py-2 font-medium">{f.etiqueta}</th>
              <td className="px-3 py-2">{f.actual}</td>
              <td className="px-3 py-2">{f.propuesto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
