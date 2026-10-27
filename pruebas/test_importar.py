"""Importación inicial (T06, CA-15.1, CA-16.1) contra un servidor REST simulado.
Correr con: python -m unittest discover pruebas"""
import json
import shutil
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importar import importar  # noqa: E402
from supabase_rest import ClienteRest  # noqa: E402
from test_validar_datos import ENC_PROY, fila_proyecto  # noqa: E402
from validar_datos import columna_sql  # noqa: E402


class ServidorFalso:
    """Registra cada petición y responde con el estado configurado."""

    def __init__(self, estado=201, cuerpo=None):
        self.peticiones = []
        falso = self

        class Manejador(BaseHTTPRequestHandler):
            def do_POST(self):
                largo = int(self.headers.get("Content-Length", 0))
                falso.peticiones.append({
                    "ruta": self.path,
                    "cabeceras": {k.lower(): v for k, v in self.headers.items()},
                    "cuerpo": json.loads(self.rfile.read(largo) or b"null"),
                })
                self.send_response(estado)
                self.end_headers()
                if estado >= 400:
                    self.wfile.write(b'{"message":"falla simulada"}')
                elif cuerpo is not None:
                    self.wfile.write(json.dumps(cuerpo).encode("utf-8"))

            def do_GET(self):
                falso.peticiones.append({"ruta": self.path, "cabeceras": {k.lower(): v for k, v in self.headers.items()}})
                self.send_response(estado)
                self.end_headers()
                if estado >= 400:
                    self.wfile.write(b'{"message":"falla simulada"}')
                else:
                    respuesta = cuerpo(self.path) if callable(cuerpo) else cuerpo
                    self.wfile.write(json.dumps(respuesta if respuesta is not None else []).encode("utf-8"))

            def log_message(self, *args):
                pass

        self.servidor = ThreadingHTTPServer(("127.0.0.1", 0), Manejador)
        threading.Thread(target=self.servidor.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.servidor.server_address[1]}"

    def cerrar(self):
        self.servidor.shutdown()


class TestImportar(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.esquemas = json.loads((RAIZ / "datos" / "esquemas.json").read_text(encoding="utf-8"))

    def tearDown(self):
        shutil.rmtree(self.dir)

    def correr(self, contenido_csv, estado=201):
        csv = self.dir / "proyectos.csv"
        csv.write_text(contenido_csv, encoding="utf-8")
        servidor = ServidorFalso(estado)
        self.addCleanup(servidor.cerrar)
        codigo, mensajes = importar(csv, ClienteRest(servidor.url, "llave-de-prueba"), self.esquemas)
        return codigo, mensajes, servidor.peticiones

    def test_csv_con_coordenadas_corridas_rechaza_los_siete_y_no_envia_nada(self):
        # Copia fija de la primera exportación de la Sheet, con la coma decimal corrida.
        actual = (RAIZ / "pruebas" / "datos" / "proyectos_coordenadas_corridas.csv").read_text(encoding="utf-8-sig")
        codigo, mensajes, peticiones = self.correr(actual)
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])
        texto = "\n".join(mensajes)
        for nombre in ("BESS Termozipa", "La Martina", "Celsia Solar Palmira 2", "Canadian solar",
                       "Bosques Solares de los Llanos 8", "Parque solar andromeda", "Pradera solar"):
            self.assertIn(nombre, texto)
        self.assertIn("fuera de rango", texto)

    def test_csv_valido_envia_aprobados_con_nombres_sql_y_numeros(self):
        codigo, mensajes, peticiones = self.correr(ENC_PROY + fila_proyecto())
        self.assertEqual(codigo, 0, mensajes)
        self.assertEqual(len(peticiones), 1)
        p = peticiones[0]
        self.assertTrue(p["ruta"].startswith("/rest/v1/proyectos?on_conflict=nombre"))
        self.assertEqual(p["cabeceras"]["apikey"], "llave-de-prueba")
        self.assertIn("resolution=merge-duplicates", p["cabeceras"]["prefer"])
        fila = p["cuerpo"][0]
        self.assertEqual(fila["nombre"], "P1")
        self.assertEqual(fila["estado"], "En operación")
        self.assertEqual(fila["publicacion"], "Aprobado")
        self.assertAlmostEqual(fila["latitud"], 4.9653)
        self.assertAlmostEqual(fila["capacidad_maxima_mwh"], 3.9)
        self.assertEqual(fila["fuente"], "https://ejemplo.co")
        self.assertIsNone(fila["potencia_maxima_de_carga_mw"])
        self.assertIn("1 proyectos importados", "\n".join(mensajes))

    def test_estado_invalido_se_rechaza_con_el_mensaje_compartido(self):
        codigo, mensajes, peticiones = self.correr(ENC_PROY + fila_proyecto(estado="Planeado"))
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])
        valores = next(c for c in self.esquemas["proyectos"]["columnas"] if c["nombre"] == "Estado")["valores"]
        esperado = self.esquemas["_mensajes"]["valores"].format(
            columna="Estado", valor="Planeado", valores=", ".join(valores))
        self.assertTrue(any(esperado in m for m in mensajes), mensajes)

    def test_008_detras_del_medidor_con_fuente_textual_se_importa_sin_cambiar_el_encabezado(self):
        """008 · T08 · RF-09, CA-09.3: la fila del segmento entra con su fuente textual."""
        servicio = "Maximización de autoconsumo PV y respaldo"
        fuente = "Información de Azimut Energía (2026-10)"
        columnas = [c["nombre"] for c in self.esquemas["proyectos"]["columnas"]]
        self.assertEqual(",".join(columnas) + "\n", ENC_PROY)  # sin columnas nuevas
        codigo, mensajes, peticiones = self.correr(ENC_PROY + fila_proyecto(servicios=servicio, fuente=f'"{fuente}"'))
        self.assertEqual(codigo, 0, mensajes)
        fila = peticiones[0]["cuerpo"][0]
        self.assertEqual(fila["tipo_uso_conexion"], servicio)
        self.assertEqual(fila["fuente"], fuente)
        self.assertEqual(set(fila) - {"publicacion"}, {columna_sql(c) for c in columnas})

    def test_008_gran_escala_con_fuente_textual_no_se_importa(self):
        codigo, mensajes, peticiones = self.correr(ENC_PROY + fila_proyecto(fuente="Sin enlace"))
        self.assertNotEqual(codigo, 0)
        self.assertEqual(peticiones, [])
        self.assertTrue(any(self.esquemas["_mensajes"]["urls"].format(columna="Fuente") in m for m in mensajes), mensajes)

    def test_error_de_la_api_termina_con_codigo_distinto_de_cero(self):
        codigo, mensajes, _ = self.correr(ENC_PROY + fila_proyecto(), estado=500)
        self.assertNotEqual(codigo, 0)
        self.assertIn("falla simulada", "\n".join(mensajes))


if __name__ == "__main__":
    unittest.main()
