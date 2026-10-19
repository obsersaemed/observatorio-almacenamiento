"""Extrae de ANDEMOS las tablas que traen marca y linea juntas, filtradas a
vehiculos hibridos y electricos.

El informe de ANDEMOS es un reporte de Looker Studio: los datos no estan en el
HTML, llegan por POST a `batchedDataV2`. Aqui se abre el reporte con Chromium,
se acciona el control de filtro "HIBRIDOS Y ELECTRICOS", y se capturan e
interpretan las respuestas que el propio reporte pide al recargarse.

Los nombres de columna vienen ofuscados (`qt_gjv504af0d`), asi que las columnas
se reconocen por su contenido, contrastandolas contra el vocabulario de marcas y
lineas guardado en `config/vocabulario_andemos.json`.

Uso:
    python src/andemos.py
    python src/andemos.py --ver --espera 40000
    python src/andemos.py --carpeta data/raw/2026-09-20/andemos_hibridos_electricos

Nota de uso: ANDEMOS restringe la redistribucion de sus informes. Esta
extraccion es para analisis interno del Observatorio.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

import pandas as pd
from playwright.sync_api import sync_playwright

import decodificar_looker as dl

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
VOCABULARIO = RAIZ / "config" / "vocabulario_andemos.json"

URL = ("https://datastudio.google.com/reporting/"
       "ceb8deeb-3b00-4e08-8536-5a0f2ebb5cf2/page/p_20yns98e0d")
ETIQUETA_FILTRO = "HIBRIDOS Y ELECTRICOS"
OPCION = "Hibridos Y Electricos"
PATRON_DATOS = re.compile(r"batchedDataV2", re.IGNORECASE)


def _sin_tildes(texto: str) -> str:
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", texto)
                   if unicodedata.category(c) != "Mn")


def capturar(*, headless: bool = True, espera_ms: int = 30000) -> Path:
    """Abre el reporte, aplica el filtro y guarda las respuestas de datos."""
    destino = RAW / date.today().isoformat() / "andemos_hibridos_electricos"
    destino.mkdir(parents=True, exist_ok=True)
    for viejo in destino.glob("resp_*.txt"):
        viejo.unlink()

    capturas: list[dict] = []
    fase = ["inicial"]

    def guardar(resp):
        if not PATRON_DATOS.search(resp.url):
            return
        try:
            cuerpo = resp.text()
        except Exception:
            return
        capturas.append({"fase": fase[0], "len": len(cuerpo)})
        (destino / f"resp_{len(capturas):03d}.txt").write_text(cuerpo, encoding="utf-8")

    with sync_playwright() as p:
        nav = p.chromium.launch(headless=headless, args=["--no-sandbox"])
        pag = nav.new_context(locale="es-CO", viewport={"width": 1600, "height": 900}).new_page()
        pag.on("response", guardar)
        pag.goto(URL, wait_until="domcontentloaded", timeout=90000)
        pag.wait_for_timeout(espera_ms)
        print(f"  reporte cargado: {pag.title()}")
        print(f"  respuestas en la carga inicial: {len(capturas)}")

        # El control es un boton de Looker que despliega casillas de verificacion
        boton = pag.get_by_text(ETIQUETA_FILTRO, exact=False).locator(
            "xpath=ancestor::button[contains(@class,'lego-control')][1]")
        if not boton.count():
            nav.close()
            raise RuntimeError(f"No se encontro el control '{ETIQUETA_FILTRO}' en el reporte")

        fase[0] = "filtrada"
        inicial = len(capturas)
        boton.first.click()
        pag.wait_for_timeout(5000)

        casillas = pag.locator("md-checkbox")

        def leer() -> list[tuple[int, str, bool]]:
            """Relee el estado de las casillas. Hay que releer tras CADA clic:
            la casilla de 'seleccionar todas' cambia las demas, asi que operar
            sobre una lectura previa invierte el filtro sin avisar."""
            out = []
            for i in range(casillas.count()):
                out.append((i,
                            casillas.nth(i).inner_text(timeout=3000).strip(),
                            casillas.nth(i).get_attribute("aria-checked") == "true"))
            return out

        estados = leer()
        print(f"  casillas: {[(t or '(todas)', m) for _, t, m in estados]}")
        objetivo = next((i for i, t, _ in estados
                         if OPCION.lower() in _sin_tildes(t).lower()), None)
        if objetivo is None:
            nav.close()
            raise RuntimeError(f"No aparece '{OPCION}' entre {[t for _, t, _ in estados]}")

        # La primera casilla es 'seleccionar todas'. Destildarla vacia la
        # seleccion entera, que es justo el punto de partida que queremos.
        if estados[0][2]:
            casillas.nth(0).click()
            pag.wait_for_timeout(1500)

        # Desde la lista vacia, marcar solo el objetivo, releyendo cada vez
        for _ in range(len(estados) + 1):
            actual = leer()
            pendientes = [i for i, _t, m in actual[1:] if m != (i == objetivo)]
            if not pendientes:
                break
            casillas.nth(pendientes[0]).click()
            pag.wait_for_timeout(1500)

        final = leer()
        print(f"  estado final: {[(t or '(todas)', m) for _, t, m in final]}")
        if not final[objetivo][2] or any(m for i, _t, m in final[1:] if i != objetivo):
            nav.close()
            raise RuntimeError(f"El filtro no quedo en '{OPCION}': {final}")

        # Aplicar: Looker recarga los graficos y vuelve a pedir datos
        aplicar = pag.get_by_role("button", name=re.compile("aplicar|apply", re.I))
        if aplicar.count():
            aplicar.first.click()
        else:
            pag.keyboard.press("Escape")
        pag.wait_for_timeout(espera_ms)
        pag.screenshot(path=str(destino / "pantalla_filtrada.png"))
        visible = pag.inner_text("body")[:4000]
        nav.close()

    (destino / "texto_visible.txt").write_text(visible, encoding="utf-8")
    (destino / "indice.json").write_text(
        json.dumps({"url": URL, "filtro": OPCION, "capturas": capturas}, indent=2),
        encoding="utf-8")
    print(f"  respuestas tras filtrar: {len(capturas) - inicial}")
    print(f"  guardado en {destino}")
    return destino


def _respuestas_filtradas(carpeta: Path) -> set[str]:
    """Nombres de los resp_*.txt capturados DESPUES de aplicar el filtro.

    `indice.json` guarda la fase de cada respuesta en el mismo orden en que se
    numeraron los archivos. Sin esto no hay forma de distinguir la tabla
    filtrada de la que el reporte ya habia pedido al cargar.
    """
    indice = carpeta / "indice.json"
    if not indice.exists():
        return set()
    capturas = json.loads(indice.read_text(encoding="utf-8")).get("capturas", [])
    return {f"resp_{i:03d}" for i, c in enumerate(capturas, start=1)
            if c.get("fase") == "filtrada"}


COMBUSTIBLES = {"gasolina", "diesel", "hibrido", "electrico", "gas convertido",
                "gas gasol", "gnv", "hibrido enchufable"}
LIMPIOS = {"hibrido", "electrico", "hibrido enchufable"}


def comprobar_filtro(tablas: dict[str, pd.DataFrame]) -> None:
    """Busca en la captura la tabla de combustibles y reporta cuales quedaron.

    Es la prueba de que el filtro se aplico en el sentido correcto: si aparece
    Gasolina o Diesel, se filtro al reves y los datos son de combustion.
    """
    hallados: set[str] = set()
    for df in tablas.values():
        for col in df.columns:
            vals = {_sin_tildes(str(x)).lower() for x in df[col].dropna()
                    if isinstance(x, str)}
            if vals and vals <= COMBUSTIBLES:
                hallados |= vals
    if not hallados:
        print("  (la captura no incluye la tabla por combustible)")
        return
    sucios = hallados - LIMPIOS
    print(f"  combustibles presentes: {sorted(hallados)}")
    if sucios:
        print(f"  AVISO: el filtro dejo pasar combustion ({sorted(sucios)})",
              file=sys.stderr)
    else:
        print("  filtro correcto: solo hibridos y electricos")


def _vocabulario() -> tuple[set[str], set[str]]:
    v = json.loads(VOCABULARIO.read_text(encoding="utf-8"))
    return set(v["marcas"]), set(v["lineas"])


def _proporcion(serie: pd.Series, vocab: set[str]) -> float:
    vals = [x for x in serie.dropna() if isinstance(x, str)]
    return sum(x in vocab for x in vals) / len(vals) if vals else 0.0


def identificar(df: pd.DataFrame, marcas: set[str], lineas: set[str],
                umbral: float = 0.8) -> dict[str, str] | None:
    """Devuelve {columna: 'marca'|'linea'} si la tabla trae AMBAS, si no None.

    Se decide por contenido y no por nombre porque Looker ofusca los nombres.
    Una columna puede parecerse a las dos listas (hay un valor que es marca y
    linea a la vez), asi que gana la proporcion mas alta.
    """
    puntajes = {c: (_proporcion(df[c], marcas), _proporcion(df[c], lineas))
                for c in df.columns}
    col_marca = max(puntajes, key=lambda c: puntajes[c][0])
    col_linea = max(puntajes, key=lambda c: puntajes[c][1])
    if col_marca == col_linea:
        return None
    if puntajes[col_marca][0] < umbral or puntajes[col_linea][1] < umbral:
        return None
    return {col_marca: "marca", col_linea: "linea"}


def armar(df: pd.DataFrame, mapa: dict[str, str]) -> pd.DataFrame:
    """Renombra las columnas reconocidas y etiqueta las metricas por posicion.

    En el reporte la tabla marca+linea trae, en este orden: acumulado del ano
    anterior, acumulado del ano actual y variacion. El orden se comprueba
    despues contra la aritmetica en `verificar()`.
    """
    numericas = [c for c in df.columns if c not in mapa]
    etiquetas = ["acum_2025", "acum_2026", "variacion"][:len(numericas)]
    nuevo = df.rename(columns={**mapa, **dict(zip(numericas, etiquetas))})
    orden = [c for c in ["marca", "linea", "acum_2025", "acum_2026", "variacion"]
             if c in nuevo.columns]
    nuevo = nuevo[orden + [c for c in nuevo.columns if c not in orden]]
    nuevo.attrs = dict(df.attrs)  # renombrar y reordenar pierde attrs
    return nuevo


def verificar(df: pd.DataFrame) -> None:
    """Comprueba que las metricas quedaron en el orden supuesto.

    variacion debe ser (acum_2026 - acum_2025) / acum_2025. Si el orden de las
    columnas fuera otro, la igualdad falla y lo sabemos aqui y no en el informe.
    """
    if not {"acum_2025", "acum_2026", "variacion"} <= set(df.columns):
        print("  (sin metricas suficientes para verificar el orden)")
        return
    d = df.dropna(subset=["acum_2025", "acum_2026", "variacion"])
    d = d[d["acum_2025"] != 0]
    if d.empty:
        print("  (sin filas comparables)")
        return
    esperado = (d["acum_2026"] - d["acum_2025"]) / d["acum_2025"]
    ok = (esperado - d["variacion"]).abs() < 0.005
    veredicto = "OK" if ok.mean() > 0.95 else "REVISAR"
    print(f"  orden de metricas: {ok.sum()}/{len(d)} filas cuadran -> {veredicto}")


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Extrae de ANDEMOS marca+linea de hibridos y electricos")
    ap.add_argument("--ver", action="store_true", help="Mostrar el navegador")
    ap.add_argument("--espera", type=int, default=30000, help="Espera por carga, en ms")
    ap.add_argument("--carpeta", help="Reutilizar una captura ya hecha, sin abrir el navegador")
    ap.add_argument("--salida", default="data/processed")
    a = ap.parse_args()

    carpeta = Path(a.carpeta) if a.carpeta else capturar(headless=not a.ver,
                                                         espera_ms=a.espera)

    marcas, lineas = _vocabulario()
    tablas = dl.tablas_de_carpeta(carpeta)
    print(f"\ntablas decodificadas: {len(tablas)}")

    # La carga inicial trae las mismas tablas SIN filtrar. Si no se descartan,
    # se cuela la tabla de todos los combustibles, que ademas es mas grande y
    # ganaria cualquier criterio por tamano.
    tras_filtro = _respuestas_filtradas(carpeta)
    if tras_filtro:
        previas = {n for n in tablas if n.split("_t")[0] not in tras_filtro}
        print(f"  descartadas {len(previas)} tablas de la carga previa al filtro")
        tablas = {n: d for n, d in tablas.items() if n not in previas}

    comprobar_filtro(tablas)

    elegidas: dict[str, pd.DataFrame] = {}
    for nombre, df in tablas.items():
        mapa = identificar(df, marcas, lineas)
        if mapa:
            elegidas[nombre] = armar(df, mapa)
            print(f"  {nombre}: marca+linea, {len(df)} filas "
                  f"(totalCount={df.attrs.get('totalCount')})")

    if not elegidas:
        print("Ninguna tabla trae marca y linea juntas.", file=sys.stderr)
        return 1

    # Nos quedamos con la mas completa si el reporte repitio la misma tabla
    nombre, df = max(elegidas.items(), key=lambda kv: len(kv[1]))
    print(f"\ntabla elegida: {nombre}")
    completa = df.attrs.get("totalCount")
    if completa and len(df) < completa:
        print(f"  AVISO: Looker pagino, llegaron {len(df):,} de {completa:,} filas",
              file=sys.stderr)
    verificar(df)

    destino = Path(a.salida)
    destino.mkdir(parents=True, exist_ok=True)
    base = destino / "andemos_hibridos_electricos_marca_linea"
    df.to_csv(base.with_suffix(".csv"), index=False, encoding="utf-8-sig")
    with pd.ExcelWriter(base.with_suffix(".xlsx"), engine="openpyxl") as xw:
        df.to_excel(xw, index=False, sheet_name="marca_linea")
        ws = xw.sheets["marca_linea"]
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
    print(f"  escrito: {base.with_suffix('.csv')}")
    print(f"  escrito: {base.with_suffix('.xlsx')}")
    print(f"  {len(df):,} filas | {df['marca'].nunique()} marcas | "
          f"{df['linea'].nunique()} lineas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
