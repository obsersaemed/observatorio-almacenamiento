"""Importa los vehículos eléctricos (spec 003) desde datos/vehiculos_lineas.csv y
datos/vehiculos_ventas.csv a Supabase.

Uso (solo un editor, con la llave de servicio en web/.env.local; aclaración 4):
    python scripts/importar_vehiculos.py --entorno pruebas --corte 2026-09-17
    python scripts/importar_vehiculos.py --entorno pruebas --corte 2026-09-17 --simular

Todo o nada: si una fila es inválida no se envía nada y se lista cada rechazo con el mismo
mensaje que usan la web y la base. Si todo es válido, la función reemplazar_vehiculos() de la
base reemplaza los datos en una transacción y registra la importación: la fecha de hoy es la
«Última actualización» y --corte es «Ventas hasta» (RF-12).
"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from supabase_rest import ErrorRest, cliente_de_entorno  # noqa: E402
from validar_datos import RAIZ, columna_sql, errores_de_referencias, numero, validar_tabla  # noqa: E402

ESQUEMAS = ("vehiculos_lineas", "vehiculos_ventas")


def a_filas(registros, columnas):
    filas = []
    for r in registros:
        fila = {}
        for c in columnas:
            v = r[c["nombre"]]
            if v == "":
                v = None
            elif c["tipo"] == "entero":
                v = int(v)
            elif c["tipo"] == "numero":
                x = numero(v)
                v = int(x) if x is not None and float(x).is_integer() else x
            fila[columna_sql(c["nombre"])] = v
        filas.append(fila)
    return filas


def error_de_corte(corte):
    try:
        dia = date.fromisoformat(corte)
    except (TypeError, ValueError):
        return f"El corte '{corte}' no es una fecha AAAA-MM-DD"
    if dia > date.today():
        return f"El corte {corte} no puede ser posterior a hoy"
    return None


def importar(carpeta, corte, cliente, esquemas, simular=False):
    """Devuelve (código de salida, mensajes)."""
    problema = error_de_corte(corte)
    if problema:
        return 1, [f"RECHAZO  {problema}"]
    errores, avisos, tablas = [], [], {}
    for nombre in ESQUEMAS:
        esq = esquemas[nombre]
        e, a, regs = validar_tabla(nombre, esq, Path(carpeta) / esq["archivo"], esquemas["_mensajes"])
        errores += e
        avisos += a
        tablas[nombre] = regs
    errores += errores_de_referencias(esquemas, tablas)
    mensajes = [f"AVISO  {a}" for a in avisos]
    if errores:
        return 1, mensajes + [f"RECHAZO  {e}" for e in errores] + [f"{len(errores)} rechazo(s): no se envió nada."]

    lineas = a_filas(tablas["vehiculos_lineas"], esquemas["vehiculos_lineas"]["columnas"])
    ventas = a_filas(tablas["vehiculos_ventas"], esquemas["vehiculos_ventas"]["columnas"])
    unidades = sum(v["unidades"] for v in ventas)
    miles = f"{unidades:,}".replace(",", ".")  # es-CO
    resumen = f"{len(lineas)} {'línea' if len(lineas) == 1 else 'líneas'} y {miles} unidades, ventas hasta el {corte}"
    if simular:
        return 0, mensajes + [f"Simulación: {resumen}. Todo es válido; no se envió nada."]
    try:
        cliente.rpc("reemplazar_vehiculos", {"p_lineas": lineas, "p_ventas": ventas, "p_corte": corte})
    except ErrorRest as e:
        return 1, mensajes + [f"ERROR  {e}", "La base rechazó la importación: no cambió nada."]
    return 0, mensajes + [f"Importados {resumen}."]


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--entorno", required=True, choices=["pruebas", "produccion"])
    p.add_argument("--corte", required=True, help="fecha de corte de la hoja (AAAA-MM-DD)")
    p.add_argument("--carpeta", type=Path, default=RAIZ / "datos")
    p.add_argument("--simular", action="store_true")
    a = p.parse_args()
    esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
    cliente = None if a.simular else cliente_de_entorno(a.entorno)
    codigo, mensajes = importar(a.carpeta, a.corte, cliente, esquemas, a.simular)
    print("\n".join(mensajes))
    sys.exit(codigo)


if __name__ == "__main__":
    main()
