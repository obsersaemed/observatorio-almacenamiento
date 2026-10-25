"""Pruebas del validador. Correr con: python -m unittest discover pruebas"""
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from validar_datos import numero, validar  # noqa: E402

ENC_PROY = ("Nombre,Operador,Estado,Tecnologia,FPO,Tipo uso/conexión,Punto de conexión kV,Departamento,"
            "Municipio,Latitud,Longitud,Potencia nominal [MW],Capacidad máxima [MWh],"
            "Potencia máxima de descarga [MW],Potencia máxima de carga [MW],"
            "Estado de carga mínimo técnico [%],Eficiencia mínima [%],Eficiencia de carga [%],"
            "Eficiencia de descarga [%],Eficiencia de almacenamiento [%],"
            "Tiempo para aporte de máxima potencia [%],Tipo de compensación adicional,Fuente\n")


def fila_proyecto(estado="En operación", lat='"4,9653"', lon='"-73,9128"', servicios=""):
    return f"P1,Op,{estado},Li-ion,2024,{servicios},115,Cundinamarca,Tocancipá,{lat},{lon},7,\"3,9\",,,,,,,,,,https://ejemplo.co\n"


class TestValidador(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        shutil.copy(RAIZ / "datos" / "esquemas.json", self.dir)
        for n in ("normativa.csv", "noticias.csv", "vehiculos_lineas.csv", "vehiculos_ventas.csv"):
            shutil.copy(RAIZ / "datos" / n, self.dir)

    def tearDown(self):
        shutil.rmtree(self.dir)

    def proyectos(self, contenido):
        (self.dir / "proyectos.csv").write_text(contenido, encoding="utf-8")
        return validar(self.dir)

    def test_numero_coma_decimal(self):
        self.assertEqual(numero("4,9653"), 4.9653)
        self.assertEqual(numero("1.234,5"), 1234.5)
        self.assertIsNone(numero("abc"))

    def test_fila_valida(self):
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertEqual(errores, [])

    def test_latitud_fuera_de_colombia(self):
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto(lat='"49,653"'))
        self.assertTrue(any("Latitud" in e and "fuera de rango" in e for e in errores))

    def test_estado_no_permitido(self):
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto(estado="Planeado"))
        self.assertTrue(any("Estado" in e for e in errores))

    def test_servicios_de_la_lista_separados_por_coma(self):
        dos = '"Regulación primaria de frecuencia, Inyección de energía en la noche"'
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto(servicios=dos))
        self.assertEqual(errores, [])

    def test_servicio_fuera_de_la_lista(self):
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto(servicios="Servicio X"))
        esquema = json.loads((self.dir / "esquemas.json").read_text(encoding="utf-8"))
        col = next(c for c in esquema["proyectos"]["columnas"] if c["nombre"] == "Tipo uso/conexión")
        esperado = esquema["_mensajes"]["valores"].format(
            columna="Tipo uso/conexión", valor="Servicio X", valores=", ".join(col["valores"]))
        self.assertTrue(any(e.endswith(esperado) for e in errores), errores)

    def test_columnas_en_otro_orden(self):
        enc = ENC_PROY.replace("Nombre,Operador", "Operador,Nombre")
        errores, _ = self.proyectos(enc + fila_proyecto())
        self.assertTrue(any("columna 1" in e for e in errores))

    def test_sin_coordenadas_es_aviso(self):
        errores, avisos = self.proyectos(ENC_PROY + fila_proyecto(lat="", lon=""))
        self.assertEqual(errores, [])
        self.assertTrue(any("Latitud" in a for a in avisos))

    def test_mensajes_salen_de_las_plantillas(self):
        # La web (zod) usa las mismas plantillas: el mensaje es idéntico en ambas vías.
        esquemas = json.loads((self.dir / "esquemas.json").read_text(encoding="utf-8"))
        plantilla = esquemas["_mensajes"]["valores"]
        valores = next(c for c in esquemas["proyectos"]["columnas"] if c["nombre"] == "Estado")["valores"]
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto(estado="Planeado"))
        esperado = plantilla.format(columna="Estado", valor="Planeado", valores=", ".join(valores))
        self.assertTrue(any(e.endswith(esperado) for e in errores), errores)

    def test_esquemas_sin_archivo_no_se_validan_como_csv(self):
        # 'aportes' vive solo en la base de datos: no hay CSV que exigir.
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertFalse(any("aportes" in e for e in errores), errores)

    def test_lee_csv_guardado_por_excel_en_codificacion_windows(self):
        # Excel en Windows exporta CSV en cp1252 (no UTF-8); las tildes deben leerse bien.
        (self.dir / "proyectos.csv").write_bytes((ENC_PROY + fila_proyecto()).encode("cp1252"))
        errores, _ = validar(self.dir)
        self.assertEqual(errores, [])

    def test_noticia_con_norma_inexistente(self):
        (self.dir / "noticias.csv").write_text(
            "fecha,titulo,medio,enlace,resumen,etiquetas,proyecto_relacionado,norma_relacionada,publicacion\n"
            "2026-10-01,T,M,https://a.co,,,,CREG-X,Pendiente\n", encoding="utf-8")
        errores, avisos = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertEqual(errores, [])
        self.assertTrue(any("CREG-X" in a for a in avisos))

    def test_estudio_academico_es_una_fila_valida(self):
        """004 · T01 · aclaración 1: los estudios van en normativa con emisor Academia y tipo Estudio."""
        (self.dir / "normativa.csv").write_text(
            "id,fecha,precision_fecha,emisor,tipo,numero,titulo,estado,resumen,explicacion,aplica_a,relacionada_con,enlace\n"
            "ACADEMIA-ESTUDIO-X-2024,2024-01-01,Año,Academia,Estudio,X,Estudio ficticio,Vigente,,,,,https://repositorio.unal.edu.co/x\n",
            encoding="utf-8")
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertEqual(errores, [])

    def test_precision_de_fecha(self):
        """004 · T19 · CA-04.3: una norma sin día lleva precision_fecha Mes o Año."""
        enc = "id,fecha,precision_fecha,emisor,tipo,numero,titulo,estado,resumen,explicacion,aplica_a,relacionada_con,enlace\n"
        fila = "XM-DOC-X-2026,2026-04-01,{},XM,Documento,X,Doc ficticio,En consulta,,,,,https://www.xm.com.co/x\n"
        (self.dir / "normativa.csv").write_text(enc + fila.format("Mes"), encoding="utf-8")
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertEqual(errores, [])
        (self.dir / "normativa.csv").write_text(enc + fila.format("Semana"), encoding="utf-8")
        errores, _ = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertTrue(any("precision_fecha" in e for e in errores))


