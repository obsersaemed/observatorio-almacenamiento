"""La GitHub Action del respaldo (T15, RF-13, RNF-08) corre a diario con la llave pública
desde secretos y solo hace commit de respaldo/. Correr con: python -m unittest discover pruebas"""
import re
import unittest
from pathlib import Path

FLUJO = Path(__file__).resolve().parent.parent / ".github" / "workflows" / "respaldo.yml"


class TestFlujoRespaldo(unittest.TestCase):
    def setUp(self):
        self.assertTrue(FLUJO.exists(), f"Falta {FLUJO}")
        self.texto = FLUJO.read_text(encoding="utf-8")

    def test_corre_una_vez_al_dia_y_a_mano(self):
        m = re.search(r"cron:\s*['\"]([^'\"]+)['\"]", self.texto)
        self.assertIsNotNone(m)
        minuto, hora, dia, mes, semana = m.group(1).split()
        self.assertTrue(minuto.isdigit() and hora.isdigit())
        self.assertEqual((dia, mes, semana), ("*", "*", "*"))
        self.assertIn("workflow_dispatch", self.texto)

    def test_usa_la_llave_publica_desde_secretos_y_nunca_la_de_servicio(self):
        self.assertIn("scripts/respaldo.py --entorno env", self.texto)
        self.assertIn("secrets.SUPABASE_URL", self.texto)
        self.assertIn("secrets.SUPABASE_ANON_KEY", self.texto)
        self.assertNotIn("SERVICE_ROLE", self.texto)

    def test_solo_hace_commit_de_respaldo_y_si_hubo_cambios(self):
        self.assertIn("git add respaldo", self.texto)
        self.assertIn("git diff --cached --quiet", self.texto)
        self.assertNotRegex(self.texto, r"git add (-A|\.)\b")


if __name__ == "__main__":
    unittest.main()
