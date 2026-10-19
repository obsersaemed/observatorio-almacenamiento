"""Genera dashboard/datos.js a partir de la hoja VEHICULOS_ELECTRICOS (exportada a CSV).

Uso:
    python src/dashboard_datos.py data/raw/sheet_vehiculos_electricos/<fecha>_VEHICULOS_ELECTRICOS.csv --corte 2026-09-17

El CSV usa ';' como separador y coma decimal (formato de la hoja en espanol). Antes de
escribir, valida que cada fila cuadre consigo misma; si algo no cuadra, se detiene.
"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
DESTINO = RAIZ / "dashboard" / "datos.js"
ANIOS = ["v2024", "v2025", "v2026"]
COLUMNAS = ["linea", "marca", *ANIOS, "total", "tipo_bateria", "cap_min_kwh", "cap_max_kwh",
            "potencia_kw", "prom_cap_kwh", "total_kwh"]


def cargar(ruta: Path) -> pd.DataFrame:
    df = pd.read_csv(ruta, sep=";", decimal=",", encoding="utf-8-sig")
    faltan = set(COLUMNAS) - set(df.columns)
    if faltan:
        sys.exit(f"Faltan columnas en {ruta.name}: {sorted(faltan)}")
    for c in ("linea", "marca", "tipo_bateria"):
        df[c] = df[c].astype(str).str.strip()
    return df[COLUMNAS]


def validar(df: pd.DataFrame) -> list[str]:
    """Comprobaciones de coherencia interna de la hoja. Devuelve los errores encontrados."""
    errores = []
    suma = df[ANIOS].sum(axis=1)
    for _, r in df[suma != df["total"]].iterrows():
        errores.append(f"{r.marca} {r.linea}: total {r.total} != suma de anos {r[ANIOS].sum()}")
    calc = df["total"] * df["prom_cap_kwh"]
    for _, r in df[(calc - df["total_kwh"]).abs() > 1].iterrows():
        errores.append(f"{r.marca} {r.linea}: total_kwh {r.total_kwh} != total x capacidad promedio")
    dup = df[df.duplicated(["marca", "linea"], keep=False)]
    for _, r in dup.iterrows():
        errores.append(f"Linea repetida: {r.marca} {r.linea}")
    return errores


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", type=Path)
    ap.add_argument("--corte", default=date.today().isoformat(), help="Fecha de corte de los datos (AAAA-MM-DD)")
    args = ap.parse_args()

    df = cargar(args.csv)
    errores = validar(df)
    if errores:
        print("La hoja no cuadra; no se genera datos.js:")
        print("\n".join(f"  - {e}" for e in errores))
        sys.exit(1)

    filas = [
        {
            "linea": r.linea, "marca": r.marca, "tipo": r.tipo_bateria,
            "anios": {"2024": int(r.v2024), "2025": int(r.v2025), "2026": int(r.v2026)},
            "total": int(r.total),
            "capMin": round(float(r.cap_min_kwh), 2), "capMax": round(float(r.cap_max_kwh), 2),
            "potenciaKw": round(float(r.potencia_kw), 1), "kwh": round(float(r.total_kwh), 2),
        }
        for r in df.itertuples()
    ]
    datos = {
        "corte": args.corte,
        "fuente": "Hoja VEHICULOS_ELECTRICOS (Observatorio TEJ), a partir de registros de ventas por linea",
        "filas": filas,
    }
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    DESTINO.write_text(
        "/* Generado por src/dashboard_datos.py. No editar a mano. */\n"
        f"window.OBS_VE_DATOS = {json.dumps(datos, ensure_ascii=False, indent=1)};\n",
        encoding="utf-8",
    )
    print(f"{len(filas)} lineas, {df['total'].sum():,} vehiculos, {df['total_kwh'].sum():,.0f} kWh -> {DESTINO}")


if __name__ == "__main__":
    main()
