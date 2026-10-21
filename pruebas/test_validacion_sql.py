"""T20 · RF-16 · CA-16.1: la base valida con los mismos mensajes que la web y la importación.
La validación SQL se genera desde datos/esquemas.json (scripts/generar_validacion_sql.py) y la
última migración que la regenera (0004) debe contener exactamente lo generado. Correr con: python -m unittest discover pruebas"""
import json
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from generar_validacion_sql import INICIO, FIN, generar  # noqa: E402

MIGRACION = RAIZ / "supabase" / "migrations" / "0004_servicios.sql"
ESQUEMAS = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))


class TestValidacionSql(unittest.TestCase):
    def test_la_migracion_contiene_exactamente_lo_generado(self):
        texto = MIGRACION.read_text(encoding="utf-8")
        bloque = texto[texto.index(INICIO):texto.index(FIN) + len(FIN)]
        self.assertEqual(bloque.strip(), generar(ESQUEMAS).strip(),
                         "Vuelve a generar con: python scripts/generar_validacion_sql.py")

    def test_cada_enum_lleva_el_mensaje_de_la_plantilla(self):
        sql = generar(ESQUEMAS)
        plantilla = ESQUEMAS["_mensajes"]["valores"]
        for nombre in ("proyectos", "normativa", "noticias", "aportes"):
            for c in ESQUEMAS[nombre]["columnas"]:
                if c["tipo"] == "enum" and not c.get("privado"):
                    esperado = plantilla.format(columna=c["nombre"], valor="%s", valores=", ".join(c["valores"]))
                    self.assertIn(esperado.replace("'", "''"), sql, f"{nombre}.{c['nombre']}")

    def test_lista_valida_cada_valor_con_el_mensaje_de_la_plantilla(self):
        """002 · RF-14 · CA-14.1: 'Tipo uso/conexión' se separa por coma y cada valor debe estar en la lista."""
        sql = generar(ESQUEMAS)
        c = next(c for c in ESQUEMAS["proyectos"]["columnas"] if c["nombre"] == "Tipo uso/conexión")
        esperado = ESQUEMAS["_mensajes"]["valores"].format(columna=c["nombre"], valor="%s", valores=", ".join(c["valores"]))
        self.assertIn(esperado.replace("'", "''"), sql)
        self.assertIn("regexp_split_to_table(new.tipo_uso_conexion, ',')", sql)

    def test_0004_convierte_los_textos_viejos_de_servicios(self):
        texto = MIGRACION.read_text(encoding="utf-8")
        self.assertIn("'Inyección de energia por la noche'", texto)
        self.assertIn("'Mercado regulado a través de los contratos de largo plazo'", texto)

    def test_rangos_obligatorios_y_enlaces(self):
        sql = generar(ESQUEMAS)
        m = ESQUEMAS["_mensajes"]
        self.assertIn(m["rango"].format(columna="Latitud", valor="%s", min="-4.3", max="13.5").replace("'", "''"), sql)
        self.assertIn(m["obligatorio"].format(columna="Nombre").replace("'", "''"), sql)
        self.assertIn(m["urls"].format(columna="Fuente").replace("'", "''"), sql)
        self.assertNotIn("correo", sql)  # columna privada: vive en aportantes

    def test_un_disparador_por_tabla(self):
        sql = generar(ESQUEMAS)
        for tabla in ("proyectos", "normas", "noticias", "aportes"):
            self.assertIn(f"create trigger validar_{tabla} before insert or update on public.{tabla}", sql)


if __name__ == "__main__":
    unittest.main()
