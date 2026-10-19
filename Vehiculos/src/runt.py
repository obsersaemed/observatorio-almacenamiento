"""Descarga de datasets del RUNT publicados en datos.gov.co (API Socrata).

A diferencia de ANDEMOS, aqui no hay scraping: es una API publica con licencia
abierta. La unica complicacion real es la paginacion, porque Socrata devuelve
como maximo 1.000 filas por peticion si no se le pide otra cosa.

Uso:
    python src/runt.py --dataset u3vn-bdcy
    python src/runt.py --dataset u3vn-bdcy --where "nombre_departamento='ANTIOQUIA'"
    python src/runt.py --listar
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import pandas as pd
import requests

BASE = "https://www.datos.gov.co"
CATALOGO = "https://api.us.socrata.com/api/catalog/v1"
# Sin $limit la API devuelve solo 1.000 filas (verificado 2026-09-20). Con $limit
# se piden lotes grandes: SODA 2.0 admite hasta 50.000 y SODA 2.1 no tiene tope.
# 50.000 es el valor seguro en ambas versiones.
PAGINA = 50000
LIMITE_DURO = 5_000_000  # freno de mano: evita bajar un dataset enorme por error

# Datasets del RUNT verificados el 2026-09-19
CONOCIDOS = {
    "u3vn-bdcy": "Crecimiento del parque automotor RUNT 2.0 (nacional, mensual)",
    "ntxy-q9ix": "Vehiculos electricos e hibridos matriculados (nacional)",
    "epfm-5fhb": "Actores RUNT por municipio y departamento",
    "6jmc-vaxk": "Vehiculos involucrados en accidentes de transito",
}


def metadatos(dataset: str) -> dict:
    r = requests.get(f"{BASE}/api/views/{dataset}.json", timeout=60)
    r.raise_for_status()
    d = r.json()
    return {
        "id": dataset,
        "nombre": d.get("name"),
        "actualizado": d.get("rowsUpdatedAt"),
        "columnas": [c["fieldName"] for c in d.get("columns", [])],
    }


def contar(dataset: str, where: str | None = None) -> int:
    p = {"$select": "count(*)"}
    if where:
        p["$where"] = where
    r = requests.get(f"{BASE}/resource/{dataset}.json", params=p, timeout=120)
    r.raise_for_status()
    return int(r.json()[0]["count"])


def descargar(dataset: str, *, where: str | None = None, select: str | None = None) -> pd.DataFrame:
    """Descarga el dataset completo paginando con $limit/$offset.

    Se ordena por :id (columna interna de Socrata) porque sin un orden estable
    la paginacion puede repetir u omitir filas entre peticiones.
    """
    total = contar(dataset, where)
    print(f"  {dataset}: {total:,} filas a descargar")
    partes: list[pd.DataFrame] = []
    offset = 0
    while True:
        p = {"$limit": PAGINA, "$offset": offset, "$order": ":id"}
        if where:
            p["$where"] = where
        if select:
            p["$select"] = select
        r = requests.get(f"{BASE}/resource/{dataset}.json", params=p, timeout=300)
        r.raise_for_status()
        lote = r.json()
        if not lote:
            break  # pagina vacia: unica senal fiable de fin de datos
        partes.append(pd.DataFrame(lote))
        offset += len(lote)
        print(f"    {offset:,}/{total:,}")
        if offset >= LIMITE_DURO:
            print(f"  AVISO: se corto en {LIMITE_DURO:,} filas; acota con --where",
                  file=sys.stderr)
            break
        time.sleep(0.2)  # cortesia con el servidor

    df = pd.concat(partes, ignore_index=True) if partes else pd.DataFrame()

    # El conteo se tomo antes de paginar. Si la fuente publico filas mientras
    # descargabamos, llegan mas de las esperadas y el dato sigue siendo valido;
    # si llegan menos, la descarga quedo corta.
    if len(df) < total:
        print(f"  AVISO: se esperaban {total:,} filas y llegaron {len(df):,}", file=sys.stderr)
    elif len(df) > total:
        print(f"  nota: la fuente crecio durante la descarga ({total:,} -> {len(df):,})")
    return df


def main() -> int:
    ap = argparse.ArgumentParser(description="Descarga datasets del RUNT desde datos.gov.co")
    ap.add_argument("--dataset", help="Identificador Socrata, ej. u3vn-bdcy")
    ap.add_argument("--where", help="Filtro SoQL, ej. \"nombre_departamento='ANTIOQUIA'\"")
    ap.add_argument("--listar", action="store_true", help="Listar datasets RUNT del catalogo")
    ap.add_argument("--salida", default="data/processed", help="Carpeta de salida")
    a = ap.parse_args()

    if a.listar:
        r = requests.get(CATALOGO, params={"domains": "www.datos.gov.co", "q": "RUNT", "limit": 40}, timeout=60)
        r.raise_for_status()
        for res in r.json()["results"]:
            x = res["resource"]
            marca = " [verificado]" if x["id"] in CONOCIDOS else ""
            print(f"{x['id']}  {x.get('updatedAt','')[:10]}  {x['name'][:70]}{marca}")
        return 0

    if not a.dataset:
        ap.error("indica --dataset o --listar")

    meta = metadatos(a.dataset)
    print(f"{meta['nombre']}\n  columnas: {meta['columnas']}")

    df = descargar(a.dataset, where=a.where)
    if df.empty:
        print("Sin datos.")
        return 1

    destino = Path(a.salida)
    destino.mkdir(parents=True, exist_ok=True)
    ruta = destino / f"runt_{a.dataset}.csv"
    df.to_csv(ruta, index=False, encoding="utf-8-sig")
    print(f"Escrito: {ruta}  ({len(df):,} filas x {len(df.columns)} columnas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
