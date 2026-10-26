"""005 · T07 · RF-06, RNF-08: las propuestas de la carga inicial de noticias son válidas antes de
enviarlas a la cola de aportes. Cada archivo de specs/005-noticias/propuestas/ es un aporte de
tipo Noticia con los datos de la tabla noticias. Correr con: python -m unittest discover pruebas"""
import datetime
import json
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from validar_datos import columna_sql, validar_valor  # noqa: E402

CARPETA = RAIZ / "specs" / "005-noticias" / "propuestas"
ESQUEMAS = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
COLUMNAS = [c for c in ESQUEMAS["noticias"]["columnas"] if c["nombre"] != "publicacion"]


def propuestas():
    return {p.name: json.loads(p.read_text(encoding="utf-8")) for p in sorted(CARPETA.glob("*.json"))}


class TestPropuestasNoticias(unittest.TestCase):
    def test_hay_carga_inicial(self):
        self.assertGreater(len(propuestas()), 0, "no hay propuestas de noticias")

    def test_cada_propuesta_es_un_aporte_noticia_valido(self):
        for nombre, p in propuestas().items():
            with self.subTest(archivo=nombre):
                self.assertEqual(p.get("tipo"), "Noticia")
                self.assertEqual(p.get("agente"), "buscar-noticias")
                self.assertTrue(str(p.get("descripcion", "")).strip())
                d = p["datos"]
                for c in COLUMNAS:
                    valor = str(d.get(columna_sql(c["nombre"])) or "")
                    self.assertIsNone(validar_valor(c, valor, ESQUEMAS["_mensajes"]), f"{c['nombre']} = {valor!r}")
                self.assertTrue(str(d.get("resumen") or "").strip(), "falta el resumen")
                self.assertEqual(set(d) - {columna_sql(c["nombre"]) for c in COLUMNAS}, set(), "columnas desconocidas")
                self.assertEqual(p["fuente"], d["enlace"].split()[0])

    def test_fecha_desde_2025_y_no_futura(self):
        hoy = datetime.date.today().isoformat()
        for nombre, p in propuestas().items():
            with self.subTest(archivo=nombre):
                self.assertTrue("2025-01-01" <= p["datos"]["fecha"] <= hoy, p["datos"]["fecha"])

    def test_enlaces_sin_repetir(self):
        enlaces = [p["datos"]["enlace"].split()[0] for p in propuestas().values()]
        self.assertEqual(len(enlaces), len(set(enlaces)), "hay enlaces repetidos")


if __name__ == "__main__":
    unittest.main()