ENC_LINEAS = "Marca,Línea,Tipo de batería,Capacidad mínima [kWh],Capacidad máxima [kWh],Potencia [kW]\n"
ENC_VENTAS = "Línea,Año,Unidades\n"


class TestVehiculos(unittest.TestCase):
    """003 · T01 · RF-14, CA-14.1: reglas de vehículos (datos ficticios)."""

    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        shutil.copy(RAIZ / "datos" / "esquemas.json", self.dir)
        for n in ("proyectos.csv", "normativa.csv", "noticias.csv"):
            shutil.copy(RAIZ / "datos" / n, self.dir)
        self.esquemas = json.loads((self.dir / "esquemas.json").read_text(encoding="utf-8"))

    def tearDown(self):
        shutil.rmtree(self.dir)

    def validar(self, lineas, ventas):
        (self.dir / "vehiculos_lineas.csv").write_text(ENC_LINEAS + lineas, encoding="utf-8")
        (self.dir / "vehiculos_ventas.csv").write_text(ENC_VENTAS + ventas, encoding="utf-8")
        return validar(self.dir)

    def mensaje(self, clave, **datos):
        return self.esquemas["_mensajes"][clave].format(**datos)

    def test_caso_valido(self):
        errores, _ = self.validar("Marca A,Linea 1,LFP,40,60,100\n", "Linea 1,2024,100\nLinea 1,2025,0\n")
        self.assertEqual(errores, [])

    def test_unidades_no_enteras_o_negativas(self):
        errores, _ = self.validar("Marca A,Linea 1,LFP,40,60,\n", 'Linea 1,2024,"2,5"\nLinea 1,2025,-3\n')
        self.assertTrue(any(e.endswith(self.mensaje("entero", columna="Unidades", valor="2,5")) for e in errores), errores)
        self.assertTrue(any(e.endswith(self.mensaje("rango", columna="Unidades", valor="-3", min=0, max="inf")) for e in errores), errores)

    def test_tipo_de_bateria_fuera_de_la_lista(self):
        errores, _ = self.validar("Marca A,Linea 1,NMC,40,60,\n", "")
        col = next(c for c in self.esquemas["vehiculos_lineas"]["columnas"] if c["nombre"] == "Tipo de batería")
        self.assertEqual(col["valores"], ["LFP", "Lithium-ion", "NMC Lithium-ion", "ULTIUM"])
        self.assertTrue(any("'Tipo de batería' = 'NMC'" in e for e in errores), errores)

    def test_capacidad_maxima_menor_que_la_minima(self):
        errores, _ = self.validar("Marca A,Linea 1,LFP,60,40,\n", "")
        esperado = self.mensaje("min_de", columna="Capacidad máxima [kWh]", valor="40", otra="Capacidad mínima [kWh]")
        self.assertTrue(any(e.endswith(esperado) for e in errores), errores)

    def test_venta_de_una_linea_inexistente_es_error(self):
        errores, _ = self.validar("Marca A,Linea 1,LFP,40,60,\n", "Linea 9,2024,10\n")
        self.assertTrue(any("Linea 9" in e and "vehiculos_lineas" in e for e in errores), errores)

    def test_linea_y_anio_repetidos(self):
        errores, _ = self.validar("Marca A,Linea 1,LFP,40,60,\n", "Linea 1,2024,10\nLinea 1,2024,5\n")
        self.assertTrue(any("repetido" in e for e in errores), errores)


if __name__ == "__main__":
    unittest.main()
