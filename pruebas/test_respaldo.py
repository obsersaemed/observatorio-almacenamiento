"""Respaldo diario (T15, RF-13, RNF-08, CA-13.1): CSV de los datos publicados, sin correos,
todo o nada. Correr con: python -m unittest discover pruebas"""
import csv
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from respaldo import respaldar  # noqa: E402
from supabase_rest import ClienteRest  # noqa: E402
from test_importar import ServidorFalso  # noqa: E402

ESQUEMAS = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))

FILAS = {
    "proyectos": [{"nombre": "BESS, Termozipa", "estado": "En operación", "departamento": "Cundinamarca",
                   "municipio": "Tocancipá", "latitud": 4.9653, "fuente": "https://e.co/a",
                   "publicacion": "Aprobado", "correo": "no@debe.salir", "id": 3}],
    "normas": [],
    "noticias": [{"fecha": "2026-10-20", "titulo": "Subasta", "medio": "Ejemplo", "enlace": "https://e.co/n",
                  "publicacion": "Aprobado"}],
}


def respuesta_por_tabla(ruta):
    tabla = ruta.split("/rest/v1/")[1].split("?")[0]
    return FILAS[tabla]


class TestRespaldo(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.dir)

    def correr(self, estado=200):
        servidor = ServidorFalso(estado, cuerpo=respuesta_por_tabla)
        self.addCleanup(servidor.cerrar)
        codigo, mensajes = respaldar(ClienteRest(servidor.url, "llave-publica"), ESQUEMAS, self.dir)
        return codigo, mensajes, servidor.peticiones

    def leer(self, nombre):
        return list(csv.reader(io.StringIO((self.dir / nombre).read_text(encoding="utf-8"))))

    def test_escribe_un_csv_por_tabla_publicada_con_las_columnas_del_esquema(self):
        codigo, mensajes, peticiones = self.correr()
        self.assertEqual(codigo, 0, mensajes)
        self.assertEqual(sorted(p.name for p in self.dir.iterdir()), ["normativa.csv", "noticias.csv", "proyectos.csv"])
        filas = self.leer("proyectos.csv")
        self.assertEqual(filas[0][0], "Nombre")
        self.assertEqual(filas[0][-1], "Fuente")
        self.assertEqual(filas[1][0], "BESS, Termozipa")
        self.assertEqual(len(self.leer("normativa.csv")), 1)  # solo encabezado

    def test_solo_pide_lo_aprobado_y_en_orden_estable(self):
        _, _, peticiones = self.correr()
        for p in peticiones:
            self.assertIn("publicacion=eq.Aprobado", p["ruta"])
            self.assertIn("order=", p["ruta"])

    def test_nunca_escribe_correos_ni_columnas_internas(self):
        self.correr()
        texto = (self.dir / "proyectos.csv").read_text(encoding="utf-8")
        self.assertNotIn("no@debe.salir", texto)
        self.assertNotIn("publicacion", texto)

    def test_si_la_api_falla_no_deja_archivos_a_medias_y_sale_con_error(self):
        (self.dir / "proyectos.csv").write_text("respaldo anterior", encoding="utf-8")
        codigo, mensajes, _ = self.correr(estado=500)
        self.assertNotEqual(codigo, 0)
        self.assertEqual((self.dir / "proyectos.csv").read_text(encoding="utf-8"), "respaldo anterior")
        self.assertIn("falla simulada", "\n".join(mensajes))


if __name__ == "__main__":
    unittest.main()
