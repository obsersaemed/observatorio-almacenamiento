"""T20 · RF-16 · CA-16.1: la base valida con los mismos mensajes que la web y la importación.
La validación SQL se genera desde datos/esquemas.json (scripts/generar_validacion_sql.py) y la
última migración que la regenera (0008) debe contener exactamente lo generado. Correr con: python -m unittest discover pruebas"""
import json
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from generar_validacion_sql import INICIO, FIN, generar  # noqa: E402

MIGRACION = RAIZ / "supabase" / "migrations" / "0008_servicios_sheet.sql"  # la última que regenera la validación
M0007 = RAIZ / "supabase" / "migrations" / "0007_segmento.sql"
MIGRACION_0004 = RAIZ / "supabase" / "migrations" / "0004_servicios.sql"
MIGRACION_0005 = RAIZ / "supabase" / "migrations" / "0005_vehiculos.sql"  # tablas de vehículos (003)
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
        texto = MIGRACION_0004.read_text(encoding="utf-8")
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
        for tabla in ("proyectos", "normas", "noticias", "aportes", "vehiculos_lineas", "vehiculos_ventas"):
            self.assertIn(f"create trigger validar_{tabla} before insert or update on public.{tabla}", sql)


    def test_003_entero_y_min_de_con_el_mensaje_de_la_plantilla(self):
        """003 · T04 · CA-14.1: la base rechaza con el mismo texto que el validador y la web."""
        sql = generar(ESQUEMAS)
        m = ESQUEMAS["_mensajes"]
        self.assertIn(m["entero"].format(columna="Unidades", valor="%s").replace("'", "''"), sql)
        self.assertIn("new.unidades <> trunc(new.unidades)", sql)
        self.assertIn(m["rango"].format(columna="Unidades", valor="%s", min=0, max="inf").replace("'", "''"), sql)
        esperado = m["min_de"].format(columna="Capacidad máxima [kWh]", valor="%s", otra="Capacidad mínima [kWh]")
        self.assertIn(esperado.replace("'", "''"), sql)
        self.assertIn("new.capacidad_maxima_kwh < new.capacidad_minima_kwh", sql)


def funcion(sql, tabla):
    """Cuerpo de public.validar_<tabla>() dentro del SQL generado."""
    inicio = sql.index(f"create or replace function public.validar_{tabla}()")
    return sql[inicio:sql.index("$$;", inicio)]


class TestSegmento0007(unittest.TestCase):
    """008 · T02 · RF-02, RF-09, RF-10: servicio nuevo, sin mezcla de segmentos, fuente según segmento."""
    MEDIDOR = "Maximización de autoconsumo PV y respaldo"

    @classmethod
    def setUpClass(cls):
        cls.sql = generar(ESQUEMAS)
        cls.migracion = M0007.read_text(encoding="utf-8") if M0007.exists() else ""

    def test_la_0007_existe_y_no_agrega_columnas(self):
        self.assertTrue(M0007.exists(), f"Falta {M0007}")
        self.assertNotRegex(self.migracion, r"(?i)add\s+column")
        self.assertNotRegex(self.migracion, r"(?i)create\s+table")

    def test_la_0007_reemplaza_el_check_de_fuente_en_proyectos_y_aportes(self):
        for tabla in ("proyectos", "aportes"):
            self.assertIn(f"alter table public.{tabla} drop constraint if exists {tabla}_fuente_check", self.migracion)
            self.assertNotRegex(self.migracion, rf"{tabla}_fuente_check check \(fuente ~")

    def test_el_disparador_acepta_el_servicio_nuevo(self):
        self.assertIn(f"'{self.MEDIDOR}'", funcion(self.sql, "proyectos"))

    def test_el_disparador_rechaza_la_mezcla_nombrando_la_columna(self):
        esperado = ESQUEMAS["_mensajes"]["segmentos"].format(columna="Tipo uso/conexión", segmentos="%s")
        cuerpo = funcion(self.sql, "proyectos")
        self.assertIn(esperado.replace("'", "''"), cuerpo)
        self.assertIn("count(distinct", cuerpo)

    def test_fuente_textual_solo_con_un_servicio_del_segmento(self):
        urls_proyectos = next(l for l in funcion(self.sql, "proyectos").splitlines() if "u !~" in l and "new.fuente" in l)
        self.assertIn("new.tipo_uso_conexion", urls_proyectos)
        self.assertIn(f"'{self.MEDIDOR}'", urls_proyectos)
        self.assertIn("'Detrás del medidor'", urls_proyectos)
        urls_aportes = next(l for l in funcion(self.sql, "aportes").splitlines() if "u !~" in l and "new.fuente" in l)
        self.assertIn("new.datos ->> 'tipo_uso_conexion'", urls_aportes)
        self.assertIn("'Detrás del medidor'", urls_aportes)

    def test_las_demas_tablas_siguen_exigiendo_url_sin_condicion(self):
        for tabla in ("normas", "noticias"):
            linea = next(l for l in funcion(self.sql, tabla).splitlines() if "u !~" in l)
            self.assertNotIn("Detrás del medidor", linea)


