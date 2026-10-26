"""005 · T06 · RF-07, CA-07.1: la skill buscar-noticias propone por la cola de aportes y no
escribe en datos/noticias.csv. Correr con: python -m unittest discover pruebas"""
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent / ".claude" / "skills" / "buscar-noticias" / "SKILL.md"


class TestSkillBuscarNoticias(unittest.TestCase):
    def setUp(self):
        self.texto = SKILL.read_text(encoding="utf-8")

    def test_propone_con_el_script_de_aportes(self):
        self.assertIn("scripts/proponer_aporte.py", self.texto)
        self.assertIn("--carpeta", self.texto)

    def test_no_edita_el_csv_ni_usa_la_columna_vieja(self):
        self.assertNotIn("agrega como 'Pendiente' a datos/noticias.csv", self.texto)
        self.assertNotIn("`revision`", self.texto)
        self.assertIn("No edites `datos/noticias.csv`", self.texto)

    def test_exige_verificar_la_nota_y_resumen_propio(self):
        for frase in ("fecha", "enlace", "resumen propio", "/admin"):
            self.assertIn(frase, self.texto)
