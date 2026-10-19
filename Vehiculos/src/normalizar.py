"""Limpieza y tipado de las filas crudas, mas la clave de idempotencia."""
from __future__ import annotations

import hashlib
import re
from datetime import date

import pandas as pd


def trimestre_de(fecha: date | None = None) -> str:
    """Devuelve el periodo en formato 2026-Q3."""
    fecha = fecha or date.today()
    return f"{fecha.year}-Q{(fecha.month - 1) // 3 + 1}"


def limpiar_texto(serie: pd.Series) -> pd.Series:
    return (
        serie.astype("string")
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
        .replace({"": pd.NA})
    )


def a_numero(serie: pd.Series) -> pd.Series:
    """Convierte numeros en formato colombiano (1.234.567,89) a float."""
    limpio = (
        serie.astype("string")
        .str.replace(r"[^\d,.\-]", "", regex=True)
        .str.replace(".", "", regex=False)
        .str.replace(",", ".", regex=False)
    )
    return pd.to_numeric(limpio, errors="coerce")


def normalizar_columnas(df: pd.DataFrame) -> pd.DataFrame:
    """Pasa los encabezados a snake_case sin tildes."""
    tildes = str.maketrans("áéíóúñÁÉÍÓÚÑ", "aeiounAEIOUN")
    df = df.copy()
    df.columns = [
        re.sub(r"[^a-z0-9]+", "_", str(c).translate(tildes).lower()).strip("_")
        for c in df.columns
    ]
    return df


def agregar_metadatos(df: pd.DataFrame, *, fuente: str, periodo: str | None = None) -> pd.DataFrame:
    """Anade periodo, fuente, fecha de extraccion y una clave estable por fila.

    La clave permite que reejecutar un trimestre reemplace filas en vez de
    duplicarlas al cargar en Sheets.
    """
    df = df.copy()
    df["periodo"] = periodo or trimestre_de()
    df["fuente"] = fuente
    df["extraido_en"] = date.today().isoformat()

    columnas_dato = [c for c in df.columns if c not in {"extraido_en"}]
    df["id_fila"] = [
        hashlib.sha256("|".join(map(str, fila)).encode("utf-8")).hexdigest()[:16]
        for fila in df[columnas_dato].itertuples(index=False)
    ]
    return df
