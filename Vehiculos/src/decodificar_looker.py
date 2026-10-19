"""Convierte las respuestas crudas de batchedDataV2 en DataFrames.

Formato observado:
  dataResponse[] -> dataSubset[] -> dataset.tableDataset
      columnInfo: [{ns, name}]      nombres opacos tipo "qt_1jebk9af0d"
      column:     [{stringColumn|longColumn|doubleColumn: {values: [...]}, nullIndex}]
      totalCount: int
Las columnas vienen orientadas por columna (no por fila), asi que hay que transponer.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

PREFIJO = re.compile(r"^\)\]\}'\s*")
TIPOS = ("stringColumn", "longColumn", "doubleColumn", "boolColumn", "bytesColumn")


def cargar_json(ruta: Path) -> dict:
    return json.loads(PREFIJO.sub("", ruta.read_text(encoding="utf-8")))


def _valores(col: dict) -> list:
    """Extrae los valores de una columna reinsertando los nulos en su posicion.

    `values` trae UNICAMENTE los valores no nulos, y `nullIndex` lista las
    posiciones de fila que van vacias. O sea que los nulos se INSERTAN: si se
    sobrescriben, se pierden valores reales y las columnas quedan desalineadas
    contra marca/linea sin que salte ningun error.
    Verificado: valores=649 + nulos=351 = 1000 filas.
    """
    for t in TIPOS:
        if t in col:
            vals = col[t].get("values", [])
            break
    else:
        return []

    nulos = set(col.get("nullIndex", []))
    if not nulos:
        return list(vals)

    total = len(vals) + len(nulos)
    it = iter(vals)
    return [None if i in nulos else next(it, None) for i in range(total)]


def tablas_de(payload: dict) -> list[pd.DataFrame]:
    """Devuelve un DataFrame por cada tableDataset presente en la respuesta."""
    salida: list[pd.DataFrame] = []
    for resp in payload.get("dataResponse", []):
        for sub in resp.get("dataSubset", []):
            td = sub.get("dataset", {}).get("tableDataset")
            if not td:
                continue
            nombres = [c.get("name", f"col_{i}") for i, c in enumerate(td.get("columnInfo", []))]
            columnas = [_valores(c) for c in td.get("column", [])]
            if not columnas:
                continue
            largo = max(len(c) for c in columnas)
            columnas = [c + [None] * (largo - len(c)) for c in columnas]
            nombres = (nombres + [f"col_{i}" for i in range(len(columnas))])[: len(columnas)]
            df = pd.DataFrame(dict(zip(nombres, columnas)))
            df.attrs["totalCount"] = td.get("totalCount")
            salida.append(df)
    return salida


def tablas_de_carpeta(carpeta: Path) -> dict[str, pd.DataFrame]:
    """Decodifica todos los resp_*.txt de una carpeta de captura."""
    resultado: dict[str, pd.DataFrame] = {}
    for ruta in sorted(carpeta.glob("resp_*.txt")):
        for i, df in enumerate(tablas_de(cargar_json(ruta))):
            resultado[f"{ruta.stem}_t{i}"] = df
    return resultado


if __name__ == "__main__":
    import sys

    carpeta = Path(sys.argv[1])
    for nombre, df in tablas_de_carpeta(carpeta).items():
        print(f"\n=== {nombre}  filas={len(df)} totalCount={df.attrs.get('totalCount')}")
        print(f"    columnas: {list(df.columns)}")
        print(df.head(4).to_string(max_colwidth=28))
