"""Punto de entrada: descarga -> parsea -> normaliza -> carga.

Uso:
    python src/main.py --url "https://..." --tabla 0
    python src/main.py --url "https://..." --tabla 0 --sheets
"""
from __future__ import annotations

import argparse
import sys

import fetch
import normalizar
import parse
import sinks


def main() -> int:
    ap = argparse.ArgumentParser(description="Extractor del Observatorio de Vehiculos")
    ap.add_argument("--url", required=True, help="URL de la pagina a extraer")
    ap.add_argument("--tabla", type=int, default=0, help="Indice de la tabla HTML a usar")
    ap.add_argument("--nombre", default="vehiculos", help="Nombre base del archivo de salida")
    ap.add_argument("--sheets", action="store_true", help="Ademas del CSV, cargar a Google Sheets")
    ap.add_argument("--sheet-id", help="ID del Google Sheet destino")
    ap.add_argument("--hoja", default="datos", help="Nombre de la pestana destino")
    args = ap.parse_args()

    html, snapshot = fetch.fetch_con_snapshot(args.url)
    print(f"Snapshot guardado en {snapshot}")

    tablas = parse.extraer_tablas(html)
    print(f"Tablas encontradas: {len(tablas)}")
    if not tablas:
        print("No se hallaron tablas. Hay que usar parse.extraer_por_selector().")
        return 1

    df = tablas[args.tabla]
    df = normalizar.normalizar_columnas(df)
    df = df.apply(lambda s: normalizar.limpiar_texto(s) if s.dtype == "object" else s)
    df = normalizar.agregar_metadatos(df, fuente=args.url)
    print(f"Filas: {len(df)} | Columnas: {list(df.columns)}")

    csv = sinks.a_csv(df, f"{args.nombre}_{df['periodo'].iloc[0]}")
    print(f"CSV escrito en {csv}")

    if args.sheets:
        if not args.sheet_id:
            print("Falta --sheet-id para cargar a Google Sheets.")
            return 1
        n = sinks.a_google_sheets(df, sheet_id=args.sheet_id, hoja=args.hoja)
        print(f"Google Sheets actualizado: {n} filas en '{args.hoja}'")

    return 0


if __name__ == "__main__":
    sys.exit(main())
