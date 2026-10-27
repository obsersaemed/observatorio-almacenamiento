"""008 · T09 (RF-11, CA-11.1, CA-11.2, CA-06.2): los tres aportes iniciales detrás del medidor
validan con el esquema de proyectos y traen los datos del brainstorm sin inventar nada.
Correr con: python -m unittest discover pruebas"""
import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from validar_datos import columna_sql, validar_tabla  # noqa: E402

ESQUEMAS = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
CARPETA = RAIZ / "specs" / "008-detras-del-medidor" / "propuestas"
FUENTE = "Información de Azimut Energía (2026-10)"
SERVICIO = "Maximización de autoconsumo PV y respaldo"

# Datos del brainstorm (kW y kWh) y cabeceras DIVIPOLA (DANE, centros poblados tipo CM).
ESPERADO = {
    "Casa Alto de las Palmas": dict(operador="Azimut Energía", estado="En operación", fpo="2025",
                                    departamento="Antioquia", municipio="Medellín", kw=15, kwh=40,
                                    lat=6.246631, lon=-75.581775),
    "Centro Comercial Ipiales": dict(operador="Azimut Energía", estado="En construcción", fpo="2026",
                                     departamento="Nariño", municipio="Ipiales", kw=107, kwh=241,
                                     lat=0.827732, lon=-77.646367),
    "Planta Guarne": dict(operador="Azimut Energía", estado="Anunciado", fpo="2026",
                          departamento="Antioquia", municipio="Guarne", kw=107, kwh=241,
                          lat=6.27787, lon=-75.441612),
}


def propuestas():
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(CARPETA.glob("*.json"))]


class TestPropuestasMedidor(unittest.TestCase):
    def test_hay_tres_aportes_de_proyecto_nuevo_con_la_fuente_de_azimut(self):
        ps = propuestas()
        self.assertEqual(sorted(p["datos"]["nombre"] for p in ps), sorted(ESPERADO))
        for p in ps:
            self.assertEqual(p["tipo"], "Proyecto nuevo")
            self.assertEqual(p["fuente"], FUENTE)
            self.assertEqual(p["datos"]["fuente"], FUENTE)
            self.assertEqual(p["datos"]["tipo_uso_conexion"], SERVICIO)

    def test_cifras_en_mw_y_ubicacion_de_la_cabecera(self):
        for p in propuestas():
            d, e = p["datos"], ESPERADO[p["datos"]["nombre"]]
            self.assertEqual(d["operador"], e["operador"])
            self.assertEqual(d["estado"], e["estado"])
            self.assertEqual(d["fpo"], e["fpo"])
            self.assertEqual(d["tecnologia"], "LFP")
            self.assertEqual((d["departamento"], d["municipio"]), (e["departamento"], e["municipio"]))
            self.assertAlmostEqual(d["potencia_nominal_mw"] * 1000, e["kw"])
            self.assertAlmostEqual(d["capacidad_maxima_mwh"] * 1000, e["kwh"])
            self.assertEqual((d["latitud"], d["longitud"]), (e["lat"], e["lon"]))
            self.assertIsNone(d.get("punto_de_conexion_kv"))  # aclaración 2: sin nivel de tensión

    def test_cada_aporte_valida_con_el_esquema_de_proyectos(self):
        cols = ESQUEMAS["proyectos"]["columnas"]
        with tempfile.TemporaryDirectory() as tmp:
            ruta = Path(tmp) / "proyectos.csv"
            with ruta.open("w", encoding="utf-8", newline="") as f:
                w = csv.writer(f)
                w.writerow([c["nombre"] for c in cols])
                for p in propuestas():
                    d = p["datos"]
                    self.assertTrue(set(d) <= {columna_sql(c["nombre"]) for c in cols}, d.keys())
                    w.writerow(["" if d.get(columna_sql(c["nombre"])) is None else d[columna_sql(c["nombre"])]
                                for c in cols])
            errores, _, filas = validar_tabla("proyectos", ESQUEMAS["proyectos"], ruta, ESQUEMAS["_mensajes"])
        self.assertEqual(errores, [])
        self.assertEqual(len(filas), 3)


if __name__ == "__main__":
    unittest.main()
