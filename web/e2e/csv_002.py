"""CSV de prueba para los E2E de la spec 002 (solo biblioteca estándar).

Uso: python csv_002.py ENTRADA SALIDA PREFIJO SERVICIO [todas]
- Pone SERVICIO en la columna «Tipo uso/conexión» de la primera fila de datos.
- Sin "todas": deja solo esa primera fila y le antepone PREFIJO al nombre.
- Con "todas": conserva todas las filas y no cambia los nombres (para una copia de datos/).
"""
import csv
import sys

entrada, salida, prefijo, servicio = sys.argv[1:5]
todas = len(sys.argv) > 5 and sys.argv[5] == "todas"
with open(entrada, encoding="utf-8-sig", newline="") as f:
    filas = list(csv.reader(f))
cab, datos = filas[0], [r for r in filas[1:] if r and r[0].strip()]
col = cab.index("Tipo uso/conexión")
datos[0][col] = servicio
if not todas:
    datos = datos[:1]
    datos[0][0] = prefijo + datos[0][0]
with open(salida, "w", encoding="utf-8", newline="") as f:
    csv.writer(f).writerows([cab] + datos)
print(len(datos))
