"""Valida los CSV de datos/ contra datos/esquemas.json.

Uso:
    python scripts/validar_datos.py              # valida todo datos/
    python scripts/validar_datos.py --dir otra/  # otra carpeta de datos

Sale con código 1 si hay errores. Los avisos no bloquean.
Solo usa la biblioteca estándar.
"""
import argparse
import csv
import io
import json
import re
import unicodedata
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URL = re.compile(r"^https?://\S+$")
CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def columna_sql(nombre):
    """Nombre de columna en la base de datos: minúsculas, sin tildes ni símbolos.
    'Potencia nominal [MW]' -> 'potencia_nominal_mw'. La web usa la misma regla."""
    sin_tildes = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", sin_tildes.lower()).strip("_")


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
    """Lee UTF-8 (con o sin marca) y, si no lo es, cp1252: así guarda Excel en Windows."""
    crudo = Path(ruta).read_bytes()
    try:
        texto = crudo.decode("utf-8-sig")
    except UnicodeDecodeError:
        texto = crudo.decode("cp1252")
    return list(csv.reader(io.StringIO(texto, newline="")))


def limite(x):
    """Escribe los límites como JavaScript (-82, no -82.0) para que el mensaje sea idéntico en la web."""
    return int(x) if isinstance(x, float) and x.is_integer() else x


def separar_lista(c, v):
    """Valores de una columna tipo lista: 'a, b' → ['a', 'b'] (sin vacíos)."""
    return [x.strip() for x in v.split(c.get("separador", ",")) if x.strip()]


def segmentos_de(c, v):
    """Segmentos (008) de los servicios v de la columna c, en orden: el de por defecto primero y
    luego los del esquema. Un servicio que no está en 'segmentos' es del segmento por defecto."""
    por_servicio = {s: seg for seg, servicios in c.get("segmentos", {}).items() for s in servicios}
    encontrados = {por_servicio.get(x, c.get("segmento_por_defecto")) for x in separar_lista(c, v)}
    orden = [c.get("segmento_por_defecto"), *c.get("segmentos", {})]
    return [seg for seg in orden if seg in encontrados]


def segmento_de_fila(cols, reg):
    """Segmento del registro según su columna con 'segmentos' (o None si el esquema no tiene)."""
    c = next((c for c in cols if c.get("segmentos")), None)
    if c is None:
        return None
    segmentos = segmentos_de(c, reg.get(c["nombre"], ""))
    return segmentos[0] if len(segmentos) == 1 else c.get("segmento_por_defecto")


ENTERO = re.compile(r"^-?\d+$")


def validar_valor(c, v, mensajes):
    """Mensaje de error para el valor v de la columna c, o None si es válido.
    Las plantillas vienen de esquemas.json (_mensajes) y las comparte la web."""
    m = lambda clave, **kw: mensajes[clave].format(columna=c["nombre"], valor=v, **kw)
    if v == "":
        return m("obligatorio") if c.get("obligatorio") else None
    t = c["tipo"]
    if t == "entero":
        if not ENTERO.match(v):
            return m("entero")
        x = int(v)
        if ("min" in c and x < c["min"]) or ("max" in c and x > c["max"]):
            return m("rango", min=limite(c.get("min", "-inf")), max=limite(c.get("max", "inf")))
    elif t == "numero":
        x = numero(v)
        if x is None:
            return m("numero")
        if ("min" in c and x < c["min"]) or ("max" in c and x > c["max"]):
            return m("rango", min=limite(c.get("min", "-inf")), max=limite(c.get("max", "inf")))
    elif t == "enum" and v not in c["valores"]:
        return m("valores", valores=", ".join(c["valores"]))
    elif t == "lista":
        if any(x not in c["valores"] for x in separar_lista(c, v)):
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
        campos = esquema.get("clave", "")
        ident = (" · ".join(reg.get(x, "") for x in campos) if isinstance(campos, list) else reg.get(campos, "")) or f"fila {n}"
        donde = f"{ruta.name} fila {n} ({ident})"

        for c in cols:
            v = reg[c["nombre"]]
            if v == "" and not c.get("obligatorio"):
                if c.get("aviso_si_vacio"):
                    avisos.append(f"{donde}: '{c['nombre']}' vacío, {c['aviso_si_vacio']}")
                continue
            if c.get("texto_si_segmento") and c["texto_si_segmento"] == segmento_de_fila(cols, reg):
                continue  # 008 · RF-09: referencia textual sin URL (ya se sabe que no está vacía)
            problema = validar_valor(c, v, mensajes)
            mezcla = segmentos_de(c, v) if not problema and c.get("segmentos") else []
            if len(mezcla) > 1:  # 008 · RF-02: un proyecto no mezcla segmentos
                problema = mensajes["segmentos"].format(columna=c["nombre"], segmentos=" y ".join(mezcla))
            if problema:
                errores.append(f"{donde}: {problema}")
            elif c.get("min_de") and v:
                # Regla entre columnas (p. ej. Capacidad máxima ≥ Capacidad mínima).
                otra = numero(reg.get(c["min_de"], ""))
                if otra is not None and numero(v) < otra:
                    errores.append(f"{donde}: " + mensajes["min_de"].format(columna=c["nombre"], valor=v, otra=c["min_de"]))

        campos = esquema.get("clave", "")
        clave = " · ".join(reg.get(x, "") for x in campos) if isinstance(campos, list) else reg.get(campos)
        if clave:
            if clave in claves:
                errores.append(f"{donde}: '{clave}' repetido (también en fila {claves[clave]})")
            claves[clave] = n
    return errores, avisos, registros


def errores_de_referencias(esquemas, tablas):
    """Referencias obligatorias declaradas en el esquema (p. ej. venta → línea)."""
    errores = []
    for nombre, esq in esquemas.items():
        if nombre.startswith("_") or nombre not in tablas:
            continue
        for ref in esq.get("referencias", []):
            destino = esquemas[ref["esquema"]]
            existentes = {r.get(destino["clave"]) for r in tablas.get(ref["esquema"], [])}
            for r in tablas[nombre]:
                if r.get(ref["columna"]) and r[ref["columna"]] not in existentes:
                    errores.append(f"{esq['archivo']}: '{ref['columna']}' = '{r[ref['columna']]}' no existe en {ref['esquema']}")
    return errores


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

    errores += errores_de_referencias(esquemas, tablas)

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
