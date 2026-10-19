"""Explorador: abre el reporte de Looker Studio e intercepta sus respuestas de datos.

Looker Studio no entrega datos en el HTML: la SPA los pide por POST a un endpoint
interno (batchedDataV2). Este script captura esas respuestas para que podamos ver
que tablas y campos expone realmente el reporte antes de escribir el extractor.

Uso:
    python src/explorar_looker.py --url "https://datastudio.google.com/reporting/..."
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

from playwright.sync_api import sync_playwright

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
# Endpoints por los que Looker Studio devuelve datos de los graficos
PATRON_DATOS = re.compile(r"batchedDataV2|/data\b|dataRequest", re.IGNORECASE)


def explorar(url: str, *, headless: bool = True, espera_ms: int = 25000) -> Path:
    destino = RAW_DIR / date.today().isoformat() / "looker"
    destino.mkdir(parents=True, exist_ok=True)
    capturas: list[dict] = []

    def on_response(resp):
        if not PATRON_DATOS.search(resp.url):
            return
        try:
            cuerpo = resp.text()
        except Exception:
            return
        capturas.append({"url": resp.url, "status": resp.status, "len": len(cuerpo)})
        idx = len(capturas)
        (destino / f"resp_{idx:03d}.txt").write_text(cuerpo, encoding="utf-8")

    with sync_playwright() as p:
        nav = p.chromium.launch(headless=headless)
        ctx = nav.new_context(
            locale="es-CO",
            viewport={"width": 1920, "height": 1080},
        )
        pag = ctx.new_page()
        pag.on("response", on_response)
        # networkidle no sirve: Looker Studio mantiene trafico abierto de forma indefinida
        pag.goto(url, wait_until="domcontentloaded", timeout=90000)
        pag.wait_for_timeout(espera_ms)
        pag.screenshot(path=str(destino / "pantalla.png"), full_page=True)
        titulo = pag.title()
        texto = pag.inner_text("body")[:3000]
        nav.close()

    (destino / "indice.json").write_text(
        json.dumps({"url": url, "titulo": titulo, "capturas": capturas}, indent=2),
        encoding="utf-8",
    )
    (destino / "texto_visible.txt").write_text(texto, encoding="utf-8")
    print(f"Titulo: {titulo}")
    print(f"Respuestas de datos capturadas: {len(capturas)}")
    for c in capturas:
        print(f"  [{c['status']}] {c['len']:>9,} bytes  {c['url'][:110]}")
    print(f"Todo guardado en: {destino}")
    return destino


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--ver", action="store_true", help="Mostrar el navegador")
    ap.add_argument("--espera", type=int, default=25000)
    a = ap.parse_args()
    explorar(a.url, headless=not a.ver, espera_ms=a.espera)
