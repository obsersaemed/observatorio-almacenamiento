"""La migración SQL debe reflejar datos/esquemas.json: tablas, columnas, valores
permitidos, rangos, obligatorios y RLS. Correr con: python -m unittest discover pruebas"""
import json
import re
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from validar_datos import columna_sql  # noqa: E402

MIGRACION = RAIZ / "supabase" / "migrations" / "0001_base.sql"
TABLAS_PRIVADAS = ("aportantes", "historial", "editores")


def bloque_tabla(sql, tabla):
    m = re.search(rf"create table (?:public\.)?{tabla}\s*\((.*?)\n\);", sql, re.S | re.I)
    return m.group(1) if m else None


class TestColumnaSql(unittest.TestCase):
    def test_nombres_derivados(self):
        self.assertEqual(columna_sql("Potencia nominal [MW]"), "potencia_nominal_mw")
        self.assertEqual(columna_sql("Tipo uso/conexión"), "tipo_uso_conexion")
        self.assertEqual(columna_sql("Estado de carga mínimo técnico [%]"), "estado_de_carga_minimo_tecnico")
        self.assertEqual(columna_sql("relacionada_con"), "relacionada_con")


class TestMigracion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))
        cls.sql = MIGRACION.read_text(encoding="utf-8") if MIGRACION.exists() else ""

    def test_existe_la_migracion(self):
        self.assertTrue(MIGRACION.exists(), f"Falta {MIGRACION}")

    def test_cada_columna_esta_en_su_tabla(self):
        for nombre, esq in self.esquemas.items():
            if nombre.startswith("_"):
                continue
            for c in esq["columnas"]:
                tabla = "aportantes" if c.get("privado") else esq["tabla"]
                bloque = bloque_tabla(self.sql, tabla)
                self.assertIsNotNone(bloque, f"Falta la tabla {tabla}")
                col = columna_sql(c["nombre"])
                self.assertRegex(bloque, rf"\n\s*{col}\s", f"{tabla}.{col} no está en la migración")
                if c.get("obligatorio"):
                    self.assertRegex(bloque, rf"\n\s*{col}\s[^\n]*not null", f"{tabla}.{col} debe ser not null")

    def test_valores_permitidos_y_rangos(self):
        for nombre, esq in self.esquemas.items():
            if nombre.startswith("_"):
                continue
            for c in esq["columnas"]:
                tabla = "aportantes" if c.get("privado") else esq["tabla"]
                bloque = bloque_tabla(self.sql, tabla) or ""
                col = columna_sql(c["nombre"])
                linea = next((l for l in bloque.split("\n") if re.match(rf"\s*{col}\s", l)), "")
                # Las columnas tipo lista se validan valor por valor en el disparador (0004), no con check.
                for v in (c.get("valores", []) if c["tipo"] == "enum" else []):
                    self.assertIn(f"'{v}'", linea, f"{tabla}.{col}: falta el valor '{v}' en el check")
                for limite in ("min", "max"):
                    if limite in c:
                        x = c[limite]
                        texto = str(int(x)) if float(x).is_integer() else str(x)
                        self.assertRegex(linea, rf"(?<![\d.]){re.escape(texto)}(?![\d.])",
                                         f"{tabla}.{col}: falta el {limite} {texto}")

    def test_tablas_publicables_tienen_estado_de_publicacion(self):
        for nombre in ("proyectos", "normativa", "noticias"):
            bloque = bloque_tabla(self.sql, self.esquemas[nombre]["tabla"]) or ""
            self.assertRegex(bloque, r"\n\s*publicacion\s[^\n]*'Pendiente'[^\n]*'Aprobado'[^\n]*'Rechazado'")

    def test_rls_activo_en_todas_las_tablas(self):
        tablas = {e["tabla"] for k, e in self.esquemas.items() if not k.startswith("_")} | set(TABLAS_PRIVADAS)
        for t in tablas:
            self.assertRegex(self.sql, rf"alter table (?:public\.)?{t} enable row level security",
                             f"{t} sin RLS")

    def test_tablas_privadas_sin_politicas_para_anonimos(self):
        for t in TABLAS_PRIVADAS:
            for pol in re.findall(rf"create policy [^;]*? on (?:public\.)?{t}\b[^;]*;", self.sql, re.S | re.I):
                self.assertNotRegex(pol, r"\bto\s+(anon|public)\b", f"política pública en {t}: {pol}")


if __name__ == "__main__":
    unittest.main()