class TestMigracionVehiculos(unittest.TestCase):
    """003 · T04 · RF-12, CA-14.1: importación atómica y registro de importaciones."""

    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRACION_0005.read_text(encoding="utf-8") if MIGRACION_0005.exists() else ""

    def test_registro_de_importaciones_con_actualizacion_y_corte(self):
        self.assertRegex(self.sql, r"create table public\.vehiculos_importaciones")
        self.assertRegex(self.sql, r"actualizado_en\s+timestamptz not null default now\(\)")
        self.assertRegex(self.sql, r"corte\s+date not null")

    def test_reemplazo_atomico_solo_para_la_llave_de_servicio(self):
        self.assertIn("create or replace function public.reemplazar_vehiculos(p_lineas jsonb, p_ventas jsonb, p_corte date)", self.sql)
        self.assertRegex(self.sql, r"revoke all on function public\.reemplazar_vehiculos\(jsonb, jsonb, date\) from public, anon, authenticated")
        self.assertRegex(self.sql, r"grant execute on function public\.reemplazar_vehiculos\(jsonb, jsonb, date\) to service_role")

    def test_lectura_publica_sin_escritura(self):
        for t in ("vehiculos_lineas", "vehiculos_ventas", "vehiculos_importaciones"):
            self.assertRegex(self.sql, rf"alter table public\.{t} enable row level security")
            self.assertRegex(self.sql, rf"create policy \"publico lee {t}\" on public\.{t} for select")


if __name__ == "__main__":
    unittest.main()


class TestServiciosSheet0008(unittest.TestCase):
    """2026-10-27: lista de servicios de la Hoja 1 y renombre de «Canadian solar» sin duplicar."""

    @classmethod
    def setUpClass(cls):
        cls.migracion = MIGRACION.read_text(encoding="utf-8") if MIGRACION.exists() else ""

    def test_el_generador_escribe_en_la_0008(self):
        from generar_validacion_sql import MIGRACION as destino
        self.assertEqual(destino.name, "0008_servicios_sheet.sql")

    def test_la_0008_trae_la_lista_nueva_y_no_agrega_columnas(self):
        self.assertIn("Alivio de retrasos en proyectos de transmisión", self.migracion)
        self.assertIn("Mercado regulado a través de los contratos de largo plazo", self.migracion)
        self.assertNotIn("'Mercado regulado a través de contratos de largo plazo'", self.migracion)
        self.assertNotRegex(self.migracion, r"(?i)add\s+column")

    def test_la_0008_renombra_canadian_solar_antes_de_importar(self):
        self.assertIn("update public.proyectos set nombre = 'UPME STR 01-2021' where nombre = 'Canadian solar';",
                      self.migracion)
