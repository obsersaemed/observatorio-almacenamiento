"""Respaldo diario de los datos publicados a CSV versionados en el repositorio (RF-13).

Lee con la llave pública (solo lo aprobado, como cualquier visitante), así que nunca toca
correos ni la cola de aportes. Todo o nada: si una tabla falla no se reescribe ningún
archivo. Correrlo a diario también mantiene activa la base del plan gratuito (RNF-08).

Uso:
    python scripts/respaldo.py --entorno pruebas            # llaves de web/.env.local
    python scripts/respaldo.py --entorno env                # llaves en variables de entorno (GitHub Actions)
    python scripts/respaldo.py --entorno pruebas --carpeta otra/
"""
import argparse
import csv
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from supabase_rest import ErrorRest, cliente_de_entorno  # noqa: E402
from validar_datos import RAIZ, columna_sql  # noqa: E402

# esquema → (tabla en Supabase, columna para ordenar de forma estable)
TABLAS = {
    "proyectos": ("proyectos", "nombre"),
    "normativa": ("normas", "id"),
    "noticias": ("noticias", "enlace"),
    # Spec 003 (RF-15): vehículos. No tienen estado de publicación; se respalda todo.
    "vehiculos_lineas": ("vehiculos_lineas", "linea"),
    "vehiculos_ventas": ("vehiculos_ventas", "linea,ano"),
}
SIN_PUBLICACION = {"vehiculos_lineas", "vehiculos_ventas"}


def a_csv(columnas, filas):
    salida = io.StringIO()
    escritor = csv.writer(salida, lineterminator="\n")
    escritor.writerow([c["nombre"] for c in columnas])
    for f in filas:
        escritor.writerow(["" if f.get(columna_sql(c["nombre"])) is None else f.get(columna_sql(c["nombre"]))
                           for c in columnas])
    return salida.getvalue()


def respaldar(cliente, esquemas, carpeta):
    """Devuelve (código de salida, mensajes)."""
    contenidos = {}
    try:
        for nombre, (tabla, orden) in TABLAS.items():
            columnas = [c for c in esquemas[nombre]["columnas"] if columna_sql(c["nombre"]) != "publicacion"]
            publicadas = "" if nombre in SIN_PUBLICACION else "&publicacion=eq.Aprobado"
            orden_estable = ",".join(f"{o}.asc" for o in orden.split(","))
            filas = cliente.seleccionar(tabla, f"select=*{publicadas}&order={orden_estable}")
            contenidos[f"{nombre}.csv"] = (a_csv(columnas, filas or []), len(filas or []))
    except ErrorRest as e:
        return 1, [f"ERROR  {e}", "No se reescribió ningún archivo."]

    carpeta = Path(carpeta)
    carpeta.mkdir(parents=True, exist_ok=True)
    for archivo, (texto, _) in contenidos.items():
        (carpeta / archivo).write_text(texto, encoding="utf-8", newline="")
    return 0, [f"{archivo}: {n} registros" for archivo, (_, n) in contenidos.items()]


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--entorno", required=True, help="'pruebas', 'env' o ruta a un archivo .env")
    p.add_argument("--carpeta", default=RAIZ / "respaldo")
    a = p.parse_args()
    esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
    try:
        cliente = cliente_de_entorno(a.entorno, llave="NEXT_PUBLIC_SUPABASE_ANON_KEY")
    except ErrorRest as e:
        print(f"ERROR  {e}")
        sys.exit(2)
    codigo, mensajes = respaldar(cliente, esquemas, a.carpeta)
    print("\n".join(mensajes))
    sys.exit(codigo)


if __name__ == "__main__":
    main()
