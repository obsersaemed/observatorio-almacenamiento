// Descarga CSV de los datos publicados de una sección (RF-14): /datos/proyectos.csv,
// /datos/normativa.csv y /datos/noticias.csv. Solo lectura pública (RLS: solo aprobados).
import { csvDe, seccionDescargable, TABLA_DE_SECCION } from "@/lib/csv";
import { filasPublicadas } from "@/lib/datos-publicos";

export async function GET(_peticion: Request, { params }: { params: Promise<{ seccion: string }> }) {
  const seccion = seccionDescargable((await params).seccion);
  if (!seccion) return new Response("No existe esa descarga.", { status: 404 });
  const csv = csvDe(seccion, await filasPublicadas(TABLA_DE_SECCION[seccion]));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="observatorio-${seccion}.csv"`,
      Link: '<https://creativecommons.org/licenses/by/4.0/>; rel="license"',
    },
  });
}

export function generateStaticParams() {
  return ["proyectos.csv", "normativa.csv", "noticias.csv"].map((seccion) => ({ seccion }));
}
