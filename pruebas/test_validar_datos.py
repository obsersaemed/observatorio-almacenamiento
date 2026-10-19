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


def fila_proyecto(estado="En operación", lat='"4,9653"', lon='"-73,9128"'):
    return f"P1,Op,{estado},Li-ion,2024,STN,115,Cundinamarca,Tocancipá,{lat},{lon},7,\"3,9\",,,,,,,,,,https://ejemplo.co\n"


class TestValidador(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        shutil.copy(RAIZ / "datos" / "esquemas.json", self.dir)
        for n in ("normativa.csv", "noticias.csv"):
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

    def test_noticia_con_norma_inexistente(self):
        (self.dir / "noticias.csv").write_text(
            "fecha,titulo,medio,enlace,resumen,etiquetas,proyecto_relacionado,norma_relacionada,revision\n"
            "2026-10-01,T,M,https://a.co,,,,CREG-X,Pendiente\n", encoding="utf-8")
        errores, avisos = self.proyectos(ENC_PROY + fila_proyecto())
        self.assertEqual(errores, [])
        self.assertTrue(any("CREG-X" in a for a in avisos))


if __name__ == "__main__":
    unittest.main()
