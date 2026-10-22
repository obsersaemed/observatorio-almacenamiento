"""003 · T02 · RF-04, RF-14: conversión de la hoja VEHICULOS_ELECTRICOS a datos/ con control de
cuadre. Datos ficticios. Correr con: python -m unittest discover pruebas"""
import csv
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from convertir_vehiculos import convertir  # noqa: E402

ENC = "linea;marca;v2024;v2025;v2026;total;tipo_bateria;cap_min_kwh;cap_max_kwh;potencia_kw;prom_cap_kwh;total_kwh\n"


class TestConvertir(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.dir)

    def hoja(self, filas):
        ruta = self.dir / "hoja.csv"
        ruta.write_text(ENC + filas, encoding="utf-8")
        return ruta

    def leer(self, nombre):
        with open(self.dir / nombre, encoding="utf-8", newline="") as f:
            return list(csv.reader(f))

    def test_convierte_anios_en_filas_y_lee_la_coma_decimal(self):
        ruta = self.hoja("Linea A;Marca X;10;20;5;35;LFP;30,08;38,00;55;34,04;1191,4\nLinea B;Marca Y;0;1;0;1;ULTIUM;100;100;;100;100\n")
        errores, resumen = convertir(ruta, self.dir)
        self.assertEqual(errores, [])
        self.assertEqual(resumen, {"lineas": 2, "unidades": 36, "kwh": 1291.4})
        lineas = self.leer("vehiculos_lineas.csv")
        self.assertEqual(lineas[0], ["Marca", "Línea", "Tipo de batería", "Capacidad mínima [kWh]", "Capacidad máxima [kWh]", "Potencia [kW]"])
        self.assertEqual(lineas[1], ["Marca X", "Linea A", "LFP", "30.08", "38", "55"])
        self.assertEqual(lineas[2][5], "")
        ventas = self.leer("vehiculos_ventas.csv")
        self.assertEqual(ventas[0], ["Línea", "Año", "Unidades"])
        self.assertEqual(ventas[1:4], [["Linea A", "2024", "10"], ["Linea A", "2025", "20"], ["Linea A", "2026", "5"]])

    def test_rechaza_un_total_que_no_es_la_suma_de_los_anios(self):
        ruta = self.hoja("Linea A;Marca X;10;20;5;99;LFP;40;60;;50;4950\n")
        errores, _ = convertir(ruta, self.dir)
        self.assertTrue(any("Linea A" in e and "total" in e for e in errores), errores)
        self.assertFalse((self.dir / "vehiculos_lineas.csv").exists())

    def test_rechaza_kwh_que_no_cuadran_con_total_por_promedio(self):
        ruta = self.hoja("Linea A;Marca X;10;20;5;35;LFP;40;60;;50;9999\n")
        errores, _ = convertir(ruta, self.dir)
        self.assertTrue(any("Linea A" in e and "kWh" in e for e in errores), errores)

    def test_rechaza_un_promedio_que_no_es_el_de_minima_y_maxima(self):
        ruta = self.hoja("Linea A;Marca X;10;20;5;35;LFP;40;60;;45;1575\n")
        errores, _ = convertir(ruta, self.dir)
        self.assertTrue(any("Linea A" in e and "promedio" in e for e in errores), errores)

    def test_rechaza_columnas_faltantes(self):
        ruta = self.dir / "hoja.csv"
        ruta.write_text("linea;marca\nA;B\n", encoding="utf-8")
        errores, _ = convertir(ruta, self.dir)
        self.assertTrue(any("Faltan columnas" in e for e in errores), errores)
