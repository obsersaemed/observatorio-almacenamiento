"""Valida los CSV de datos/ contra datos/esquemas.json.

Uso:
    python scripts/validar_datos.py              # valida todo datos/
    python scripts/validar_datos.py --dir otra/  # otra carpeta de datos

Sale con código 1 si hay errores. Los avisos no bloquean.
Solo usa la biblioteca estándar.
"""
import argparse
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URL = re.compile(r"^https?://\S+$")
CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalizar(s):
    """Colapsa espacios y saltos de línea (los encabezados de Sheets traen saltos)."""
    return " ".join(str(s or "").split())


def numero(s):
    """Lee '4,9653', '4.9653' o '1.234,5' (convención es-CO). None si no es número."""
    v = normalizar(s)
    if "," in v and "." in v:
        v = v.replace(".", "")
    try:
        return float(v.replace(",", "."))
    except ValueError:
        return None


def leer_csv(ruta):
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        return list(csv.reader(f))


def limite(x):
    """Escribe los límites como JavaScript (-82, no -82.0) para que el mensaje sea idéntico en la web."""
    return int(x) if isinstance(x, float) and x.is_integer() else x


def validar_valor(c, v, mensajes):
    """Mensaje de error para el valor v de la columna c, o None si es válido.
    Las plantillas vienen de esquemas.json (_mensajes) y las comparte la web."""
    m = lambda clave, **kw: mensajes[clave].format(columna=c["nombre"], valor=v, **kw)
    if v == "":
        return m("obligatorio") if c.get("obligatorio") else None
    t = c["tipo"]
    if t == "numero":
        x = numero(v)
        if x is None:
            return m("numero")
        if ("min" in c and x < c["min"]) or ("max" in c and x > c["max"]):
            return m("rango", min=limite(c.get("min", "-inf")), max=limite(c.get("max", "inf")))
    elif t == "enum" and v not in c["valores"]:
        return m("valores", valores=", ".join(c["valores"]))
    elif t == "fecha":
        try:
            date.fromisoformat(v)
        except ValueError:
            return m("fecha")
    elif t == "urls" and not all(URL.match(u) for u in v.split()):
        return m("urls")
    elif t == "correo" and not CORREO.match(v):
        return m("correo")
    return None


def validar_tabla(nombre, esquema, ruta, mensajes):
    """Devuelve (errores, avisos, filas como dicts)."""
    errores, avisos = [], []
    if not ruta.exists():
        return [f"{ruta.name}: no existe"], [], []
    filas = [r for r in leer_csv(ruta) if any(c.strip() for c in r)]
    if not filas:
        return [f"{ruta.name}: está vacío (falta el encabezado)"], [], []

    cols = esquema["columnas"]
    esperado = [c["nombre"] for c in cols]
    encabezado = [normalizar(h) for h in filas[0]]
    if encabezado != esperado:
        for i, (a, b) in enumerate(zip(encabezado, esperado)):
            if a != b:
                errores.append(f"{ruta.name}: columna {i + 1} es '{a}', se esperaba '{b}'")
                break
        if len(encabezado) != len(esperado):
            errores.append(f"{ruta.name}: tiene {len(encabezado)} columnas, se esperaban {len(esperado)}")
        return errores, avisos, []

    registros, claves = [], {}
    for n, fila in enumerate(filas[1:], start=2):
        fila = fila + [""] * (len(cols) - len(fila))
        reg = {c["nombre"]: fila[i].strip() for i, c in enumerate(cols)}
        registros.append(reg)
        ident = reg.get(esquema.get("clave", ""), "") or f"fila {n}"
        donde = f"{ruta.name} fila {n} ({ident})"

        for c in cols:
            v = reg[c["nombre"]]
            if v == "" and not c.get("obligatorio"):
                if c.get("aviso_si_vacio"):
                    avisos.append(f"{donde}: '{c['nombre']}' vacío, {c['aviso_si_vacio']}")
                continue
            problema = validar_valor(c, v, mensajes)
            if problema:
                errores.append(f"{donde}: {problema}")

        clave = reg.get(esquema.get("clave", ""))
        if clave:
            if clave in claves:
                errores.append(f"{donde}: '{clave}' repetido (también en fila {claves[clave]})")
            claves[clave] = n
    return errores, avisos, registros


def validar(dir_datos=RAIZ / "datos"):
    dir_datos = Path(dir_datos)
    esquemas = json.loads((dir_datos / "esquemas.json").read_text(encoding="utf-8"))
    errores, avisos, tablas = [], [], {}
    for nombre, esq in esquemas.items():
        if nombre.startswith("_") or not esq.get("archivo"):
            continue  # metadatos o esquemas que viven solo en la base de datos
        e, a, regs = validar_tabla(nombre, esq, dir_datos / esq["archivo"], esquemas["_mensajes"])
        errores += e
        avisos += a
        tablas[nombre] = regs

    # Referencias cruzadas: avisos, no errores
    proyectos = {r["Nombre"] for r in tablas.get("proyectos", [])}
    normas = {r["id"] for r in tablas.get("normativa", [])}
    for r in tablas.get("noticias", []):
        if r.get("proyecto_relacionado") and r["proyecto_relacionado"] not in proyectos:
            avisos.append(f"noticias.csv ({r['titulo']}): proyecto '{r['proyecto_relacionado']}' no existe en proyectos.csv")
        if r.get("norma_relacionada") and r["norma_relacionada"] not in normas:
            avisos.append(f"noticias.csv ({r['titulo']}): norma '{r['norma_relacionada']}' no existe en normativa.csv")
    for r in tablas.get("normativa", []):
        for rel in filter(None, (x.strip() for x in r.get("relacionada_con", "").split(";"))):
            if rel not in normas:
                avisos.append(f"normativa.csv ({r['id']}): relacionada_con '{rel}' no existe")
    return errores, avisos


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--dir", default=RAIZ / "datos")
    errores, avisos = validar(p.parse_args().dir)
    for a in avisos:
        print(f"AVISO  {a}")
    for e in errores:
        print(f"ERROR  {e}")
    print(f"\n{len(errores)} errores, {len(avisos)} avisos")
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
