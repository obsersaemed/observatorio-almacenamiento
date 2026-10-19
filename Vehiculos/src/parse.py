"""Parseo del HTML a filas.

PENDIENTE: los selectores concretos se definen cuando tengamos la URL real.
Por ahora hay dos caminos genericos que cubren la mayoria de portales:
  - extraer_tablas(): para paginas cuyo dato vive en <table>
  - extraer_por_selector(): para listados de tarjetas/divs
"""
from __future__ import annotations

from io import StringIO

import pandas as pd
from bs4 import BeautifulSoup


def sopa(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def extraer_tablas(html: str, *, indice: int | None = None) -> list[pd.DataFrame]:
    """Devuelve las tablas de la pagina como DataFrames.

    Si `indice` se indica, devuelve solo esa tabla (envuelta en lista) para que
    el llamador no tenga que adivinar cuantas hay.
    """
    tablas = pd.read_html(StringIO(html), flavor="lxml")
    if indice is not None:
        return [tablas[indice]]
    return tablas


def extraer_por_selector(html: str, fila_sel: str, campos: dict[str, str]) -> list[dict]:
    """Extrae filas a partir de selectores CSS.

    fila_sel: selector que identifica cada registro (ej. "div.card-vehiculo")
    campos:   {nombre_columna: selector_relativo}
    """
    doc = sopa(html)
    filas: list[dict] = []
    for nodo in doc.select(fila_sel):
        registro = {}
        for columna, sel in campos.items():
            hallado = nodo.select_one(sel)
            registro[columna] = hallado.get_text(strip=True) if hallado else None
        filas.append(registro)
    return filas
