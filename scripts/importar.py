"""Importación inicial de proyectos desde el CSV de la `Base de datos SAEB` a Supabase.

Uso:
    python scripts/importar.py --entorno pruebas                 # datos/proyectos.csv
    python scripts/importar.py --entorno pruebas --csv otro.csv
    python scripts/importar.py --entorno pruebas --simular       # valida sin enviar

Todo o nada: si una sola fila es inválida no se envía ninguna y se lista cada rechazo
con el mismo mensaje que usan la web y la base de datos. Las filas válidas entran como
`Aprobado` (vienen de la base oficial revisada) y se actualizan si el nombre ya existe.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from supabase_rest import ErrorRest, cliente_de_entorno  # noqa: E402
from validar_datos import RAIZ, columna_sql, numero, validar_tabla  # noqa: E402


def a_fila_sql(registro, columnas):
    fila = {}
    for c in columnas:
        v = registro[c["nombre"]]
        if v == "":
            v = None
        elif c["tipo"] == "numero":
            v = numero(v)
        fila[columna_sql(c["nombre"])] = v
    fila["publicacion"] = "Aprobado"
    return fila


def importar(csv, cliente, esquemas, simular=False):
    """Devuelve (código de salida, mensajes)."""
    esquema = esquemas["proyectos"]
    errores, avisos, registros = validar_tabla("proyectos", esquema, Path(csv), esquemas["_mensajes"])
    mensajes = [f"AVISO  {a}" for a in avisos]
    if errores:
        mensajes += [f"RECHAZO  {e}" for e in errores]
        mensajes.append(f"No se importó nada: {len(errores)} errores. Corrige la fuente y vuelve a exportar.")
        return 1, mensajes
    filas = [a_fila_sql(r, esquema["columnas"]) for r in registros]
    if simular:
        return 0, mensajes + [f"Simulación: {len(filas)} proyectos válidos, no se envió nada."]
    try:
        cliente.insertar(esquema["tabla"], filas, conflicto="nombre")
    except ErrorRest as e:
        return 2, mensajes + [f"ERROR  {e}"]
    return 0, mensajes + [f"{len(filas)} proyectos importados como Aprobado."]


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--entorno", required=True, help="'pruebas' o ruta a un archivo .env")
    p.add_argument("--csv", default=RAIZ / "datos" / "proyectos.csv")
    p.add_argument("--simular", action="store_true")
    a = p.parse_args()
    esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
    try:
        cliente = None if a.simular else cliente_de_entorno(a.entorno)
    except ErrorRest as e:
        print(f"ERROR  {e}")
        sys.exit(2)
    codigo, mensajes = importar(a.csv, cliente, esquemas, simular=a.simular)
    print("\n".join(mensajes))
    sys.exit(codigo)


if __name__ == "__main__":
    main()
