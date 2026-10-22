"""Convierte la hoja `VEHICULOS_ELECTRICOS` (CSV exportado con `;` y coma decimal) a los
archivos de datos/ de la spec 003: vehiculos_lineas.csv (ficha por línea) y
vehiculos_ventas.csv (unidades por línea y año).

Control de cuadre (aclaración 3 de la spec 003): si en alguna línea el total no es la suma de
los años, el promedio de capacidad no es el de la mínima y la máxima, o los kWh no son
total × promedio, se rechaza el archivo completo y no se escribe nada.

Uso:
    python scripts/convertir_vehiculos.py <hoja.csv>               # escribe en datos/
    python scripts/convertir_vehiculos.py <hoja.csv> --destino <carpeta>
"""
import argparse
import csv
import io
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validar_datos import RAIZ, numero  # noqa: E402

FIJAS = ["linea", "marca", "total", "tipo_bateria", "cap_min_kwh", "cap_max_kwh", "potencia_kw", "prom_cap_kwh", "total_kwh"]
COLUMNA_ANIO = re.compile(r"^v(\d{4})$")
ENC_LINEAS = ["Marca", "Línea", "Tipo de batería", "Capacidad mínima [kWh]", "Capacidad máxima [kWh]", "Potencia [kW]"]
ENC_VENTAS = ["Línea", "Año", "Unidades"]


def texto_numero(x):
    """Número en el formato de datos/ (punto decimal, sin ceros sobrantes); vacío si falta."""
    if x is None:
        return ""
    return str(int(x)) if float(x).is_integer() else repr(round(x, 6))


def convertir(hoja, destino=RAIZ / "datos"):
    """Devuelve (errores, resumen). Solo escribe si no hay errores."""
    texto = Path(hoja).read_bytes().decode("utf-8-sig")
    filas = list(csv.DictReader(io.StringIO(texto), delimiter=";"))
    columnas = filas[0].keys() if filas else []
    anios = sorted(m.group(1) for c in columnas if (m := COLUMNA_ANIO.match(c)))
    faltan = [c for c in FIJAS if c not in columnas]
    if faltan or not anios:
        return [f"Faltan columnas en {Path(hoja).name}: {faltan or 'v<año>'}"], None

    errores, lineas, ventas = [], [], []
    unidades = kwh = 0.0
    for n, f in enumerate(filas, start=2):
        nombre = f["linea"].strip()
        donde = f"fila {n} ({nombre})"
        por_anio = {a: numero(f[f"v{a}"]) or 0 for a in anios}
        total, cmin, cmax = numero(f["total"]), numero(f["cap_min_kwh"]), numero(f["cap_max_kwh"])
        prom, total_kwh = numero(f["prom_cap_kwh"]), numero(f["total_kwh"])
        if total is None or abs(sum(por_anio.values()) - total) > 0.5:
            errores.append(f"{donde}: el total {f['total']} no es la suma de los años ({sum(por_anio.values()):g})")
        if None in (cmin, cmax, prom) or abs((cmin + cmax) / 2 - prom) > 0.01:
            errores.append(f"{donde}: el promedio de capacidad {f['prom_cap_kwh']} no es el de la mínima y la máxima")
        elif total is not None and (total_kwh is None or abs(total * prom - total_kwh) > 1):
            errores.append(f"{donde}: los kWh {f['total_kwh']} no son total × capacidad promedio ({total * prom:g})")
        lineas.append([f["marca"].strip(), nombre, f["tipo_bateria"].strip(), texto_numero(cmin), texto_numero(cmax), texto_numero(numero(f["potencia_kw"]))])
        ventas += [[nombre, a, str(int(u))] for a, u in por_anio.items()]
        unidades += total or 0
        kwh += total_kwh or 0

    if errores:
        return errores, None
    destino = Path(destino)
    for nombre, encabezado, cuerpo in (("vehiculos_lineas.csv", ENC_LINEAS, lineas), ("vehiculos_ventas.csv", ENC_VENTAS, ventas)):
        with open(destino / nombre, "w", encoding="utf-8", newline="") as salida:
            csv.writer(salida, lineterminator="\r\n").writerows([encabezado, *cuerpo])
    return [], {"lineas": len(lineas), "unidades": int(unidades), "kwh": round(kwh, 2)}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("hoja", type=Path)
    p.add_argument("--destino", type=Path, default=RAIZ / "datos")
    a = p.parse_args()
    errores, resumen = convertir(a.hoja, a.destino)
    for e in errores:
        print(f"RECHAZO  {e}")
    if errores:
        print(f"{len(errores)} error(es): no se escribió ningún archivo.")
        sys.exit(1)
    print(f"{resumen['lineas']} líneas, {resumen['unidades']:,} unidades y {resumen['kwh']:,.2f} kWh -> {a.destino}")


if __name__ == "__main__":
    main()
