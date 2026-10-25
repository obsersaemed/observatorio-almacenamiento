"""004 · T11 · RF-14, RNF-08: las propuestas de la carga inicial de normativa son válidas antes
de enviarlas a la cola de aportes. Cada archivo de specs/004-normativa/propuestas/ es un aporte
de tipo Norma con los datos de la tabla normas (nombres SQL).
Correr con: python -m unittest discover pruebas"""
import json
import re
import sys
import unittest
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from validar_datos import columna_sql, validar_valor  # noqa: E402

CARPETA = RAIZ / "specs" / "004-normativa" / "propuestas"
ESQUEMAS = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))

# Lotes de la carga inicial (plan T12–T16, con las decisiones del usuario del 2026-10-24).
LOTES = {
    "CREG": ["CREG-PRY-127-2018", "CREG-DOC-064-2019", "CREG-RES-098-2019", "CREG-PRY-074-2021", "CREG-RES-110-2021",
             "CREG-RES-101023-2022", "CREG-PRY-701103-2025", "CREG-DOC-901225-2025", "CREG-RES-101113-2026"],
    "CNO": ["CNO-ACU-1354-2020", "CNO-ACU-1898-2024", "CNO-ACU-2028-2025", "CNO-ACU-2231-2026", "CNO-ACU-2234-2026"],  # 2186 ya fue sustituido por 2234
    "XM": ["XM-DOC-CND020-2020", "XM-DOC-MODELOSAEB-2026", "XM-DOC-GRIDFORMING-2026"],
    "MME y Congreso": ["CONGRESO-LEY-1715-2014", "CONGRESO-LEY-2099-2021", "MME-RES-40156-2022",
                       "MME-DEC-2236-2023", "MME-DEC-393-2026", "MME-RES-40178-2026"],
    "Academia": ["ACADEMIA-EST-BARRERAS-2025", "ACADEMIA-EST-CLAVES-2025"],
}
ID = re.compile(r"^(CREG|MME|CNO|UPME|XM|CONGRESO|ACADEMIA)-(LEY|DEC|RES|PRY|ACU|CIR|DOC|EST)-[A-Z0-9]+-(\d{4})$")
DOMINIOS = ("creg.gov.co", "funcionpublica.gov.co", "cno.org.co", "xm.com.co", "upme.gov.co",
            "minenergia.gov.co", "repositorio.unal.edu.co")


def propuestas():
    return {p.name: json.loads(p.read_text(encoding="utf-8")) for p in sorted(CARPETA.glob("*.json"))}


class TestPropuestasNormativa(unittest.TestCase):
    def test_cada_lote_esta_completo(self):
        ids = {p["datos"].get("id") for p in propuestas().values()}
        for lote, esperados in LOTES.items():
            faltan = [i for i in esperados if i not in ids]
            self.assertEqual(faltan, [], f"Lote {lote}: faltan propuestas")

    def test_no_hay_ids_repetidos_ni_fuera_de_los_lotes(self):
        ids = [p["datos"].get("id") for p in propuestas().values()]
        self.assertEqual(len(ids), len(set(ids)), "ids repetidos")
        esperados = {i for lote in LOTES.values() for i in lote}
        self.assertEqual(set(ids) - esperados, set(), "propuestas que no están en ningún lote")

    def test_cada_propuesta_es_un_aporte_norma_valido(self):
        columnas = ESQUEMAS["normativa"]["columnas"]
        for nombre, p in propuestas().items():
            with self.subTest(archivo=nombre):
                self.assertEqual(p.get("tipo"), "Norma")
                self.assertEqual(p.get("agente"), "ficha-normativa")
                self.assertTrue(str(p.get("descripcion", "")).strip())
                datos = p["datos"]
                for c in columnas:
                    valor = str(datos.get(columna_sql(c["nombre"])) or "")
                    self.assertIsNone(validar_valor(c, valor, ESQUEMAS["_mensajes"]), f"{c['nombre']} = {valor!r}")
                for clave in ("resumen", "explicacion"):
                    self.assertTrue(str(datos.get(clave) or "").strip(), f"falta {clave}")
                self.assertEqual(set(datos) - {columna_sql(c["nombre"]) for c in columnas}, set(), "columnas desconocidas")

    def test_id_con_formato_y_el_anio_de_la_fecha(self):
        for nombre, p in propuestas().items():
            with self.subTest(archivo=nombre):
                d = p["datos"]
                m = ID.match(d["id"])
                self.assertIsNotNone(m, d["id"])
                self.assertEqual(m.group(3), d["fecha"][:4])
                self.assertEqual(d["emisor"].upper(), m.group(1))

    def test_fecha_sin_dia_guarda_el_primero(self):
        for nombre, p in propuestas().items():
            d = p["datos"]
            with self.subTest(archivo=nombre):
                if d.get("precision_fecha") == "Mes":
                    self.assertTrue(d["fecha"].endswith("-01"))
                if d.get("precision_fecha") == "Año":
                    self.assertTrue(d["fecha"].endswith("-01-01"))

    def test_enlaces_y_fuente_oficiales(self):
        for nombre, p in propuestas().items():
            with self.subTest(archivo=nombre):
                for url in p["datos"]["enlace"].split() + [p["fuente"]]:
                    host = urlparse(url).hostname or ""
                    self.assertTrue(any(host == d or host.endswith("." + d) for d in DOMINIOS), url)

    def test_relacionadas_con_formato_de_id(self):
        for nombre, p in propuestas().items():
            for rel in filter(None, (r.strip() for r in (p["datos"].get("relacionada_con") or "").split(";"))):
                with self.subTest(archivo=nombre, relacionada=rel):
                    self.assertIsNotNone(ID.match(rel), rel)


if __name__ == "__main__":
    unittest.main()
