"""Descarga y guarda snapshots del HTML de origen.

El snapshot se guarda SIEMPRE antes de parsear: en una corrida trimestral no
hay forma de recuperar el HTML de hace tres meses si el sitio cambio.
"""
from __future__ import annotations

import hashlib
import time
from datetime import date
from pathlib import Path

import requests

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    ),
    "Accept-Language": "es-CO,es;q=0.9",
}


def fetch(url: str, *, reintentos: int = 3, espera: float = 2.0) -> str:
    """Descarga una URL con reintentos y backoff lineal."""
    ultimo_error: Exception | None = None
    for intento in range(1, reintentos + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            # requests adivina mal el encoding en muchos sitios .gov.co
            resp.encoding = resp.apparent_encoding or resp.encoding
            return resp.text
        except Exception as exc:  # noqa: BLE001 - se reintenta cualquier fallo de red
            ultimo_error = exc
            if intento < reintentos:
                time.sleep(espera * intento)
    raise RuntimeError(f"No se pudo descargar {url}: {ultimo_error}")


def guardar_snapshot(url: str, html: str, *, corrida: date | None = None) -> Path:
    """Guarda el HTML en data/raw/<fecha>/<hash-de-url>.html y devuelve la ruta."""
    corrida = corrida or date.today()
    carpeta = RAW_DIR / corrida.isoformat()
    carpeta.mkdir(parents=True, exist_ok=True)
    nombre = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    destino = carpeta / f"{nombre}.html"
    destino.write_text(html, encoding="utf-8")
    (carpeta / f"{nombre}.url.txt").write_text(url, encoding="utf-8")
    return destino


def fetch_con_snapshot(url: str, *, corrida: date | None = None) -> tuple[str, Path]:
    html = fetch(url)
    return html, guardar_snapshot(url, html, corrida=corrida)
