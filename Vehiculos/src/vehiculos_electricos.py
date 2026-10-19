"""Extraccion del dataset de vehiculos electricos e hibridos del RUNT 2.0.

Dataset: ntxy-q9ix en datos.gov.co (Ministerio de Transporte / RUNT 2.0).
    https://www.datos.gov.co/Transporte/.../ntxy-q9ix/about_data

Del menu "Exportar" de la pagina, la via correcta es API (SODA de Socrata):
es la misma fuente que alimenta la tabla, sin limite de 1.000 filas del CSV
de la interfaz y sin necesidad de navegador. "Consultar datos" es esa misma
API con $select/$group, que aqui se expone en --agregado.

El dataset esta agregado: cada fila es una combinacion de atributos con su
columna `cantidad`. No hay registros individuales de vehiculo.

Uso:
    python src/vehiculos_electricos.py
    python src/vehiculos_electricos.py --where "departamento='Antioquia'"
    python src/vehiculos_electricos.py --agregado departamento,a_o_registro
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
import requests

import sinks
from runt import BASE, descargar, metadatos

DATASET = "ntxy-q9ix"

# Columnas segun el diccionario del dataset (verificado 2026-09-20).
# Todas llegan como texto desde Socrata; aqui se fija el tipo real.
ENTEROS = ["modelo", "a_o_registro", "cantidad"]
TEXTOS = ["combustible", "clase", "carroceria", "municipio", "departamento"]

RENOMBRES = {"a_o_registro": "anio_registro"}

# Alcance por defecto del observatorio: electricos puros matriculados desde 2024.
# ELECTRICO excluye los hibridos (GASO ELEC, DIES ELEC) y el HIDROGENO. No se
# filtra por clase: entran camionetas, motos, buses y camiones.
DESDE_ANIO = 2024
COMBUSTIBLE = "ELECTRICO"
# La API expone el ano de registro como `a_o_registro` (la tilde se pierde en el
# fieldName). Aceptamos el nombre limpio y lo traducimos al pedir el agregado.
ALIAS_API = {v: k for k, v in RENOMBRES.items()}


def construir_where(desde: int | None, combustible: str | None, extra: str | None) -> str | None:
    """Arma la clausula SoQL juntando el alcance por defecto y el filtro del usuario.

    El ano llega como texto desde la API, asi que se castea a numero: comparar
    '2024' como cadena funciona con anos de 4 digitos pero se rompe en cuanto
    aparezca un valor mal formado.
    """
    partes = []
    if combustible:
        partes.append(f"combustible='{combustible}'")
    if desde is not None:
        partes.append(f"a_o_registro::number >= {desde}")
    if extra:
        partes.append(f"({extra})")
    return " AND ".join(partes) if partes else None


def normalizar(df: pd.DataFrame) -> pd.DataFrame:
    """Tipa las columnas y limpia el texto, sin alterar el nivel de agregacion."""
    df = df.copy()
    for col in ENTEROS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    for col in TEXTOS:
        if col in df.columns:
            df[col] = df[col].astype("string").str.strip().str.upper()

    df = df.rename(columns=RENOMBRES)
    orden = [c for c in ["anio_registro", "departamento", "municipio", "clase",
                         "carroceria", "combustible", "modelo", "cantidad"]
             if c in df.columns]
    return df[orden + [c for c in df.columns if c not in orden]]


def agregado(dimensiones: list[str], where: str | None = None) -> pd.DataFrame:
    """Suma `cantidad` agrupando en el servidor ($select/$group de SoQL).

    Util cuando solo interesa el total por departamento o por anio: evita
    traer las 10.748 filas para sumarlas en local.
    """
    dimensiones = [ALIAS_API.get(d, d) for d in dimensiones]
    dims = ",".join(dimensiones)
    p = {
        "$select": f"{dims},sum(cantidad) as cantidad",
        "$group": dims,
        "$order": dims,
        "$limit": 50000,
    }
    if where:
        p["$where"] = where
    r = requests.get(f"{BASE}/resource/{DATASET}.json", params=p, timeout=300)
    r.raise_for_status()
    return normalizar(pd.DataFrame(r.json()))


def verificar(df: pd.DataFrame, where: str | None = None) -> None:
    """Contrasta el total descargado contra la suma que reporta el servidor."""
    p = {"$select": "sum(cantidad) as total"}
    if where:
        p["$where"] = where
    r = requests.get(f"{BASE}/resource/{DATASET}.json", params=p, timeout=120)
    r.raise_for_status()
    esperado = int(float(r.json()[0]["total"]))
    obtenido = int(df["cantidad"].sum())
    estado = "OK" if esperado == obtenido else "DESCUADRE"
    print(f"  control de suma: {obtenido:,} vs {esperado:,} en servidor -> {estado}")
    if esperado != obtenido:
        print("  AVISO: la descarga quedo incompleta", file=sys.stderr)


def escribir(df: pd.DataFrame, destino: Path, nombre: str, formato: str) -> list[Path]:
    """Guarda el DataFrame en CSV, en Excel o en ambos.

    El CSV va en utf-8-sig: sin ese BOM, Excel abre las tildes como caracteres
    raros (BOGOTA D.C. sale mal). El .xlsx se entrega con el encabezado fijo,
    autofiltro y anchos de columna, que es como se deja usar a mano.
    """
    destino.mkdir(parents=True, exist_ok=True)
    rutas: list[Path] = []

    if formato in ("csv", "ambos"):
        ruta = destino / f"{nombre}.csv"
        df.to_csv(ruta, index=False, encoding="utf-8-sig")
        rutas.append(ruta)

    if formato in ("excel", "ambos"):
        ruta = destino / f"{nombre}.xlsx"
        with pd.ExcelWriter(ruta, engine="openpyxl") as xw:
            df.to_excel(xw, index=False, sheet_name="datos")
            ws = xw.sheets["datos"]
            ws.freeze_panes = "A2"
            ws.auto_filter.ref = ws.dimensions
            for i, col in enumerate(df.columns, start=1):
                ancho = max(len(str(col)), int(df[col].astype(str).str.len().max() or 0))
                ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = min(ancho + 2, 40)
        rutas.append(ruta)

    return rutas


def main() -> int:
    ap = argparse.ArgumentParser(description="Descarga vehiculos electricos e hibridos (RUNT 2.0)")
    ap.add_argument("--where", help="Filtro SoQL adicional, ej. \"departamento='Antioquia'\"")
    ap.add_argument("--desde", type=int, default=DESDE_ANIO,
                    help=f"Ano de registro minimo (por defecto {DESDE_ANIO})")
    ap.add_argument("--combustible", default=COMBUSTIBLE,
                    help=f"Tipo de combustible (por defecto {COMBUSTIBLE})")
    ap.add_argument("--todo", action="store_true",
                    help="Ignora los filtros por defecto y trae el dataset completo")
    ap.add_argument("--agregado", help="Dimensiones separadas por coma; agrupa en el servidor")
    ap.add_argument("--salida", default="data/processed", help="Carpeta de salida")
    ap.add_argument("--formato", choices=["csv", "excel", "ambos"], default="ambos",
                    help="Formato del archivo de salida (por defecto ambos)")
    ap.add_argument("--sheets", action="store_true", help="Ademas del CSV, cargar a Google Sheets")
    ap.add_argument("--sheet-id", help="ID del Google Sheet destino (va en la URL)")
    ap.add_argument("--hoja", help="Pestana destino (por defecto, el nombre del archivo)")
    ap.add_argument("--credenciales", default="config/credentials.json",
                    help="Clave JSON de la cuenta de servicio")
    a = ap.parse_args()

    if a.sheets and not a.sheet_id:
        ap.error("--sheets requiere --sheet-id")

    desde = None if a.todo else a.desde
    combustible = None if a.todo else a.combustible
    where = construir_where(desde, combustible, a.where)

    meta = metadatos(DATASET)
    print(f"{meta['nombre']}")
    print(f"  actualizado: {pd.to_datetime(meta['actualizado'], unit='s'):%Y-%m-%d}")
    print(f"  filtro: {where or 'ninguno (dataset completo)'}")

    if a.agregado:
        dims = [d.strip() for d in a.agregado.split(",") if d.strip()]
        df = agregado(dims, where)
        etiquetas = [RENOMBRES.get(d, d) for d in dims]
        nombre = f"runt_{DATASET}_por_{'_'.join(etiquetas)}"
    else:
        df = normalizar(descargar(DATASET, where=where))
        nombre = f"runt_{DATASET}"
        verificar(df, where)

    if df.empty:
        print("Sin datos para ese filtro.")
        return 1

    if not a.todo:
        nombre += f"_{combustible.lower()}_desde{desde}"
    rutas = escribir(df, Path(a.salida), nombre, a.formato)
    print(f"{len(df):,} filas x {len(df.columns)} columnas")
    for r in rutas:
        print(f"  escrito: {r}")
    total = int(df["cantidad"].sum())
    print(f"  total de vehiculos: {total:,}")

    if a.sheets:
        hoja = a.hoja or ("detalle" if not a.agregado else nombre.split("_por_")[-1])
        try:
            n = sinks.reemplazar_hoja(df, sheet_id=a.sheet_id, hoja=hoja,
                                      credenciales=a.credenciales)
        except FileNotFoundError as e:
            # El CSV ya quedo escrito; solo fallo la carga a Sheets.
            print(f"Google Sheets no configurado: {e}", file=sys.stderr)
            return 2
        print(f"Google Sheets: {n:,} filas en la pestana '{hoja}'")
        sinks.marcar_actualizacion(
            sheet_id=a.sheet_id,
            credenciales=a.credenciales,
            dataset=DATASET,
            fuente_actualizada=f"{pd.to_datetime(meta['actualizado'], unit='s'):%Y-%m-%d}",
            filas=n,
            vehiculos=total,
        )
        print("  pestana '_actualizacion' al dia")

    return 0


if __name__ == "__main__":
    sys.exit(main())
