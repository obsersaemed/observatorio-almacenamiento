"""Prepara CSV de prueba para los E2E de importación (solo biblioteca estándar).

Uso: python csv_prueba.py ENTRADA SALIDA PREFIJO [planeado]
- Prefija el nombre de cada proyecto con PREFIJO.
- Con "planeado", deja solo la primera fila y le pone Estado = Planeado.
"""
import csv
import sys

entrada, salida, prefijo = sys.argv[1:4]
planeado = len(sys.argv) > 4 and sys.argv[4] == "planeado"
with open(entrada, encoding="utf-8-sig", newline="") as f:
    filas = list(csv.reader(f))
cab, datos = filas[0], [r for r in filas[1:] if r and r[0].strip()]
for r in datos:
    r[0] = prefijo + r[0]
if planeado:
    datos = datos[:1]
    datos[0][cab.index("Estado")] = "Planeado"
with open(salida, "w", encoding="utf-8", newline="") as f:
    csv.writer(f).writerows([cab] + datos)
print(len(datos))
