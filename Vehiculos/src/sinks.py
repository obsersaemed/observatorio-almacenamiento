"""Destinos de carga. CSV funciona ya; Sheets se activa cuando definamos auth."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"


def a_csv(df: pd.DataFrame, nombre: str) -> Path:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    destino = PROCESSED_DIR / f"{nombre}.csv"
    df.to_csv(destino, index=False, encoding="utf-8-sig")
    return destino


def a_google_sheets(
    df: pd.DataFrame,
    *,
    sheet_id: str,
    hoja: str,
    credenciales: str = "config/credentials.json",
    modo: str = "upsert",
) -> int:
    """Carga el DataFrame a una hoja de Google Sheets.

    modo="reemplazar": borra la hoja y escribe todo.
    modo="upsert":     conserva filas de otros periodos y reemplaza las del
                       periodo actual (apoyado en las columnas periodo/id_fila).

    Requiere gspread + google-auth (ver requirements.txt) y una cuenta de
    servicio con la hoja compartida a su correo.
    """
    import gspread  # import diferido: el scraping no depende de Sheets
    from google.oauth2.service_account import Credentials

    alcance = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_file(credenciales, scopes=alcance)
    libro = gspread.authorize(creds).open_by_key(sheet_id)

    try:
        ws = libro.worksheet(hoja)
    except gspread.WorksheetNotFound:
        ws = libro.add_worksheet(title=hoja, rows=1000, cols=max(len(df.columns), 10))

    if modo == "upsert":
        existentes = pd.DataFrame(ws.get_all_records())
        if not existentes.empty and "periodo" in existentes.columns:
            periodos_nuevos = set(df["periodo"].unique())
            existentes = existentes[~existentes["periodo"].isin(periodos_nuevos)]
            df = pd.concat([existentes, df], ignore_index=True)

    ws.clear()
    ws.update(
        [df.columns.tolist()] + df.astype(object).where(df.notna(), "").values.tolist()
    )
    return len(df)


def _cliente(credenciales: str = "config/credentials.json"):
    """Autentica con una cuenta de servicio.

    Se eligio cuenta de servicio y no OAuth de usuario porque el pipeline corre
    desatendido: OAuth exige un navegador la primera vez y su refresh token
    caduca si la app sigue en modo prueba. La cuenta de servicio no caduca.
    """
    import gspread
    from google.oauth2.service_account import Credentials

    ruta = Path(credenciales)
    if not ruta.is_absolute():
        ruta = Path(__file__).resolve().parent.parent / ruta
    if not ruta.exists():
        raise FileNotFoundError(
            f"No existe {ruta}. Descarga la clave JSON de la cuenta de servicio "
            "y comparte la hoja con su correo client_email."
        )
    alcance = ["https://www.googleapis.com/auth/spreadsheets"]
    return gspread.authorize(Credentials.from_service_account_file(str(ruta), scopes=alcance))


def _valores(df: pd.DataFrame) -> list[list]:
    """DataFrame -> matriz lista para la API, con los nulos como celda vacia.

    Los enteros se mandan como int y no como texto para que Looker Studio los
    lea como metrica sin tener que forzar el tipo en el dashboard.
    """
    limpio = df.astype(object).where(df.notna(), "")
    return [df.columns.tolist()] + limpio.values.tolist()


def reemplazar_hoja(
    df: pd.DataFrame,
    *,
    sheet_id: str,
    hoja: str,
    credenciales: str = "config/credentials.json",
) -> int:
    """Sobrescribe una pestana completa con el DataFrame.

    Para datasets que son una instantanea completa (el RUNT republica toda la
    serie en cada actualizacion) reemplazar es lo correcto: un upsert por
    periodo dejaria filas viejas si la fuente corrige historicos.

    La pestana se redimensiona al tamano exacto para no dejar filas vacias
    arrastradas de la corrida anterior, que Looker Studio contaria como nulos.
    """
    libro = _cliente(credenciales).open_by_key(sheet_id)
    try:
        ws = libro.worksheet(hoja)
    except Exception:
        ws = libro.add_worksheet(title=hoja, rows=len(df) + 1, cols=len(df.columns))

    datos = _valores(df)
    ws.clear()
    ws.resize(rows=max(len(datos), 2), cols=max(len(df.columns), 1))
    ws.update(datos, value_input_option="RAW")
    return len(df)


def marcar_actualizacion(
    *,
    sheet_id: str,
    hoja: str = "_actualizacion",
    credenciales: str = "config/credentials.json",
    **campos: object,
) -> None:
    """Escribe una pestana chica con la fecha y el conteo de la ultima corrida.

    Sirve para poner un "datos actualizados al ..." en el dashboard y para
    notar a simple vista si el pipeline dejo de correr.
    """
    from datetime import datetime

    libro = _cliente(credenciales).open_by_key(sheet_id)
    try:
        ws = libro.worksheet(hoja)
    except Exception:
        ws = libro.add_worksheet(title=hoja, rows=20, cols=2)

    filas = [["campo", "valor"], ["corrida", datetime.now().strftime("%Y-%m-%d %H:%M")]]
    filas += [[k, v] for k, v in campos.items()]
    ws.clear()
    ws.resize(rows=max(len(filas), 2), cols=2)
    ws.update(filas, value_input_option="RAW")
